'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const prompt = require('./chatbot-prompt');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8765);
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const CRM_DATA = path.join(ROOT, 'data', 'crm-demo.json');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml' };

function loadLocalEnv() {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !Object.hasOwn(process.env, match[1])) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
loadLocalEnv();

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(JSON.stringify(data));
}

function readCrm() {
  try { return JSON.parse(fs.readFileSync(CRM_DATA, 'utf8')); }
  catch { return { prospects:[], clients:[], calls:[], reminders:[], consents:[] }; }
}

async function crmApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/crm') return json(res, 200, readCrm());
  if (req.method === 'GET' && url.pathname === '/api/crm/modules') return json(res, 200, readCrm().modules || {});
  if (req.method !== 'POST') return json(res, 405, { error:'Méthode non autorisée.' });
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 50000) return json(res, 413, { error:'Requête trop volumineuse.' }); }
  let payload;
  try { payload = JSON.parse(raw); } catch { return json(res, 400, { error:'Requête invalide.' }); }
  const data = readCrm();
  if (url.pathname === '/api/crm/modules') {
    if (req.method === 'GET') return json(res, 200, data.modules || {});
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json(res, 400, { error:'Données de modules invalides.' });
    const allowed = ['appointments','quotes','invoices','subscriptions','products','contracts','reviews','notifications','settings','team'];
    const next = { ...(data.modules || {}) };
    for (const key of allowed) if (Array.isArray(payload[key]) || (key === 'settings' && payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key]))) next[key] = payload[key];
    data.modules = next;
    fs.mkdirSync(path.dirname(CRM_DATA), { recursive:true }); fs.writeFileSync(CRM_DATA, JSON.stringify(data, null, 2));
    return json(res, 200, { ok:true, modules:next });
  }
  if (url.pathname === '/api/crm/prospects') {
    if (!payload.consent || !payload.prospect?.company || !payload.prospect?.contact) return json(res, 400, { error:'Validation et consentement requis.' });
    const prospect = { ...payload.prospect, id:`p${Date.now()}`, status:'À appeler', priority:'B', source:'Assistant virtuel', owner:'Conseiller', createdAt:new Date().toISOString() };
    data.prospects.unshift(prospect);
    data.consents.push({ id:`consent-${Date.now()}`, prospectId:prospect.id, accepted:true, purpose:'Enregistrement de la demande et rappel par un conseiller', acceptedAt:new Date().toISOString(), channel:'Assistant virtuel' });
    data.modules = data.modules || {};
    data.modules.notifications = Array.isArray(data.modules.notifications) ? data.modules.notifications : [];
    const isCallback = /rappel/i.test(prospect.nextAction || '');
    data.modules.notifications.unshift({ id:`NT-LEAD-${prospect.id}`, prospectId:prospect.id, date:new Date().toISOString().slice(0,10), client:prospect.contact, type:isCallback?'Rappel':'Rendez-vous', text:`Nouvelle demande de ${isCallback?'rappel':'rendez-vous'} via l’assistant. Besoin : ${prospect.need || 'à préciser'}. Ville ou agence : ${prospect.city || 'à préciser'}. À prendre en charge par un conseiller.`, status:'À traiter', source:'Assistant virtuel' });
    fs.mkdirSync(path.dirname(CRM_DATA), { recursive:true }); fs.writeFileSync(CRM_DATA, JSON.stringify(data, null, 2));
    return json(res, 201, { data, prospect });
  }
  if (url.pathname === '/api/crm/state') {
    for (const key of ['prospects','clients','calls','reminders','consents']) if (Array.isArray(payload[key])) data[key] = payload[key];
    fs.mkdirSync(path.dirname(CRM_DATA), { recursive:true }); fs.writeFileSync(CRM_DATA, JSON.stringify(data, null, 2));
    return json(res, 200, { ok:true });
  }
  if (url.pathname === '/api/crm/analyze') {
    const snapshot = JSON.stringify({ prospects:data.prospects, clients:data.clients, calls:data.calls.slice(-10), modules:data.modules || {} }).slice(0,18000);
    const fallback = localInsuranceAnalysis(data);
    if (!process.env.GROQ_API_KEY) return json(res, 200, { analysis:fallback, source:'local' });
    try {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', { method:'POST', headers:{ Authorization:`Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type':'application/json' }, body:JSON.stringify({ model:MODEL, messages:[{ role:'system', content:'Tu es un assistant de suivi pour un courtier en assurances à La Réunion. Analyse uniquement les données fournies. Priorise les rappels clients, échéances de contrats et devis à suivre. Ne conclus jamais sur une garantie ou un tarif. Rédige en français simple, sans Markdown (pas de ** ni titres #), avec 3 à 5 actions concrètes et les noms concernés.' },{ role:'user', content:`Date du jour : ${new Date().toLocaleDateString('fr-FR')}. Données CRM de démonstration : ${snapshot}` }], temperature:0.2, max_completion_tokens:550 }), signal:AbortSignal.timeout(25000) });
      if (!upstream.ok) return json(res, 200, { analysis:fallback, source:'local' });
      const result = await upstream.json(); return json(res, 200, { analysis:result.choices?.[0]?.message?.content?.replace(/\*\*?|__?|```|^#{1,6}\s*/gm,'').trim() || fallback, source:'groq' });
    } catch { return json(res, 200, { analysis:fallback, source:'local' }); }
  }
  return json(res, 404, { error:'Route CRM introuvable.' });
}

function localInsuranceAnalysis(data) {
  const now = new Date(); const due = data.clients.map(c => ({...c, daysLeft:Math.ceil((new Date(`${c.dateIso}T12:00:00`) - now) / 86400000)})).filter(c => c.daysLeft >= 0 && c.daysLeft <= 30).sort((a,b)=>a.daysLeft-b.daysLeft);
  const modules = data.modules || {}; const contracts = (modules.contracts || []).filter(c => c.renewalDate && c.renewalDate <= new Date(Date.now()+30*86400000).toISOString().slice(0,10) && !['Résilié','Clos'].includes(c.status));
  const overdue = (modules.invoices || []).filter(i => i.status === 'En retard'); const rdvs = (modules.appointments || []).filter(a => a.date >= now.toISOString().slice(0,10) && a.status !== 'Annulé');
  const pendingQuotes = (modules.quotes || []).filter(q => q.status === 'Envoyé');
  const callbacks = data.prospects.filter(p => ['Rappeler','Pas de réponse'].includes(p.status)).slice(0,4);
  const quotes = data.prospects.filter(p => p.status === 'Devis envoyé' || p.status === 'Intéressé').slice(0,3);
  const lines = [`Synthèse de suivi assurance — ${due.length} échéance(s) à préparer dans les 30 jours.`];
  due.forEach(c => lines.push(`${c.name} : ${c.product}, échéance dans ${c.daysLeft} jour(s). Vérifier les besoins et proposer un échange avant renouvellement.`));
  callbacks.forEach(p => lines.push(`${p.contact} (${p.company}) : rappel à planifier. Dernière note : ${p.note || 'aucune note'}`));
  quotes.forEach(p => lines.push(`${p.contact} (${p.company}) : reprendre contact pour expliquer le devis ${p.need}.`));
  contracts.forEach(c => lines.push(`${c.client} : renouvellement du contrat ${c.id} prévu le ${new Intl.DateTimeFormat('fr-FR').format(new Date(`${c.renewalDate}T12:00:00`))}. Préparer une prise de contact.`));
  overdue.forEach(i => lines.push(`${i.client} : l’échéance simulée ${i.id} est signalée en retard. Vérifier la situation avec le conseiller.`));
  pendingQuotes.forEach(q => lines.push(`${q.client} : devis ${q.id} envoyé, réponse à suivre.`));
  if (rdvs.length) lines.push(`${rdvs.length} rendez-vous à venir dans l’agenda : vérifier les confirmations et préparer les dossiers.`);
  if (!due.length && !callbacks.length && !quotes.length) lines.push('Aucune relance prioritaire détectée. Vérifier les prochains rendez-vous et tenir les dossiers à jour.');
  lines.push('Conseil : consigner chaque échange et laisser un conseiller confirmer les garanties et conditions du contrat.');
  return lines.join('\n');
}

async function chat(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error:'Méthode non autorisée.' });
  if (!process.env.GROQ_API_KEY) return json(res, 503, { error:'Configurez GROQ_API_KEY dans .env.local pour activer le chatbot.' });
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16000) return json(res, 413, { error:'Message trop long.' });
  }
  let payload;
  try { payload = JSON.parse(raw); } catch { return json(res, 400, { error:'Requête invalide.' }); }
  if (!Array.isArray(payload.messages) || payload.messages.length < 1) return json(res, 400, { error:'Aucun message reçu.' });
  const messages = payload.messages.slice(-12).filter(m => ['user','assistant'].includes(m?.role) && typeof m.content === 'string').map(m => ({ role:m.role, content:m.content.slice(0,1800) }));
  if (!messages.length || messages.at(-1).role !== 'user') return json(res, 400, { error:'Message utilisateur invalide.' });
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST', headers:{ 'Authorization':`Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type':'application/json' },
      body:JSON.stringify({ model:MODEL, messages:[{role:'system',content:prompt},...messages], temperature:0.3, max_completion_tokens:450, stream:false }),
      signal:AbortSignal.timeout(30000)
    });
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      return json(res, status, { error:status === 429 ? 'Le service reçoit trop de demandes. Réessayez dans un instant.' : 'Le service IA est temporairement indisponible.' });
    }
    const result = await upstream.json();
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) return json(res, 502, { error:'Réponse indisponible.' });
    return json(res, 200, { answer:answer.replace(/\*\*?|__?|```|^#{1,6}\s*/gm, '').trim() });
  } catch {
    return json(res, 502, { error:'Connexion au service IA impossible pour le moment.' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/chat') return chat(req, res);
  if (url.pathname.startsWith('/api/crm')) return crmApi(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error:'Méthode non autorisée.' });
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  if (pathname === '/') pathname = '/index.html';
  const target = path.resolve(ROOT, `.${pathname}`);
  if (!target.startsWith(ROOT + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404); return res.end('Introuvable'); }
  res.writeHead(200, { 'Content-Type':MIME[path.extname(target).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(target).pipe(res);
});
server.listen(PORT, () => console.log(`Assurances 974 disponible sur http://localhost:${PORT}`));
