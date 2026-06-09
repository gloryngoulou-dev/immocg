// admin.js — script externe pour éviter les scripts inline (CSP)

// Vérifier que c'est un admin (cookie HttpOnly gère le token, on vérifie le rôle via user info)
const user = JSON.parse(localStorage.getItem('immocg_user') || 'null')

if (!user || user.role !== 'admin') {
  window.location.href = 'login.html'
}

document.getElementById('nav-user').textContent = user?.nom || ''

function afficherSection(nom, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.getElementById('section-' + nom).classList.add('active')
  btn.classList.add('active')
}

function seDeconnecter() {
  localStorage.removeItem('immocg_user')
  window.location.href = 'login.html'
}

function esc(val) {
  return String(val == null ? '' : val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

async function chargerBiens() {
  const r = await fetch('/biens?admin=true', { credentials: 'include' })
  const data = await r.json()
  const biens = data.biens || []

  document.getElementById('nb-biens').textContent = biens.filter(b => b.statut === 'disponible').length
  document.getElementById('nb-attente').textContent = biens.filter(b => b.statut === 'attente').length

  const tbody = document.getElementById('tbody-biens')
  tbody.textContent = ''

  if (biens.length === 0) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('colspan', '6')
    td.className = 'empty'
    td.textContent = 'Aucune annonce pour le moment'
    tr.appendChild(td)
    tbody.appendChild(tr)
    return
  }

  biens.forEach(b => {
    const tr = document.createElement('tr')
    const tdImg = document.createElement('td')
    const imgDiv = document.createElement('div')
    imgDiv.className = 'bien-img-mini'
    if (b.image_url) {
      try {
        const url = new URL(b.image_url)
        if (url.protocol === 'https:' || url.protocol === 'http:') {
          imgDiv.style.backgroundImage = `url(${CSS.escape(b.image_url)})`
          imgDiv.style.backgroundSize = 'cover'
          imgDiv.style.backgroundPosition = 'center'
          imgDiv.style.fontSize = '0'
        }
      } catch(e) { imgDiv.textContent = '🏠' }
    } else { imgDiv.textContent = '🏠' }
    tdImg.appendChild(imgDiv)
    tr.appendChild(tdImg)

    const tdType = document.createElement('td')
    const divType = document.createElement('div')
    divType.style.fontWeight = '500'
    divType.textContent = b.type
    const divTitre = document.createElement('div')
    divTitre.style.fontSize = '12px'
    divTitre.style.color = '#888780'
    divTitre.textContent = b.titre || ''
    tdType.appendChild(divType)
    tdType.appendChild(divTitre)
    tr.appendChild(tdType)

    const tdPrix = document.createElement('td')
    tdPrix.textContent = `${parseInt(b.prix).toLocaleString('fr-FR')} ${b.unite}`
    tr.appendChild(tdPrix)

    const tdLoc = document.createElement('td')
    tdLoc.textContent = `${b.quartier}, ${b.ville}`
    tr.appendChild(tdLoc)

    const tdStatut = document.createElement('td')
    const span = document.createElement('span')
    span.className = `badge ${b.statut === 'disponible' ? 'valide' : b.statut === 'attente' ? 'attente' : 'refuse'}`
    span.textContent = b.statut === 'disponible' ? 'Publié' : b.statut === 'attente' ? 'En attente' : b.statut
    tdStatut.appendChild(span)
    tr.appendChild(tdStatut)

    const tdActions = document.createElement('td')
    if (b.statut === 'attente') {
      const btnValider = document.createElement('button')
      btnValider.className = 'btn-sm btn-valider'
      btnValider.textContent = '✅ Valider'
      btnValider.addEventListener('click', () => changerStatutBien(b.id, 'disponible'))
      const btnRefuser = document.createElement('button')
      btnRefuser.className = 'btn-sm btn-refuser'
      btnRefuser.textContent = '❌ Refuser'
      btnRefuser.addEventListener('click', () => changerStatutBien(b.id, 'refuse'))
      tdActions.appendChild(btnValider)
      tdActions.appendChild(btnRefuser)
    }
    const btnVoir = document.createElement('button')
    btnVoir.className = 'btn-sm btn-voir'
    btnVoir.textContent = 'Voir'
    btnVoir.addEventListener('click', () => window.open('bien.html?id=' + encodeURIComponent(b.id)))
    const btnSupp = document.createElement('button')
    btnSupp.className = 'btn-sm btn-supprimer'
    btnSupp.textContent = 'Supprimer'
    btnSupp.addEventListener('click', () => supprimerBien(b.id))
    tdActions.appendChild(btnVoir)
    tdActions.appendChild(btnSupp)
    tr.appendChild(tdActions)
    tbody.appendChild(tr)
  })
}

async function changerStatutBien(id, statut) {
  await fetch('/biens/' + id + '/statut', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ statut })
  })
  chargerBiens()
}

