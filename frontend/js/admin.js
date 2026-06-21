// admin.js — Dashboard administrateur ImmoCG

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
  fetch('/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
    window.location.href = 'login.html'
  })
}

function esc(val) {
  return String(val == null ? '' : val)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
}

// ========== BIENS ==========
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
    td.setAttribute('colspan', '6'); td.className = 'empty'
    td.textContent = 'Aucune annonce pour le moment'
    tr.appendChild(td); tbody.appendChild(tr); return
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
          imgDiv.style.backgroundSize = 'cover'; imgDiv.style.backgroundPosition = 'center'; imgDiv.style.fontSize = '0'
        }
      } catch(e) { imgDiv.textContent = '🏠' }
    } else { imgDiv.textContent = '🏠' }
    tdImg.appendChild(imgDiv); tr.appendChild(tdImg)

    const tdType = document.createElement('td')
    const divType = document.createElement('div'); divType.style.fontWeight = '500'; divType.textContent = b.type
    const divTitre = document.createElement('div'); divTitre.style.fontSize = '12px'; divTitre.style.color = '#888780'; divTitre.textContent = b.titre || ''
    tdType.appendChild(divType); tdType.appendChild(divTitre); tr.appendChild(tdType)

    const tdPrix = document.createElement('td')
    tdPrix.textContent = `${parseInt(b.prix).toLocaleString('fr-FR')} ${b.unite}`; tr.appendChild(tdPrix)

    const tdLoc = document.createElement('td')
    tdLoc.textContent = `${b.quartier}, ${b.ville}`; tr.appendChild(tdLoc)

    const tdStatut = document.createElement('td')
    const span = document.createElement('span')
    span.className = `badge ${b.statut === 'disponible' ? 'valide' : b.statut === 'attente' ? 'attente' : 'refuse'}`
    span.textContent = b.statut === 'disponible' ? 'Publié' : b.statut === 'attente' ? 'En attente' : b.statut
    tdStatut.appendChild(span); tr.appendChild(tdStatut)

    const tdActions = document.createElement('td')
    if (b.statut === 'attente') {
      const btnV = document.createElement('button'); btnV.className = 'btn-sm btn-valider'; btnV.textContent = '✅ Valider'
      btnV.addEventListener('click', () => changerStatutBien(b.id, 'disponible')); tdActions.appendChild(btnV)
      const btnR = document.createElement('button'); btnR.className = 'btn-sm btn-refuser'; btnR.textContent = '❌ Refuser'
      btnR.addEventListener('click', () => changerStatutBien(b.id, 'refuse')); tdActions.appendChild(btnR)
    }
    const btnVoir = document.createElement('button'); btnVoir.className = 'btn-sm btn-voir'; btnVoir.textContent = 'Voir'
    btnVoir.addEventListener('click', () => window.location.href = 'bien.html?id=' + encodeURIComponent(b.id)); tdActions.appendChild(btnVoir)
    const btnSupp = document.createElement('button'); btnSupp.className = 'btn-sm btn-supprimer'; btnSupp.textContent = 'Supprimer'
    btnSupp.addEventListener('click', () => supprimerBien(b.id)); tdActions.appendChild(btnSupp)
    tr.appendChild(tdActions); tbody.appendChild(tr)
  })
}

