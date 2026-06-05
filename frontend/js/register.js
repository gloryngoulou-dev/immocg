async function sInscrire() {
      const nom_agence = document.getElementById('nom_agence').value
      const nom = document.getElementById('nom').value
      const telephone = document.getElementById('telephone').value
      const email = document.getElementById('email').value
      const mot_de_passe = document.getElementById('mot_de_passe').value
      const btn = document.getElementById('btn-register')

      if (!nom_agence || !nom || !email || !mot_de_passe || !telephone) {
        afficherMessage('Veuillez remplir tous les champs.', 'error')
        return
      }

      if (mot_de_passe.length < 6) {
        afficherMessage('Le mot de passe doit faire au moins 6 caractères.', 'error')
        return
      }

      btn.disabled = true
      btn.textContent = 'Envoi en cours...'

      try {
        const r = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom_agence, nom, telephone, email, mot_de_passe })
        })
        const data = await r.json()

        if (data.success) {
          afficherMessage('✅ Demande envoyée ! Notre équipe va examiner votre dossier sous 24h.', 'success')
          btn.textContent = 'Demande envoyée'
        } else {
          afficherMessage(data.message, 'error')
          btn.disabled = false
          btn.textContent = 'Envoyer ma demande'
        }
      } catch (err) {
        afficherMessage('Erreur de connexion au serveur.', 'error')
        btn.disabled = false
        btn.textContent = 'Envoyer ma demande'
      }

      const conditions = document.getElementById('conditions').checked
if (!conditions) {
  afficherMessage('Veuillez accepter les conditions du partenariat.', 'error')
  return
}

    }

    function afficherMessage(msg, type) {
      const el = document.getElementById('message')
      el.textContent = msg
      el.className = 'message ' + type
    }
  

window.sInscrire = sInscrire