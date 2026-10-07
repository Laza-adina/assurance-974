(() => {
  const clients = [
    { id:1,name:'Élodie Payet', initials:'EP', product:'Assurance auto', city:'Saint-Paul', days:4, date:'11 octobre', channel:'SMS', color:'mint' },
    { id:2,name:'Mathieu Hoarau', initials:'MH', product:'Multirisque habitation', city:'Saint-Pierre', days:8, date:'15 octobre', channel:'E-mail', color:'sand' },
    { id:3,name:'Nadia Fontaine', initials:'NF', product:'Complémentaire santé', city:'Saint-Denis', days:13, date:'20 octobre', channel:'SMS', color:'lavender' },
    { id:4,name:'Lucas Rivière', initials:'LR', product:'Assurance professionnelle', city:'Saint-André', days:21, date:'28 octobre', channel:'E-mail', color:'blue' },
    { id:5,name:'Anaïs Dijoux', initials:'AD', product:'Assurance emprunteur', city:'Le Tampon', days:29, date:'5 novembre', channel:'SMS', color:'peach' }
  ];
  const sent = new Set();
  const list = document.getElementById('clientList');
  const modal = document.getElementById('crmModalBackdrop');
  let activeClient = null;
  let queue = [];

  function notify(text) {
    const toast = document.createElement('div'); toast.className='crm-toast'; toast.textContent=text;
    document.body.appendChild(toast); setTimeout(()=>toast.classList.add('show'),10); setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),250)},3400);
  }
  function render() {
    list.replaceChildren();
    clients.forEach(client => {
      const item=document.createElement('article'); item.className=`crm-client ${sent.has(client.id)?'is-sent':''}`;
      const urgency=client.days<=8?'urgent':client.days<=14?'soon':'later';
      item.innerHTML=`<span class="crm-avatar ${client.color}">${client.initials}</span><div class="crm-client-main"><strong>${client.name}</strong><span>${client.product} · ${client.city}</span></div><span class="crm-due ${urgency}"><b>${client.days} j</b><small>${client.date}</small></span><span class="crm-status ${sent.has(client.id)?'sent':''}">${sent.has(client.id)?'Relance envoyée':'À relancer'}</span><button class="crm-remind-button" data-client="${client.id}" ${sent.has(client.id)?'disabled':''}>${sent.has(client.id)?'Envoyée':'Relancer'}</button>`;
      list.appendChild(item);
    });
    document.getElementById('sentCount').textContent=String(sent.size);
    document.getElementById('dueCount').textContent=String(clients.length-sent.size);
    document.querySelectorAll('.crm-remind-button:not(:disabled)').forEach(button=>button.addEventListener('click',()=>openDraft(clients.find(c=>c.id===Number(button.dataset.client)))));
  }
  function makeMessage(client) {
    return `Bonjour ${client.name.split(' ')[0]},\n\nVotre contrat ${client.product.toLowerCase()} arrive à échéance le ${client.date}. Nous vous proposons de faire le point sur votre situation et vos besoins avant cette date.\n\nSouhaitez-vous être rappelé(e) par un conseiller Assurances 974 ?\n\nBien cordialement,\nVotre équipe Assurances 974\n06 92 94 16 17`;
  }
  function openDraft(client) {
    activeClient=client; queue=[];
    document.getElementById('modalKicker').textContent=`Relance · ${client.channel}`;
    document.getElementById('modalTitle').textContent=`Écrire à ${client.name}`;
    document.getElementById('modalIntro').textContent=`Échéance dans ${client.days} jours · ${client.product} · ${client.city}`;
    document.getElementById('draftMessage').value=makeMessage(client);
    document.getElementById('sendDraft').textContent='Envoyer la relance →';
    modal.hidden=false; document.getElementById('draftMessage').focus();
  }
  function openBatch() {
    queue=clients.filter(c=>!sent.has(c.id)); activeClient=null;
    if(!queue.length){notify('Toutes les relances de démonstration sont déjà marquées comme envoyées.');return;}
    showBatchDraft();
  }
  function showBatchDraft() {
    const client=queue[0]; activeClient=client;
    document.getElementById('modalKicker').textContent=`Relance ${sent.size+1} sur ${clients.length} · ${client.channel}`;
    document.getElementById('modalTitle').textContent=`Préparer le message pour ${client.name}`;
    document.getElementById('modalIntro').textContent=`Échéance dans ${client.days} jours · ${client.product} · ${client.city}`;
    document.getElementById('draftMessage').value=makeMessage(client);
    document.getElementById('sendDraft').textContent=queue.length>1?'Envoyer et passer au suivant →':'Envoyer la dernière relance →';
    modal.hidden=false;
  }
  function closeModal() { modal.hidden=true; activeClient=null; queue=[]; }
  document.getElementById('sendDraft').addEventListener('click',()=>{
    if(!activeClient)return;
    sent.add(activeClient.id); render();
    if(queue.length>1){queue.shift();notify(`Relance simulée envoyée à ${activeClient.name}. Préparation du message suivant…`);showBatchDraft();return;}
    const name=activeClient.name; closeModal(); notify(`Message envoyé à ${name} · simulation`);
  });
  document.getElementById('draftAllButton').addEventListener('click',openBatch);
  document.getElementById('crmAssistantButton').addEventListener('click',()=>{document.getElementById('assistantInsight').textContent='Conseil de suivi : commencez par les échéances les plus proches. Personnalisez chaque message et proposez un échange, sans supposer que la personne souhaite renouveler son contrat.';notify('Conseil de l’assistant mis à jour.');});
  document.getElementById('explainButton').addEventListener('click',()=>{document.getElementById('assistantInsight').textContent='Une relance anticipée laisse au client le temps de poser ses questions et de vérifier ses besoins. Le contrat, les garanties et le tarif doivent être revus avec un conseiller; l’assistant ne décide pas du renouvellement.';});
  document.getElementById('closeModal').addEventListener('click',closeModal);
  document.getElementById('cancelDraft').addEventListener('click',closeModal);
  modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
  document.getElementById('dismissNotification').addEventListener('click',()=>document.getElementById('crmNotification').remove());
  render();
  setTimeout(()=>document.getElementById('crmNotification')?.classList.add('visible'),650);
})();
