const user = JSON.parse(localStorage.getItem('immocg_user') || 'null')

if (!user) {
  window.location.href = 'login.html'
} else if (user.role === 'admin') {
  window.location.href = 'admin.html'
} else {
  document.getElementById('nav-user').textContent = user.nom_agence || user.nom || ''
  document.getElementById('welcome-title').textContent = `Bonjour, ${user.nom_agence || user.nom} 👋`
  document.getElementById('welcome-sub').textContent = `Bienvenue sur votre espace partenaire ImmoCG`
}

async function chargerMesBiens() {
  try {
    const r = await fetch('/biens/mine', { credentials: 'include' })
    if (r.status === 401) {
      localStorage.removeItem('immocg_user')
      window.location.href = 'login.html'
      return
    }
    const data = await r.json()
    const mesBiens = data.biens || []

    document.getElementById('nb-total').textContent = mesBiens.length
    document.getElementById('nb-disponible').textContent = mesBiens.filter(b => b.statut === 'disponible').length
    document.getElementById('nb-loue').textContent = mesBiens.filter(b => b.statut === 'loue' || b.statut === 'vendu').length

    const tbody = document.getElementById('tbody-biens')
    tbody.textContent = ''

    if (mesBiens.length === 0) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.setAttribute('colspan', '6')
      td.className = 'empty'
      td.textContent = "Vous n'avez pas encore publié d'annonces."
      td.appendChild(document.createElement('br'))
      td.appendChild(document.createElement('br'))
      const lien = document.createElement('a')
      lien.href = 'publier.html'
      lien.style.color = '#C9963A'
      lien.textContent = 'Publier mon premier bien →'
      td.appendChild(lien)
      tr.appendChild(td)
      tbody.appendChild(tr)
      return
    }

    mesBiens.forEach(b => {
      const tr = document.createElement('tr')

      const tdImg = document.createElement('td')
      const imgDiv = document.createElement('div')
      imgDiv.className = 'bien-img-mini'
      if (b.image_url) {
        try {
          const u = new URL(b.image_url)
          if (u.protocol === 'https:' || u.protocol === 'http:') {
            imgDiv.style.backgroundImage = `url(${b.image_url})`
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
      tdPrix.textContent = b.mode === 'jour'
        ? `${parseInt(b.prix_jour || 0).toLocaleString('fr-FR')} ${b.unite}/nuit`
        : `${parseInt(b.prix).toLocaleString('fr-FR')} ${b.unite}`
      tr.appendChild(tdPrix)

      const tdLoc = document.createElement('td')
      tdLoc.textContent = `${b.quartier}, ${b.ville}`
      tr.appendChild(tdLoc)

      const tdStatut = document.createElement('td')
      const span = document.createElement('span')
      span.className = `badge ${b.statut}`
      span.textContent = b.statut === 'disponible' ? 'Disponible'
        : b.statut === 'attente' ? 'En attente'
        : b.statut === 'loue' ? 'Loué' : 'Vendu'
      tdStatut.appendChild(span)
      tr.appendChild(tdStatut)

      const tdActions = document.createElement('td')

      // Badge vérification disponibilité
      if (b.derniere_verification) {
        const diff = Date.now() - new Date(b.derniere_verification).getTime()
        const jours = Math.floor(diff / (1000*60*60*24))
        const btnVerif = document.createElement('button')
        btnVerif.className = 'btn-sm'
        if (jours <= 7) {
          btnVerif.style.cssText = 'background:#d4edda;color:#155724;border:none;'
          btnVerif.textContent = '✅ Vérifié'
        } else {
          btnVerif.style.cssText = 'background:#fff3cd;color:#856404;border:none;'
          btnVerif.textContent = '⚠️ Confirmer dispo'
          btnVerif.addEventListener('click', () => confirmerDisponibilite(b.id))
        }
        tdActions.appendChild(btnVerif)
      } else {
        const btnVerif = document.createElement('button')
        btnVerif.className = 'btn-sm'
        btnVerif.style.cssText = 'background:#f8d7da;color:#721c24;border:none;'
        btnVerif.textContent = '🔴 Confirmer dispo'
        btnVerif.addEventListener('click', () => confirmerDisponibilite(b.id))
        tdActions.appendChild(btnVerif)
      }

      const btnVoir = document.createElement('button')
      btnVoir.className = 'btn-sm btn-voir'
      btnVoir.textContent = 'Voir'
      btnVoir.addEventListener('click', () => window.location.href = 'bien.html?id=' + encodeURIComponent(b.id))
      const btnSupp = document.createElement('button')
      btnSupp.className = 'btn-sm btn-supprimer'
      btnSupp.textContent = 'Supprimer'
      btnSupp.addEventListener('click', () => supprimerBien(b.id))
      tdActions.appendChild(btnVoir)
      tdActions.appendChild(btnSupp)
      tr.appendChild(tdActions)

      tbody.appendChild(tr)
    })
  } catch (err) {
    const tbody = document.getElementById('tbody-biens')
    tbody.textContent = ''
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('colspan', '6')
    td.className = 'empty'
    td.textContent = 'Erreur de chargement'
    tr.appendChild(td)
    tbody.appendChild(tr)
  }
}

async function chargerReservations() {
  try {
    const r = await fetch('/reservations/mes', { credentials: 'include' })
    if (r.status === 401) return
    const data = await r.json()
    const reservations = data.reservations || []

    document.getElementById('nb-reservations').textContent = reservations.filter(r => r.statut === 'en_attente').length

    const tbody = document.getElementById('tbody-reservations')
    tbody.textContent = ''

    if (reservations.length === 0) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.setAttribute('colspan', '6')
      td.className = 'empty'
      td.textContent = 'Aucune demande reçue pour le moment'
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
      divTel.style.cssText = 'font-size:12px;color:#888780;'
      divTel.textContent = res.client_tel
      tdClient.appendChild(divNom)
      tdClient.appendChild(divTel)
      tr.appendChild(tdClient)

      const tdBien = document.createElement('td')
      tdBien.style.fontSize = '13px'
      tdBien.textContent = `Bien #${String(res.bien_id).substring(0, 8)}...`
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
      const statutColors = {
        en_attente: { bg: '#fff3cd', color: '#856404', label: '⏳ En attente' },
        confirmee: { bg: '#d4edda', color: '#155724', label: '✅ Confirmée' },
        annulee: { bg: '#f8d7da', color: '#721c24', label: '❌ Annulée' },
        expiree: { bg: '#e2e3e5', color: '#383d41', label: '⌛ Expirée' }
      }
      const s = statutColors[res.statut] || statutColors.en_attente
      span.style.cssText = `background:${s.bg};color:${s.color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;`
      span.textContent = s.label
      tdStatut.appendChild(span)
      tr.appendChild(tdStatut)

      const tdActions = document.createElement('td')
      // Bouton PDF pour réservations confirmées
      if (res.statut === 'confirmee') {
        const btnPDF = document.createElement('button')
        btnPDF.className = 'btn-sm'
        btnPDF.style.cssText = 'background:#1A1A18;color:#C9963A;border:1px solid #C9963A;'
        btnPDF.textContent = '📄 Contrat PDF'
        btnPDF.addEventListener('click', () => telechargerContrat(res))
        tdActions.appendChild(btnPDF)
      }

      if (res.statut === 'confirmee') {
        const btnDeclarer = document.createElement('button')
        btnDeclarer.className = 'btn-sm btn-valider'
        btnDeclarer.textContent = '💰 Déclarer transaction'
        btnDeclarer.addEventListener('click', () => ouvrirModalDeclaration(res))
        tdActions.appendChild(btnDeclarer)
      }

      if (res.statut === 'en_attente') {
        const btnConfirmer = document.createElement('button')
        btnConfirmer.className = 'btn-sm btn-valider'
        btnConfirmer.textContent = '✅ Valider'
        btnConfirmer.addEventListener('click', () => traiterReservation(res.id, 'confirmee', res))
        const btnRefuser = document.createElement('button')
        btnRefuser.className = 'btn-sm btn-refuser'
        btnRefuser.textContent = '❌ Refuser'
        btnRefuser.addEventListener('click', () => traiterReservation(res.id, 'annulee', res))
        tdActions.appendChild(btnConfirmer)
        tdActions.appendChild(btnRefuser)
      }
      if (res.criteres_client && Object.keys(res.criteres_client).length > 0) {
        const btnCriteres = document.createElement('button')
        btnCriteres.className = 'btn-sm btn-voir'
        btnCriteres.textContent = '🎯 Critères'
        btnCriteres.addEventListener('click', () => afficherCriteres(res))
        tdActions.appendChild(btnCriteres)
      }
      tr.appendChild(tdActions)
      tbody.appendChild(tr)
    })
  } catch (err) {
    console.error('Erreur chargement réservations')
  }
}

