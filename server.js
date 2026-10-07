'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const prompt = require('./chatbot-prompt');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8765);
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
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