async function changerStatutBien(id, statut) {
  await fetch('/biens/' + id + '/statut', { method: 'PATCH', headers: {'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify({ statut }) })
  chargerBiens()
}

async function supprimerBien(id) {
  if (!confirm('Supprimer cette annonce ?')) return
  await fetch('/biens/' + id, { method: 'DELETE', credentials: 'include' })
  chargerBiens()
}

// ========== AGENCES ==========
async function chargerAgences() {
  const r = await fetch('/auth/users', { credentials: 'include' })
  const data = await r.json()
  const users = data.users || []

  document.getElementById('nb-agences').textContent = users.filter(u => u.role === 'agence').length
  document.getElementById('nb-actives').textContent = users.filter(u => u.role === 'agence' && u.actif).length

  const tbody = document.getElementById('tbody-agences')
  tbody.textContent = ''

  if (users.length === 0) {
    const tr = document.createElement('tr'); const td = document.createElement('td')
    td.setAttribute('colspan','6'); td.className = 'empty'; td.textContent = 'Aucune agence inscrite'
    tr.appendChild(td); tbody.appendChild(tr); return
  }

  users.forEach(u => {
    const tr = document.createElement('tr')
    const tdNom = document.createElement('td')
    const dA = document.createElement('div'); dA.style.fontWeight='500'; dA.textContent = u.nom_agence || u.nom
    const dN = document.createElement('div'); dN.style.fontSize='12px'; dN.style.color='#888780'; dN.textContent = u.nom
    tdNom.appendChild(dA); tdNom.appendChild(dN); tr.appendChild(tdNom)

    const tdC = document.createElement('td')
    const dE = document.createElement('div'); dE.textContent = u.email
    const dT = document.createElement('div'); dT.style.fontSize='12px'; dT.style.color='#888780'; dT.textContent = u.telephone || '—'
    tdC.appendChild(dE); tdC.appendChild(dT); tr.appendChild(tdC)

    const tdR = document.createElement('td'); const sR = document.createElement('span'); sR.className=`badge ${u.role}`; sR.textContent=u.role; tdR.appendChild(sR); tr.appendChild(tdR)
    const tdS = document.createElement('td'); const sS = document.createElement('span'); sS.className=`badge ${u.actif?'valide':'attente'}`; sS.textContent=u.actif?'Actif':'En attente'; tdS.appendChild(sS); tr.appendChild(tdS)
    const tdD = document.createElement('td'); tdD.style.fontSize='12px'; tdD.style.color='#888780'; tdD.textContent=new Date(u.created_at).toLocaleDateString('fr-FR'); tr.appendChild(tdD)

    const tdA = document.createElement('td')
    if (!u.actif && u.role !== 'admin') {
      const b = document.createElement('button'); b.className='btn-sm btn-valider'; b.textContent='Activer'; b.addEventListener('click',()=>activerUser(u.id,true)); tdA.appendChild(b)
    }
    if (u.actif && u.role !== 'admin') {
      const b = document.createElement('button'); b.className='btn-sm btn-refuser'; b.textContent='Désactiver'; b.addEventListener('click',()=>activerUser(u.id,false)); tdA.appendChild(b)
    }
    tr.appendChild(tdA); tbody.appendChild(tr)
  })
}

async function activerUser(id, actif) {
  const r = await fetch('/auth/users/' + id, { method:'PATCH', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ actif }) })
  const data = await r.json().catch(() => ({}))
  if (!data.success) {
    alert(data.message || 'Erreur lors de la mise à jour de l\'agence')
    return
  }
  if (data.success && actif && data.whatsapp_url) {
    if (confirm('Agence activée ! Ouvrir WhatsApp pour notifier l\'agence ?')) {
      window.open(data.whatsapp_url, '_blank', 'noopener,noreferrer')
    }
  }
  chargerAgences()
}

// ========== RÉSERVATIONS ==========
async function chargerReservationsAdmin() {
  try {
    const r = await fetch('/reservations/admin', { credentials: 'include' })
    if (!r.ok) return
    const data = await r.json()
    const reservations = data.reservations || []

    document.getElementById('nb-reservations-admin').textContent = reservations.filter(r => r.statut === 'en_attente').length

    const tbody = document.getElementById('tbody-reservations-admin')
    tbody.textContent = ''

    if (reservations.length === 0) {
      const tr = document.createElement('tr'); const td = document.createElement('td')
      td.setAttribute('colspan','7'); td.className='empty'; td.textContent='Aucune réservation pour le moment'
      tr.appendChild(td); tbody.appendChild(tr); return
    }

    reservations.forEach(res => {
      const tr = document.createElement('tr')

      const tdClient = document.createElement('td')
      const dN = document.createElement('div'); dN.style.fontWeight='500'; dN.textContent = res.client_nom
      const dT = document.createElement('div'); dT.style.fontSize='12px'; dT.style.color='#888780'; dT.textContent = res.client_tel
      tdClient.appendChild(dN); tdClient.appendChild(dT); tr.appendChild(tdClient)

      const tdBien = document.createElement('td'); tdBien.style.fontSize='13px'; tdBien.textContent=`#${String(res.bien_id).substring(0,8)}...`; tr.appendChild(tdBien)

      const tdType = document.createElement('td')
      tdType.textContent = res.type_reservation==='location_jour' ? '📅 Par jour' : res.type_reservation==='achat' ? '💰 Achat' : '🏠 Visite'
      tr.appendChild(tdType)

      const tdDate = document.createElement('td'); tdDate.style.fontSize='12px'
      tdDate.textContent = res.date_souhaitee ? new Date(res.date_souhaitee).toLocaleDateString('fr-FR') : '—'; tr.appendChild(tdDate)

      const tdStatut = document.createElement('td')
      const couleurs = {
        en_attente:{bg:'#fff3cd',color:'#856404',label:'⏳ En attente'},
        confirmee:{bg:'#d4edda',color:'#155724',label:'✅ Confirmée'},
        annulee:{bg:'#f8d7da',color:'#721c24',label:'❌ Annulée'},
        expiree:{bg:'#e2e3e5',color:'#383d41',label:'⌛ Expirée'}
      }
      const s = couleurs[res.statut] || couleurs.en_attente
      const sp = document.createElement('span')
      sp.style.cssText=`background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;`
      sp.textContent=s.label; tdStatut.appendChild(sp); tr.appendChild(tdStatut)

      const tdCriteres = document.createElement('td')
      const c = res.criteres_client || {}
      const infos = []
      if (c.surface_min) infos.push(`${c.surface_min}m²`)
      if (c.chambres_min) infos.push(`${c.chambres_min} ch.`)
      if (c.notes) infos.push(c.notes.substring(0,30))
      tdCriteres.style.fontSize='12px'; tdCriteres.style.color='#555'
      tdCriteres.textContent = infos.join(' · ') || '—'; tr.appendChild(tdCriteres)

      const tdActions = document.createElement('td')
      if (res.statut === 'confirmee') {
        const btnPDF = document.createElement('button')
        btnPDF.className = 'btn-sm'
        btnPDF.style.cssText = 'background:#1A1A18;color:#C9963A;border:1px solid #C9963A;'
        btnPDF.textContent = '📄 Contrat PDF'
        btnPDF.addEventListener('click', () => telechargerContratAdmin(res))
        tdActions.appendChild(btnPDF)

        const btnDeclarer = document.createElement('button')
        btnDeclarer.className = 'btn-sm btn-valider'
        btnDeclarer.textContent = '💰 Déclarer'
        btnDeclarer.addEventListener('click', () => declarerTransactionAdmin(res))
        tdActions.appendChild(btnDeclarer)

        if (!res.resultat_visite) {
          const btnCloturer = document.createElement('button')
          btnCloturer.className = 'btn-sm'
          btnCloturer.style.cssText = 'background:#fff3cd;color:#856404;border:1px solid #ffe69c;'
          btnCloturer.textContent = '🏁 Clôturer'
          btnCloturer.addEventListener('click', () => ouvrirModalClotureAdmin(res))
          tdActions.appendChild(btnCloturer)
        } else {
          const labels = { pris: '✅ Attribué', refuse_client: '🙅 Refusé', absent: '👻 Absent' }
          const badge = document.createElement('span')
          badge.style.cssText = 'font-size:11px;color:#888;padding:2px 8px;background:#f0f0f0;border-radius:10px;'
          badge.textContent = labels[res.resultat_visite] || res.resultat_visite
          tdActions.appendChild(badge)
        }
      }
      if (res.statut === 'en_attente') {
        const btnV = document.createElement('button'); btnV.className='btn-sm btn-valider'; btnV.textContent='✅ Valider'
        btnV.addEventListener('click', () => traiterResAdmin(res.id, 'confirmee', res)); tdActions.appendChild(btnV)
        const btnR = document.createElement('button'); btnR.className='btn-sm btn-refuser'; btnR.textContent='❌ Refuser'
        btnR.addEventListener('click', () => traiterResAdmin(res.id, 'annulee', res)); tdActions.appendChild(btnR)
      }
      tr.appendChild(tdActions)
      tbody.appendChild(tr)
    })
  } catch (err) {
    console.error('Erreur réservations admin', err)
  }
}

async function traiterResAdmin(id, statut, reservation) {
  const action = statut === 'confirmee' ? 'confirmer' : 'refuser'
  if (!confirm(`Voulez-vous ${action} cette réservation ?`)) return

  const payload = { statut }

  if (statut === 'confirmee') {
    let montantSuggere = 0
    if (reservation?.bien_id) {
      try {
        const rBien = await fetch('/biens/' + reservation.bien_id, { credentials: 'include' })
        const dBien = await rBien.json()
        const bien = dBien.bien || {}
        const prix = Number(bien.prix) || 0
        if (reservation.type_reservation === 'achat') montantSuggere = Math.max(Math.round(prix * 0.1), 50000)
        else if (reservation.type_reservation === 'location_jour') montantSuggere = Number(bien.prix_jour || 0) * 2
        else if (prix >= 100000) montantSuggere = prix < 300000 ? 5000 : prix < 500000 ? 10000 : 15000
        else montantSuggere = Math.round(prix * 0.05)
      } catch {}
    }

    const paiement = typeof saisirInfosPaiement === 'function'
      ? await saisirInfosPaiement(montantSuggere)
      : null
    if (!paiement) {
      alert('Validation annulée : informations de paiement requises.')
      return
    }
    payload.paiement = paiement
  }

  try {
    const r = await fetch('/reservations/' + id, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      credentials: 'include', body: JSON.stringify(payload)
    })
    const data = await r.json()
    if (!data.success) {
      alert(data.message || 'Erreur lors du traitement')
      return
    }
    chargerReservationsAdmin()
  } catch {
    alert('Erreur lors du traitement de la réservation')
  }
}