// ========== MODAL DÉCLARATION PROFESSIONNEL ==========

function ouvrirModalDeclaration(reservation) {
  // Supprimer modal existant
  const existant = document.getElementById('modal-declaration')
  if (existant) existant.remove()

  // Calculer le montant suggéré
  const typeMap = {
    visite: 'visite',
    location_jour: 'location_jour',
    achat: 'vente',
  }
  const typeDefaut = typeMap[reservation.type_reservation] || 'location'

  const modal = document.createElement('div')
  modal.id = 'modal-declaration'
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);
    display:flex;align-items:center;justify-content:center;padding:1rem;
  `

  const box = document.createElement('div')
  box.style.cssText = `
    background:#fff;border-radius:16px;padding:2rem;max-width:480px;width:100%;
    max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);
  `

  box.innerHTML = `
    <button id="decl-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:22px;cursor:pointer;color:#888;">✕</button>
    <h2 style="font-size:20px;font-weight:700;color:#1A1A18;margin-bottom:0.3rem;">💰 Déclarer une transaction</h2>
    <p style="color:#888780;font-size:13px;margin-bottom:1.5rem;">Réservation #${String(reservation.id).substring(0, 8).toUpperCase()} · ${reservation.client_nom}</p>

    <div style="background:#f8f8f8;border-radius:10px;padding:1rem;margin-bottom:1.5rem;font-size:13px;color:#555;line-height:1.6;">
      <strong>Client:</strong> ${reservation.client_nom}<br>
      <strong>Téléphone:</strong> ${reservation.client_tel}<br>
      <strong>Type:</strong> ${reservation.type_reservation === 'achat' ? 'Achat' : reservation.type_reservation === 'location_jour' ? 'Location courte durée' : 'Location'}
    </div>

    <div style="display:flex;flex-direction:column;gap:1rem;">
      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px;">Type de transaction *</label>
        <select id="decl-type" style="width:100%;padding:11px 14px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;font-family:'Segoe UI',sans-serif;background:#F7F3EC;outline:none;color:#2C2C28;">
          <option value="location" ${typeDefaut === 'location' ? 'selected' : ''}>Location mensuelle</option>
          <option value="vente" ${typeDefaut === 'vente' ? 'selected' : ''}>Vente</option>
          <option value="location_jour" ${typeDefaut === 'location_jour' ? 'selected' : ''}>Location par jour</option>
          <option value="visite" ${typeDefaut === 'visite' ? 'selected' : ''}>Visite uniquement</option>
        </select>
      </div>

      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px;">Montant total de la transaction (FCFA) *</label>
        <input id="decl-montant" type="number" placeholder="Ex: 200000" style="width:100%;padding:11px 14px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;font-family:'Segoe UI',sans-serif;background:#F7F3EC;outline:none;color:#2C2C28;">
        <p style="font-size:11px;color:#888;margin-top:4px;">Commission ImmoCG (10%): <strong id="decl-commission" style="color:#C9963A;">0 FCFA</strong></p>
      </div>

      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px;">Notes (optionnel)</label>
        <textarea id="decl-notes" placeholder="Détails sur la transaction..." rows="2" style="width:100%;padding:11px 14px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:14px;font-family:'Segoe UI',sans-serif;background:#F7F3EC;outline:none;color:#2C2C28;resize:vertical;"></textarea>
      </div>

      <div id="decl-erreur" style="color:#c0392b;font-size:13px;display:none;padding:10px;background:#fdf0f0;border-radius:8px;"></div>

      <button id="decl-soumettre" style="background:#C9963A;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;margin-top:0.5rem;transition:background 0.2s;">
        ✅ Confirmer la déclaration
      </button>
      <button id="decl-annuler" style="background:transparent;border:1px solid rgba(0,0,0,0.12);color:#888;padding:11px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;">
        Annuler
      </button>
    </div>
  `

  modal.appendChild(box)
  document.body.appendChild(modal)

  // Calcul commission en temps réel
  document.getElementById('decl-montant').addEventListener('input', (e) => {
    const montant = parseInt(e.target.value) || 0
    const commission = Math.round(montant * 0.10)
    document.getElementById('decl-commission').textContent = `${commission.toLocaleString('fr-FR')} FCFA`
  })

  // Fermer
  document.getElementById('decl-close').addEventListener('click', () => modal.remove())
  document.getElementById('decl-annuler').addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  // Soumettre
  document.getElementById('decl-soumettre').addEventListener('click', async () => {
    const type = document.getElementById('decl-type').value
    const montant = parseInt(document.getElementById('decl-montant').value)
    const notes = document.getElementById('decl-notes').value.trim()
    const erreurEl = document.getElementById('decl-erreur')
    const btn = document.getElementById('decl-soumettre')

    if (!montant || montant < 1) {
      erreurEl.textContent = 'Veuillez entrer un montant valide'
      erreurEl.style.display = 'block'
      return
    }

    erreurEl.style.display = 'none'
    btn.textContent = 'Envoi en cours...'
    btn.disabled = true

    try {
      const r = await fetch('/transactions/declarer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: reservation.id,
          montant_fcfa: montant,
          type_transaction: type,
          notes: notes || undefined,
        }),
      })
      const data = await r.json()

      if (data.success) {
        // Succès
        box.innerHTML = `
          <div style="text-align:center;padding:2rem 1rem;">
            <div style="font-size:48px;margin-bottom:1rem;">✅</div>
            <h3 style="font-size:20px;font-weight:700;color:#1A1A18;margin-bottom:0.5rem;">Transaction déclarée !</h3>
            <p style="color:#555;line-height:1.6;margin-bottom:1rem;">
              Commission ImmoCG (10%): <strong style="color:#C9963A;">${data.commission_fcfa.toLocaleString('fr-FR')} FCFA</strong><br>
              À régler sous 7 jours.
            </p>
            <button onclick="document.getElementById('modal-declaration').remove();chargerReservations();" 
              style="background:#C9963A;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-weight:600;cursor:pointer;font-size:15px;">
              Fermer
            </button>
          </div>
        `
      } else {
        erreurEl.textContent = data.message || 'Erreur lors de la déclaration'
        erreurEl.style.display = 'block'
        btn.textContent = '✅ Confirmer la déclaration'
        btn.disabled = false
      }
    } catch {
      erreurEl.textContent = 'Erreur de connexion. Réessayez.'
      erreurEl.style.display = 'block'
      btn.textContent = '✅ Confirmer la déclaration'
      btn.disabled = false
    }
  })
}

async function traiterReservation(id, statut, reservation) {
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    if (!data.success) {
      alert(data.message || 'Erreur lors du traitement')
      return
    }
    chargerReservations()
  } catch {
    alert('Erreur lors du traitement de la réservation')
  }
}

function afficherCriteres(res) {
  const c = res.criteres_client || {}
  const lignes = []
  if (c.surface_min) lignes.push(`Surface min: ${c.surface_min}m²`)
  if (c.chambres_min) lignes.push(`Chambres min: ${c.chambres_min}`)
  if (c.notes) lignes.push(`Notes: ${c.notes}`)
  alert(`Critères de ${res.client_nom}:

