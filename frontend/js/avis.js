const params = new URLSearchParams(window.location.search)
const reservationId = params.get('reservation')
let noteChoisie = 0

function afficherErreur(message) {
  const contenu = document.getElementById('contenu')
  contenu.textContent = ''
  const etat = document.createElement('div')
  etat.className = 'etat'
  const emoji = document.createElement('div')
  emoji.className = 'etat-emoji'
  emoji.textContent = '😕'
  const h2 = document.createElement('h2')
  h2.textContent = 'Impossible de continuer'
  const p = document.createElement('p')
  p.textContent = message
  etat.appendChild(emoji)
  etat.appendChild(h2)
  etat.appendChild(p)
  contenu.appendChild(etat)
}

function afficherSucces() {
  const contenu = document.getElementById('contenu')
  contenu.textContent = ''
  const etat = document.createElement('div')
  etat.className = 'etat'
  const emoji = document.createElement('div')
  emoji.className = 'etat-emoji'
  emoji.textContent = '✅'
  const h2 = document.createElement('h2')
  h2.textContent = 'Merci pour votre avis !'
  const p = document.createElement('p')
  p.textContent = 'Il sera publié après vérification par notre équipe.'
  etat.appendChild(emoji)
  etat.appendChild(h2)
  etat.appendChild(p)
  contenu.appendChild(etat)
}

function construireFormulaire(clientNom) {
  const contenu = document.getElementById('contenu')
  contenu.textContent = ''

  const h1 = document.createElement('h1')
  h1.textContent = `Bonjour ${clientNom} 👋`
  const sous = document.createElement('p')
  sous.className = 'sous'
  sous.textContent = 'Comment était votre expérience avec ImmoCG ?'

  const starsDiv = document.createElement('div')
  starsDiv.className = 'stars'
  const etoiles = []
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span')
    star.className = 'star'
    star.textContent = '★'
    star.dataset.valeur = i
    star.addEventListener('click', () => {
      noteChoisie = i
      etoiles.forEach((s, idx) => s.classList.toggle('active', idx < i))
    })
    etoiles.push(star)
    starsDiv.appendChild(star)
  }

  const lblCommentaire = document.createElement('label')
  lblCommentaire.textContent = 'Votre commentaire (optionnel)'
  const textarea = document.createElement('textarea')
  textarea.id = 'commentaire'
  textarea.rows = 4
  textarea.placeholder = 'Partagez votre expérience...'

  const erreurEl = document.createElement('div')
  erreurEl.className = 'erreur'
  erreurEl.id = 'erreur'

  const btn = document.createElement('button')
  btn.id = 'btn-envoyer'
  btn.textContent = '⭐ Envoyer mon avis'

  btn.addEventListener('click', async () => {
    if (noteChoisie < 1) {
      erreurEl.textContent = 'Veuillez choisir une note (1 à 5 étoiles).'
      erreurEl.style.display = 'block'
      return
    }
    erreurEl.style.display = 'none'
    btn.textContent = 'Envoi...'
    btn.disabled = true

    try {
      const r = await fetch('/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId,
          note: noteChoisie,
          commentaire: textarea.value.trim()
        })
      })
      const data = await r.json()
      if (data.success) {
        afficherSucces()
      } else {
        erreurEl.textContent = data.message || 'Erreur lors de l\'envoi.'
        erreurEl.style.display = 'block'
        btn.textContent = '⭐ Envoyer mon avis'
        btn.disabled = false
      }
    } catch {
      erreurEl.textContent = 'Erreur de connexion. Réessayez.'
      erreurEl.style.display = 'block'
      btn.textContent = '⭐ Envoyer mon avis'
      btn.disabled = false
    }
  })

  contenu.appendChild(h1)
  contenu.appendChild(sous)
  contenu.appendChild(starsDiv)
  contenu.appendChild(lblCommentaire)
  contenu.appendChild(textarea)
  contenu.appendChild(erreurEl)
  contenu.appendChild(btn)
}

async function init() {
  if (!reservationId) {
    afficherErreur('Lien invalide — aucune réservation spécifiée.')
    return
  }
  try {
    const r = await fetch('/avis/verifier/' + encodeURIComponent(reservationId))
    const data = await r.json()
    if (!data.success) {
      afficherErreur(data.message || 'Ce lien n\'est plus valide.')
      return
    }
    construireFormulaire(data.client_nom)
  } catch {
    afficherErreur('Erreur de connexion. Vérifiez votre réseau.')
  }
}

init()