// ========== SIGNALEMENTS ==========
async function chargerSignalementsAdmin() {
  try {
    const r = await fetch('/signalements', { credentials: 'include' })
    if (!r.ok) return
    const data = await r.json()
    const signalements = data.signalements || []
    const nonTraites = signalements.filter(s => !s.traite)

    // Mettre à jour le badge de l'onglet
    const tabRes = document.querySelector('[onclick*="reservations"]')
    if (tabRes && nonTraites.length > 0) {
      tabRes.textContent = `📅 Réservations + Signalements (${nonTraites.length})`
    }

    const section = document.getElementById('section-reservations')
    if (!section) return

    const ancienne = document.getElementById('section-signalements-admin')
    if (ancienne) ancienne.remove()

    const div = document.createElement('div'); div.id = 'section-signalements-admin'; div.style.marginTop = '2rem'

    const header = document.createElement('div'); header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;'
    const titre = document.createElement('div'); titre.className = 'section-title'; titre.textContent = '⚠️ Signalements reçus'
    const badge = document.createElement('span'); badge.style.cssText = 'background:#e74c3c;color:#fff;padding:3px 12px;border-radius:20px;font-size:13px;font-weight:600;'; badge.textContent = nonTraites.length
    header.appendChild(titre); header.appendChild(badge); div.appendChild(header)

    if (signalements.length === 0) {
      const p = document.createElement('p'); p.style.cssText='text-align:center;color:#888;padding:1.5rem;background:#fff;border-radius:12px;'; p.textContent='Aucun signalement pour le moment'; div.appendChild(p)
    } else {
      const tableBox = document.createElement('div'); tableBox.className = 'table-box'
      const table = document.createElement('table'); table.className = 'table'
      const thead = document.createElement('thead')
      const theadTr = document.createElement('tr')
      ;['Bien','Type','Description','Date','Statut','Action'].forEach(t => {
        const th = document.createElement('th'); th.textContent = t; theadTr.appendChild(th)
      })
      thead.appendChild(theadTr); table.appendChild(thead)
      const tbody = document.createElement('tbody')

      signalements.forEach(s => {
        const tr = document.createElement('tr')
        const tdB = document.createElement('td'); tdB.textContent = `#${String(s.bien_id).substring(0,8)}...`; tr.appendChild(tdB)
        const tdT = document.createElement('td')
        const types = {bien_indisponible:'🔴 Indisponible',prix_errone:'💰 Prix erroné',photos_fausses:'📷 Photos fausses',coordonnees_incorrectes:'📞 Coordonnées',autre:'❓ Autre'}
        tdT.textContent = types[s.type_signalement] || s.type_signalement; tr.appendChild(tdT)
        const tdD = document.createElement('td'); tdD.style.fontSize='12px'; tdD.textContent = s.description||'—'; tr.appendChild(tdD)
        const tdDt = document.createElement('td'); tdDt.style.fontSize='12px'; tdDt.textContent = new Date(s.created_at).toLocaleDateString('fr-FR'); tr.appendChild(tdDt)
        const tdS = document.createElement('td'); const sp = document.createElement('span')
        sp.style.cssText = s.traite ? 'background:#d4edda;color:#155724;padding:2px 8px;border-radius:12px;font-size:11px;' : 'background:#f8d7da;color:#721c24;padding:2px 8px;border-radius:12px;font-size:11px;'
        sp.textContent = s.traite ? '✅ Traité' : '⏳ Non traité'; tdS.appendChild(sp); tr.appendChild(tdS)
        const tdA = document.createElement('td')
        if (!s.traite) {
          const btn = document.createElement('button'); btn.className='btn-sm btn-valider'; btn.textContent='Marquer traité'
          btn.addEventListener('click', async () => { await fetch('/signalements/'+s.id+'/traiter',{method:'PATCH',credentials:'include'}); chargerSignalementsAdmin() })
          tdA.appendChild(btn)
          const btnV = document.createElement('button'); btnV.className='btn-sm btn-voir'; btnV.textContent='Voir bien'
          btnV.addEventListener('click', () => window.location.href = 'bien.html?id='+s.bien_id); tdA.appendChild(btnV)
        }
        tr.appendChild(tdA); tbody.appendChild(tr)
      })
      table.appendChild(tbody); tableBox.appendChild(table); div.appendChild(tableBox)
    }
    section.appendChild(div)
  } catch (err) {
    console.error('Erreur signalements admin', err)
  }
}