${lignes.join('\n') || 'Aucun critère spécifié'}`)
}

async function supprimerBien(id) {
  if (!confirm('Supprimer cette annonce ?')) return
  await fetch('/biens/' + id, { method: 'DELETE', credentials: 'include' })
  chargerMesBiens()
}

function seDeconnecter() {
  localStorage.removeItem('immocg_user')
  fetch('/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
    window.location.href = 'login.html'
  })
}

// Lancer
chargerMesBiens()
chargerReservations()

async function confirmerDisponibilite(bienId) {
  try {
    const r = await fetch('/biens/' + bienId + '/verifier', {
      method: 'PATCH',
      credentials: 'include'
    })
    const data = await r.json()
    if (data.success) {
      showToast('✅ Disponibilité confirmée !')
      chargerMesBiens()
    }
  } catch {
    showToast('Erreur lors de la confirmation')
  }
}

function showToast(msg) {
  const t = document.createElement('div')
  t.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#1A1A18;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.3);'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

window.seDeconnecter = seDeconnecter
window.supprimerBien = supprimerBien
window.traiterReservation = traiterReservation
window.confirmerDisponibilite = confirmerDisponibilite

async function telechargerContrat(reservation) {
  try {
    const r = await fetch('/biens/' + reservation.bien_id)
    const data = await r.json()
    const bien = data.bien || {}
    genererContratPDF(reservation, bien)
  } catch {
    alert('Erreur lors de la génération du contrat')
  }
}
window.telechargerContrat = telechargerContrat