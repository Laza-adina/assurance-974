(() => {
  const endpoint = '/api/chat';
  function localAnswer(question) {
    const q = question.toLocaleLowerCase('fr');
    if (/^(bonjour|bonsoir|salut|coucou|hello|hey|yo|cc|bjr)[\s!.?,]*$/.test(q.trim())) return 'Bonjour et bienvenue chez Assurances 974 ! Que puis-je faire pour vous ? Je peux vous présenter nos assurances, vous aider à comparer les critères importants, trouver une agence ou préparer une demande de rappel.';
    if (/^(merci|merci beaucoup|super merci|ok merci|d'accord merci|parfait merci)[\s!.?,]*$/.test(q.trim())) return 'Avec plaisir ! Avez-vous une autre question ou souhaitez-vous que je vous aide à trouver une assurance, comparer des critères ou contacter une agence ?';
    if (/^(ça va|comment ça va|comment allez-vous|qui es-tu|qui êtes-vous|que peux-tu faire|que pouvez-vous faire)[\s!?.,]*$/.test(q.trim())) return 'Je suis l’assistant virtuel d’Assurances 974. Je peux vous renseigner sur les assurances et les démarches, trouver une agence, comparer les critères à examiner ou préparer une demande de rappel. Qu’est-ce qui vous serait utile ?';
    if (/agence|adresse|saint-leu|saint-denis|saint-pierre|saint-andr|où/.test(q)) return 'Assurances 974 présente des agences à Saint-Leu, Saint-Denis, Saint-Pierre et Saint-André. Vous pouvez consulter les adresses et ouvrir un itinéraire dans la page « Nos agences ». Pour confirmer les horaires, appelez le 06 92 94 16 17.';
    if (/rappel|rappeler|rendez-vous|rendez vous|rdv|réserver|reservation/.test(q)) return 'Je peux préparer une demande de rappel ou de rendez-vous. Choisissez « Demander un rappel » pour indiquer votre préférence; un conseiller vous recontactera pour confirmer.';
    if (/résili|resili/.test(q)) return 'Les possibilités de résiliation dépendent du contrat, de sa date et du motif. Consultez les conditions de votre contrat et contactez votre assureur ou un conseiller au 06 92 94 16 17 pour vérifier votre situation.';
    if (/sinistre|accident|dégât|degat/.test(q)) return 'En cas de sinistre, contactez rapidement l’assureur indiqué sur votre contrat et suivez les délais qui y figurent. Pour être orienté, appelez le 06 92 94 16 17. Évitez de partager ici des numéros de contrat ou des documents.';
    if (/compar|devis|prix|tarif|garantie/.test(q)) return 'Pour comparer des assurances, regardez les garanties et plafonds, exclusions, franchises, délais de carence et services à garanties comparables. Je n’ai pas accès aux tarifs ou offres partenaires. Un conseiller peut étudier votre situation.';
    if (/contact|téléphone|telephone|mail|écrire|ecrire/.test(q)) return 'Vous pouvez appeler le 06 92 94 16 17 ou écrire à ssp-contact@assurances974.com. Je peux aussi préparer une demande de rappel à vérifier dans votre messagerie.';
    if (/auto|voiture|moto|santé|sante|habitation|logement|anim|profession|obsèques|obseques|emprunteur/.test(q)) return 'Je peux vous aider à explorer ce besoin et à préparer les critères utiles pour en parler avec un conseiller. Consultez « Nos assurances » ou choisissez « Trouver une solution » pour être orienté.';
    return 'Je peux vous renseigner sur les assurances, les agences et les démarches, ou vous aider à préparer un rappel. Pour une question précise sur un contrat ou une garantie, un conseiller pourra vérifier votre situation au 06 92 94 16 17.';
  }
  window.AssurancesChatbot = {
    async ask(question, history = []) {
      if (/^(bonjour|bonsoir|salut|coucou|hello|hey|yo|cc|bjr|merci|merci beaucoup|super merci|ok merci|d'accord merci|parfait merci|ça va|comment ça va|comment allez-vous|qui es-tu|qui êtes-vous|que peux-tu faire|que pouvez-vous faire)[\s!.?,]*$/i.test(question.trim())) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return localAnswer(question);
      }
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...history, { role: 'user', content: question }].slice(-12) })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.answer) return data.answer;
        }
      } catch { /* Static hosting or missing API: use the local guided assistant. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
      return localAnswer(question);
    }
  };
})();