// ========== COMMISSIONS ==========
async function chargerCommissionsAdmin() {
  try {
    const r = await fetch('/transactions/admin', { credentials: 'include' })
    if (!r.ok) return
    const data = await r.json()
    const transactions = data.transactions || []

    document.getElementById('total-commission-admin').textContent =
      `${(data.total_commission_fcfa || 0).toLocaleString('fr-FR')} FCFA`

    const tbody = document.getElementById('tbody-commissions')
    tbody.textContent = ''

    if (transactions.length === 0) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.setAttribute('colspan', '8')
      td.className = 'empty'
      td.textContent = 'Aucune transaction déclarée pour le moment'
      tr.appendChild(td)
      tbody.appendChild(tr)
      return
    }

    transactions.forEach((t) => {
      const tr = document.createElement('tr')

      const tdRef = document.createElement('td')
      tdRef.style.fontSize = '12px'
      tdRef.textContent = t.reference_immocg || '—'
      tr.appendChild(tdRef)

      const tdClient = document.createElement('td')
      tdClient.textContent = t.client_nom || '—'
      tr.appendChild(tdClient)

      const tdType = document.createElement('td')
      tdType.textContent = t.type_transaction || '—'
      tr.appendChild(tdType)

      const tdMontant = document.createElement('td')
      tdMontant.textContent = `${Number(t.montant_fcfa || 0).toLocaleString('fr-FR')} FCFA`
      tr.appendChild(tdMontant)

      const tdComm = document.createElement('td')
      tdComm.style.fontWeight = '600'
      tdComm.style.color = '#C9963A'
      tdComm.textContent = `${Number(t.commission_fcfa || 0).toLocaleString('fr-FR')} FCFA`
      tr.appendChild(tdComm)

      const tdStatut = document.createElement('td')
      const sp = document.createElement('span')
      sp.className = `badge ${t.statut === 'verifiee' ? 'valide' : t.statut === 'contestee' ? 'refuse' : 'attente'}`
      sp.textContent = t.statut === 'verifiee' ? 'Vérifiée' : t.statut === 'contestee' ? 'Contestée' : 'Déclarée'
      tdStatut.appendChild(sp)
      tr.appendChild(tdStatut)

      const tdDate = document.createElement('td')
      tdDate.style.fontSize = '12px'
      tdDate.textContent = new Date(t.created_at).toLocaleDateString('fr-FR')
      tr.appendChild(tdDate)

      const tdAction = document.createElement('td')
      if (t.statut === 'declaree') {
        const btn = document.createElement('button')
        btn.className = 'btn-sm btn-valider'
        btn.textContent = '✅ Vérifier'
        btn.addEventListener('click', async () => {
          await fetch('/transactions/' + t.id + '/verifier', { method: 'PATCH', credentials: 'include' })
          chargerCommissionsAdmin()
        })
        tdAction.appendChild(btn)
      }
      tr.appendChild(tdAction)
      tbody.appendChild(tr)
    })
  } catch (err) {
    console.error('Erreur commissions admin', err)
  }
}