async function chargerAgences() {
  const r = await fetch('/auth/users', { credentials: 'include' })
  const data = await r.json()
  const users = data.users || []

  document.getElementById('nb-agences').textContent = users.filter(u => u.role === 'agence').length
  document.getElementById('nb-actives').textContent = users.filter(u => u.role === 'agence' && u.actif).length

  const tbody = document.getElementById('tbody-agences')
  tbody.textContent = ''

  if (users.length === 0) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('colspan', '6')
    td.className = 'empty'
    td.textContent = 'Aucune agence inscrite'
    tr.appendChild(td)
    tbody.appendChild(tr)
    return
  }

  users.forEach(u => {
    const tr = document.createElement('tr')

    const tdNom = document.createElement('td')
    const divAgence = document.createElement('div')
    divAgence.style.fontWeight = '500'
    divAgence.textContent = u.nom_agence || u.nom
    const divNom = document.createElement('div')
    divNom.style.fontSize = '12px'
    divNom.style.color = '#888780'
    divNom.textContent = u.nom
    tdNom.appendChild(divAgence)
    tdNom.appendChild(divNom)
    tr.appendChild(tdNom)

    const tdContact = document.createElement('td')
    const divEmail = document.createElement('div')
    divEmail.textContent = u.email
    const divTel = document.createElement('div')
    divTel.style.fontSize = '12px'
    divTel.style.color = '#888780'
    divTel.textContent = u.telephone || '—'
    tdContact.appendChild(divEmail)
    tdContact.appendChild(divTel)
    tr.appendChild(tdContact)

    const tdRole = document.createElement('td')
    const spanRole = document.createElement('span')
    spanRole.className = `badge ${u.role}`
    spanRole.textContent = u.role
    tdRole.appendChild(spanRole)
    tr.appendChild(tdRole)

    const tdStatut = document.createElement('td')
    const spanStatut = document.createElement('span')
    spanStatut.className = `badge ${u.actif ? 'valide' : 'attente'}`
    spanStatut.textContent = u.actif ? 'Actif' : 'En attente'
    tdStatut.appendChild(spanStatut)
    tr.appendChild(tdStatut)

    const tdDate = document.createElement('td')
    tdDate.style.fontSize = '12px'
    tdDate.style.color = '#888780'
    tdDate.textContent = new Date(u.created_at).toLocaleDateString('fr-FR')
    tr.appendChild(tdDate)

    const tdActions = document.createElement('td')
    if (!u.actif && u.role !== 'admin') {
      const btn = document.createElement('button')
      btn.className = 'btn-sm btn-valider'
      btn.textContent = 'Activer'
      btn.addEventListener('click', () => activerUser(u.id, true))
      tdActions.appendChild(btn)
    }
    if (u.actif && u.role !== 'admin') {
      const btn = document.createElement('button')
      btn.className = 'btn-sm btn-refuser'
      btn.textContent = 'Désactiver'
      btn.addEventListener('click', () => activerUser(u.id, false))
      tdActions.appendChild(btn)
    }
    tr.appendChild(tdActions)
    tbody.appendChild(tr)
  })
}

async function supprimerBien(id) {
  if (!confirm('Supprimer cette annonce ?')) return
  await fetch('/biens/' + id, { method: 'DELETE', credentials: 'include' })
  chargerBiens()
}

