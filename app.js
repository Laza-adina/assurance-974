(() => {
  const iconPaths = {
    car:'<path d="M5 17h14l1.2-5.6a2 2 0 0 0-2-2.4H5.8a2 2 0 0 0-2 2.4L5 17Z"/><path d="M7 9l1.3-3h7.4L17 9M5 17v2m14-2v2M6 13h.01M18 13h.01M7 17v1m10-1v1"/>',
    health:'<path d="M12 21s-8-4.4-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.6-8 11-8 11Z"/><path d="M9 12h6m-3-3v6"/>',
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/>',
    flower:'<path d="M12 12c-1-5 4-7 6-4s-1 6-6 4Zm0 0c5-1 7 4 4 6s-6-1-4-6Zm0 0c1 5-4 7-6 4s1-6 6-4Zm0 0c-5 1-7-4-4-6s6 1 4 6Z"/><circle cx="12" cy="12" r="2"/><path d="M12 14v7"/>',
    homeShield:'<path d="m3 10 9-7 9 7v4"/><path d="M5 9v11h6"/><path d="m17 14 4 1.5v3c0 2-1.4 3.4-4 4.5-2.6-1.1-4-2.5-4-4.5v-3l4-1.5Z"/><path d="m15.5 18 1.1 1.1 2-2.2"/>',
    scale:'<path d="M12 3v18m-6 0h12M5 7h14M5 7l-3 7h6L5 7Zm14 0-3 7h6l-3-7Z"/><path d="M8 3h8"/>',
    paw:'<ellipse cx="12" cy="16.5" rx="5.5" ry="4"/><ellipse cx="5.5" cy="10" rx="2" ry="2.7"/><ellipse cx="10" cy="6.8" rx="2" ry="2.6"/><ellipse cx="15" cy="6.8" rx="2" ry="2.6"/><ellipse cx="18.5" cy="10" rx="2" ry="2.7"/>',
    briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2"/>',
    pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    heart:'<path d="M20.8 8.7c0 5.2-8.8 11.3-8.8 11.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"/>',
    check:'<path d="m5 12 4.5 4.5L19 7"/>',
    sparkles:'<path d="m12 3 1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.6 1.9L7.5 5.5l-1.9.6L5 8l-.6-1.9-1.9-.6 1.9-.6L5 3Z"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    building:'<path d="M4 21V4h11v17M15 9h5v12M8 8h3m-3 4h3m-3 4h3m7-3h2m-2 4h2M2 21h20"/>'
  };
  function iconSvg(name, size=20) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('width',String(size)); svg.setAttribute('height',String(size));
    svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.7'); svg.setAttribute('stroke-linecap','round'); svg.setAttribute('stroke-linejoin','round'); svg.setAttribute('aria-hidden','true');
    svg.innerHTML=iconPaths[name]||iconPaths.sparkles; return svg;
  }
  const glyphs = new Map([
    ['⌁','car'],['＋','health'],['⌂','home'],['✿','flower'],['⌑','homeShield'],['⚖','scale'],['♧','paw'],['▥','briefcase'],['⌖','pin'],['♡','heart'],['✓','check'],['▤','building'],['✳','sparkles'],['☰','menu']
  ]);
  document.querySelectorAll('.quick-icon,.float-icon,.bot-badge,.menu-toggle').forEach(el=>{
    const name=glyphs.get(el.textContent.trim()); if(!name)return;
    el.replaceChildren(iconSvg(name,el.classList.contains('quick-icon')?19:20));
  });

  const launch = document.getElementById('assistantLaunch');
  const panel = document.getElementById('chatPanel');
  const close = document.getElementById('chatClose');
  const body = document.getElementById('chatBody');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const nav = document.getElementById('navlinks');
  const menu = document.getElementById('menuToggle');
  let welcomeShown = false;
  let flow = null;

  const topics = [
    ['Auto & moto','auto'],['Santé','sante'],['Habitation','habitation'],
    ['Obsèques & prévoyance','prevoyance'],['Assurance emprunteur','emprunteur'],
    ['Protection juridique','juridique'],['Animaux','animaux'],['Professionnel','pro']
  ];
  const directory = {
    assurance: 'Nos solutions couvrent notamment l’auto, la moto, l’habitation, la santé, l’assurance emprunteur, la protection juridique, les animaux, la prévoyance et les besoins professionnels. Je peux vous aider à trouver une page ou préparer une comparaison de critères.',
    agence: 'Les quatre points d’accueil affichés sont à Saint-Leu, Saint-Denis, Saint-Pierre et Saint-André. Les horaires doivent être confirmés par téléphone avant déplacement : 06 92 94 16 17.',
    contact: 'Vous pouvez appeler le 06 92 94 16 17 ou écrire à ssp-contact@assurances974.com. Je peux aussi préparer une demande de rappel de démonstration, sans transmettre vos informations.',
    resiliation: 'La démarche dépend de votre contrat et de votre situation. Je peux vous orienter vers un conseiller, mais je ne peux pas résilier un contrat ni confirmer votre éligibilité dans cette démo.',
    sinistre: 'En cas de sinistre, contactez d’abord l’assureur qui porte votre contrat et suivez les délais de vos documents. Appelez le 06 92 94 16 17 pour être orienté. Ne partagez pas de numéro de contrat ni de document ici.',
    compare: 'Je peux vous aider à préparer une comparaison en listant les critères utiles. Je n’ai pas accès aux offres, aux garanties actualisées ni aux tarifs des partenaires : aucun classement ni devis réel ne sera produit.'
  };

  function message(text, who='bot') {
    const el = document.createElement('div'); el.className = `msg ${who}`; el.textContent = text;
    body.appendChild(el); body.scrollTop = body.scrollHeight; return el;
  }
  function choices(items) {
    const box = document.createElement('div'); box.className = 'quick-replies';
    items.forEach(item => { const b = document.createElement('button'); b.type='button'; b.textContent=item.label; b.dataset.action=item.action; if(item.value) b.dataset.value=item.value; box.appendChild(b); });
    body.appendChild(box); body.scrollTop = body.scrollHeight;
  }
  function linkCard(label, href) {
    const a=document.createElement('a'); a.href=href; a.className='msg bot'; a.style.cssText='color:#126d68;font-weight:700;text-decoration:underline'; a.textContent=label; body.appendChild(a); body.scrollTop=body.scrollHeight;
  }
  function sayWelcome() {
    if (welcomeShown) return; welcomeShown=true;
    message('Bonjour ! Je suis l’assistant de démonstration d’Assurances 974. Je peux vous aider à trouver une solution, comparer des critères ou vous orienter vers un conseiller.');
    choices([{label:'Trouver une solution',action:'find'},{label:'Comparer des critères',action:'compare'},{label:'Trouver une agence',action:'agency'},{label:'Poser une question',action:'question'}]);
  }
  function open(startAction) { panel.classList.add('open'); panel.setAttribute('aria-hidden','false'); launch.setAttribute('aria-expanded','true'); sayWelcome(); if(startAction) runAction(startAction); setTimeout(()=>input.focus(),80); }
  function shut() { panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); launch.setAttribute('aria-expanded','false'); launch.focus(); }
  function startFind() { flow={kind:'find',step:'topic'}; message('D’accord. Quel sujet voulez-vous explorer ? Aucun renseignement personnel n’est nécessaire.'); choices(topics.map(([label,value])=>({label,action:'find-topic',value}))); }
  function startCompare() { flow={kind:'compare',step:'topic'}; message('Choisissez le type d’assurance. Nous allons préparer une liste de critères à comparer; les tarifs et offres réels nécessitent une étude par un conseiller.'); choices(topics.map(([label,value])=>({label,action:'compare-topic',value}))); }
  function topicInfo(value) {
    const found=topics.find(t=>t[1]===value); return found?found[0]:'assurance';
  }
  function continueFind(value) {
    message(topicInfo(value),'user');
    flow.topic=value; flow.step='audience';
    message(`Pour ${topicInfo(value)}, cherchez-vous une solution pour vous/votre famille ou pour une activité professionnelle ?`);
    choices([{label:'Moi / ma famille',action:'find-audience',value:'particulier'},{label:'Mon activité professionnelle',action:'find-audience',value:'professionnel'}]);
  }
  function resolveFind(audience) {
    const topic=flow.topic; const title=topicInfo(topic); flow=null;
    let note=`Pour ${title.toLowerCase()}, le bon point de départ est de préciser votre besoin et les garanties déjà en place. Un conseiller peut étudier les solutions disponibles et vous expliquer leurs différences. Cette démo ne formule pas de recommandation de contrat.`;
    if(audience==='professionnel') note=`Pour votre activité professionnelle, préparez une description générale de l’activité et des protections recherchées. Un conseiller pourra identifier les garanties à étudier. Cette démo ne formule pas de recommandation de contrat.`;
    message(note);
    const slug=topic==='pro'?'professionnels.html':`assurances.html#${topic}`;
    linkCard(`Consulter la page ${title}`,slug);
    choices([{label:'Préparer une demande de rappel',action:'lead'},{label:'Comparer les critères',action:'compare'},{label:'Autre besoin',action:'find'}]);
  }
  function continueCompare(value) {
    message(topicInfo(value),'user');
    flow.topic=value; flow.step='priority';
    message(`Pour préparer votre comparaison ${topicInfo(value).toLowerCase()}, quel point voulez-vous examiner en priorité ?`);
    choices([{label:'Le budget',action:'compare-priority',value:'budget'},{label:'Le niveau des garanties',action:'compare-priority',value:'garanties'},{label:'Les exclusions et limites',action:'compare-priority',value:'exclusions'},{label:'Les services et franchises',action:'compare-priority',value:'services'}]);
  }
  function resolveCompare(value) {
    const topic=topicInfo(flow.topic); const selected={budget:'cotisation et évolution du tarif',garanties:'garanties incluses et plafonds',exclusions:'exclusions, limites et délais de carence',services:'franchises, assistance et modalités de gestion'}[value]; flow=null;
    message(`Votre grille de comparaison pour ${topic.toLowerCase()} peut commencer par :\n• ${selected}\n• besoins couverts et plafonds\n• exclusions et franchises\n• délais de carence et conditions de résiliation\n• services d’assistance et qualité du suivi\n\nAucun tarif ni nom d’offre n’est simulé ici. Le comparateur réel doit être alimenté par des données partenaires à jour et vérifié par un conseiller.`);
    choices([{label:'Préparer une demande de rappel',action:'lead'},{label:'Trouver cette assurance',action:'find'},{label:'Comparer un autre besoin',action:'compare'}]);
  }
  function startLead() {
    flow=null; message('Préparons une demande de rappel de démonstration. Le formulaire reste dans votre navigateur et aucun message ne sera envoyé. Pour joindre réellement l’équipe, appelez le 06 92 94 16 17.');
    const box=document.createElement('div'); box.className='msg bot'; box.style.width='100%';
    box.innerHTML='<form class="lead-form"><label style="font-size:10px">Prénom ou initiale<input name="name" required maxlength="24" placeholder="Ex. Camille" autocomplete="given-name"></label><label style="font-size:10px">Sujet<select name="topic"><option>Être orienté(e)</option><option>Auto & moto</option><option>Santé</option><option>Habitation</option><option>Obsèques & prévoyance</option><option>Assurance professionnelle</option><option>Autre</option></select></label><button>Tester le parcours</button><small style="color:#64767a;font-size:9px">Aucune transmission ni conservation en démo.</small></form>';
    body.appendChild(box); box.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const name=String(data.get('name')).trim();if(!name)return;box.remove();message(`Parcours testé : rappel demandé par « ${name} » pour « ${data.get('topic')} ». Aucune information n’a quitté cette page. Pour joindre l’équipe, appelez le 06 92 94 16 17.`);choices([{label:'Appeler le conseiller',action:'call'},{label:'Recommencer',action:'lead'}]);}); body.scrollTop=body.scrollHeight;
  }
  function runAction(action,value) {
    if(action==='find') return startFind(); if(action==='compare') return startCompare(); if(action==='lead') return startLead();
    if(action==='find-topic') return continueFind(value); if(action==='find-audience') return resolveFind(value);
    if(action==='compare-topic') return continueCompare(value); if(action==='compare-priority') return resolveCompare(value);
    if(action==='agency') {message(directory.agence);linkCard('Voir les agences et les itinéraires','agences.html');return;}
    if(action==='question') {message('Vous pouvez demander des informations générales sur les solutions, les agences, la résiliation ou les sinistres. Évitez de transmettre ici des données personnelles, médicales ou contractuelles.');choices([{label:'Les assurances',action:'answers',value:'assurance'},{label:'Une résiliation',action:'answers',value:'resiliation'},{label:'Un sinistre',action:'answers',value:'sinistre'},{label:'Nous contacter',action:'answers',value:'contact'}]);return;}
    if(action==='answers') {message(directory[value]||directory.assurance);return;}
    if(action==='call') {window.location.href='tel:+262692941617';return;}
  }
  function textQuestion(text) {
    const q=text.toLowerCase(); let key='assurance';
    if(/résili|resili/.test(q))key='resiliation'; else if(/sinistre|accident|dégât|degat/.test(q))key='sinistre'; else if(/agence|adresse|où|ou vous|saint/.test(q))key='agence'; else if(/téléphone|telephone|appeler|contact|mail|rappel/.test(q))key='contact'; else if(/compar|devis|prix|tarif/.test(q))key='compare';
    message(directory[key]);
    if(key==='agence')linkCard('Voir les agences et les itinéraires','agences.html');
    choices([{label:'Trouver une solution',action:'find'},{label:'Comparer des critères',action:'compare'},{label:'Demander un rappel',action:'lead'}]);
  }

  launch?.addEventListener('click',()=>open()); close?.addEventListener('click',shut);
  document.querySelectorAll('[data-open-chat]').forEach(el=>el.addEventListener('click',()=>open(el.dataset.chatAction||null)));
  document.querySelectorAll('[data-open-compare]').forEach(el=>el.addEventListener('click',()=>open('compare')));
  document.querySelectorAll('[data-open-find]').forEach(el=>el.addEventListener('click',()=>open('find')));
  const contactForm=document.getElementById('contactForm');
  contactForm?.addEventListener('submit',e=>{
    e.preventDefault();
    const data=new FormData(contactForm);
    const subject=`Assurances 974 — ${String(data.get('subject')||'Demande de contact')}`;
    const bodyText=`Bonjour,\n\n${String(data.get('message')||'')}\n\nNom : ${String(data.get('name')||'')}\nE-mail : ${String(data.get('email')||'')}`;
    window.location.href=`mailto:ssp-contact@assurances974.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  });
  body?.addEventListener('click',e=>{const button=e.target.closest('button[data-action]');if(button)runAction(button.dataset.action,button.dataset.value);});
  form?.addEventListener('submit',e=>{e.preventDefault();const value=input.value.trim();input.value='';if(value)textQuestion(value);});
  menu?.addEventListener('click',()=>{const state=nav.classList.toggle('open');menu.setAttribute('aria-expanded',state?'true':'false');});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');}));
  document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));
})();