function ouvrirModalClotureAdmin(reservation) {
  const ancien = document.getElementById('modal-cloture-admin')
  if (ancien) ancien.remove()

  const modal = document.createElement('div')
  modal.id = 'modal-cloture-admin'
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:1rem;'

  const box = document.createElement('div')
  box.style.cssText = 'background:#fff;border-radius:16px;padding:2rem;max-width:420px;width:100%;position:relative;'

  const titre = document.createElement('h2')
  titre.style.cssText = 'font-size:18px;font-weight:700;color:#1A1A18;margin-bottom:0.3rem;'
  titre.textContent = '🏁 Résultat de la visite'

  const sous = document.createElement('p')
  sous.style.cssText = 'font-size:13px;color:#888;margin-bottom:1.2rem;'
  sous.textContent = `Client : ${esc(reservation.client_nom)} · Que s'est-il passé ?`

  const btnPris = document.createElement('button')
  btnPris.style.cssText = 'width:100%;background:#d4edda;color:#155724;border:none;padding:13px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;margin-bottom:8px;text-align:left;'
  btnPris.innerHTML = '✅ <strong>Le client a pris le bien</strong>'

  const btnRefuse = document.createElement('button')
  btnRefuse.style.cssText = 'width:100%;background:#fff3cd;color:#856404;border:none;padding:13px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;margin-bottom:8px;text-align:left;'
  btnRefuse.innerHTML = '🙅 <strong>Le client n\'a pas voulu</strong>'

  const btnAbsent = document.createElement('button')
  btnAbsent.style.cssText = 'width:100%;background:#f8d7da;color:#721c24;border:none;padding:13px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;margin-bottom:8px;text-align:left;'
  btnAbsent.innerHTML = '👻 <strong>Le client ne s\'est pas présenté</strong>'

  const btnAnnuler = document.createElement('button')
  btnAnnuler.style.cssText = 'width:100%;background:none;border:1px solid #ddd;color:#555;padding:10px;border-radius:10px;font-size:14px;cursor:pointer;margin-top:4px;'
  btnAnnuler.textContent = 'Annuler'
  btnAnnuler.addEventListener('click', () => modal.remove())

  async function cloturerAvec(resultat) {
    try {
      const r = await fetch('/reservations/' + reservation.id + '/cloturer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resultat })
      })
      const data = await r.json()
      if (data.success) {
        modal.remove()
        chargerReservationsAdmin()
        chargerBiens()
      } else {
        alert(data.message || 'Erreur lors de la clôture')
      }
    } catch {
      alert('Erreur de connexion')
    }
  }

  btnPris.addEventListener('click', () => cloturerAvec('pris'))
  btnRefuse.addEventListener('click', () => cloturerAvec('refuse_client'))
  btnAbsent.addEventListener('click', () => cloturerAvec('absent'))

  box.appendChild(titre); box.appendChild(sous)
  box.appendChild(btnPris); box.appendChild(btnRefuse); box.appendChild(btnAbsent)
  box.appendChild(btnAnnuler)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function declarerTransactionAdmin(reservation) {
  const type = (prompt('Type (location, vente, location_jour, visite):', reservation.type_reservation === 'achat' ? 'vente' : (reservation.type_reservation || 'location')) || '').trim()
  const montantInput = (prompt('Montant transaction (FCFA):', '') || '').trim()
  const montant = parseInt(montantInput, 10)
  if (!type || Number.isNaN(montant) || montant < 1) {
    alert('Déclaration annulée.')
    return
  }
  const r = await fetch('/transactions/declarer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reservation_id: reservation.id, montant_fcfa: montant, type_transaction: type }),
  })
  const data = await r.json()
  if (data.success) {
    alert(`Commission ImmoCG : ${data.commission_fcfa.toLocaleString('fr-FR')} FCFA`)
    chargerCommissionsAdmin()
    chargerReservationsAdmin()
  } else {
    alert(data.message || 'Erreur')
  }
}

// ========== INIT ==========
chargerBiens()
chargerAgences()
chargerReservationsAdmin()
chargerSignalementsAdmin()
chargerCommissionsAdmin()

window.afficherSection = afficherSection
window.seDeconnecter = seDeconnecter
window.traiterResAdmin = traiterResAdmin

async function telechargerContratAdmin(reservation) {
  try {
    const r = await fetch('/biens/' + reservation.bien_id, { credentials: 'include' })
    const data = await r.json()
    const bien = data.bien || {}
    if (typeof genererContratPDF === 'function') {
      genererContratPDF(reservation, bien)
    } else {
      alert('Chargement du générateur PDF...')
    }
  } catch {
    alert('Erreur lors de la génération du contrat')
  }
}
window.telechargerContratAdmin = telechargerContratAdmin