async function activerUser(id, actif) {
  await fetch('/auth/users/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ actif })
  })
  chargerAgences()
}

chargerBiens()
chargerAgences()

window.afficherSection = afficherSection
window.seDeconnecter = seDeconnecter

async function chargerReservationsAdmin() {
  try {
    // Admin voit toutes les réservations via une route dédiée
    const r = await fetch('/reservations/admin', { credentials: 'include' })
    if (!r.ok) return
    const data = await r.json()
    const reservations = data.reservations || []

    document.getElementById('nb-reservations-admin').textContent = reservations.filter(r => r.statut === 'en_attente').length

    const tbody = document.getElementById('tbody-reservations-admin')
    tbody.textContent = ''

    if (reservations.length === 0) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.setAttribute('colspan', '6')
      td.className = 'empty'
      td.textContent = 'Aucune réservation pour le moment'
      tr.appendChild(td)
      tbody.appendChild(tr)
      return
    }

    reservations.forEach(res => {
      const tr = document.createElement('tr')

      const tdClient = document.createElement('td')
      const divNom = document.createElement('div')
      divNom.style.fontWeight = '500'
      divNom.textContent = res.client_nom
      const divTel = document.createElement('div')
      divTel.style.fontSize = '12px'
      divTel.style.color = '#888780'
      divTel.textContent = res.client_tel
      tdClient.appendChild(divNom)
      tdClient.appendChild(divTel)
      tr.appendChild(tdClient)

      const tdBien = document.createElement('td')
      tdBien.style.fontSize = '13px'
      tdBien.textContent = `#${String(res.bien_id).substring(0, 8)}...`
      tr.appendChild(tdBien)

      const tdType = document.createElement('td')
      tdType.textContent = res.type_reservation === 'location_jour' ? '📅 Par jour'
        : res.type_reservation === 'achat' ? '💰 Achat' : '🏠 Visite'
      tr.appendChild(tdType)

      const tdDate = document.createElement('td')
      tdDate.style.fontSize = '12px'
      tdDate.textContent = res.date_souhaitee
        ? new Date(res.date_souhaitee).toLocaleDateString('fr-FR') : '—'
      tr.appendChild(tdDate)

      const tdStatut = document.createElement('td')
      const span = document.createElement('span')
      const couleurs = {
        en_attente: { bg: '#fff3cd', color: '#856404', label: '⏳ En attente' },
        confirmee: { bg: '#d4edda', color: '#155724', label: '✅ Confirmée' },
        annulee: { bg: '#f8d7da', color: '#721c24', label: '❌ Annulée' },
        expiree: { bg: '#e2e3e5', color: '#383d41', label: '⌛ Expirée' }
      }
      const s = couleurs[res.statut] || couleurs.en_attente
      span.style.cssText = `background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;`
      span.textContent = s.label
      tdStatut.appendChild(span)
      tr.appendChild(tdStatut)

      const tdCriteres = document.createElement('td')
      const c = res.criteres_client || {}
      const infos = []
      if (c.surface_min) infos.push(`${c.surface_min}m²`)
      if (c.chambres_min) infos.push(`${c.chambres_min} ch.`)
      if (c.notes) infos.push(c.notes.substring(0, 30))
      tdCriteres.style.fontSize = '12px'
      tdCriteres.style.color = '#555'
      tdCriteres.textContent = infos.join(' · ') || '—'
      tr.appendChild(tdCriteres)

      tbody.appendChild(tr)
    })
  } catch (err) {
    console.error('Erreur réservations admin')
  }
}

chargerReservationsAdmin()

async function chargerSignalements() {
  try {
    const r = await fetch('/signalements', { credentials: 'include' })
    if (!r.ok) return
    const data = await r.json()
    const signalements = data.signalements || []
    // Afficher le nombre dans l'onglet réservations (on réutilise le badge)
    const nonTraites = signalements.filter(s => !s.traite).length
    if (nonTraites > 0) {
      const tabRes = document.querySelector('[onclick*="reservations"]')
      if (tabRes) tabRes.textContent = `📅 Réservations + Signalements (${nonTraites})`
    }
  } catch {}
}
chargerSignalements()