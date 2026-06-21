function esc(val) {
  return String(val == null ? '' : val)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

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

      // Clôture du résultat de visite — uniquement si confirmée et pas déjà clôturée
      if (res.statut === 'confirmee' && !res.resultat_visite) {
        const btnCloturer = document.createElement('button')
        btnCloturer.className = 'btn-sm'
        btnCloturer.style.cssText = 'background:#fff3cd;color:#856404;border:1px solid #ffe69c;'
        btnCloturer.textContent = '🏁 Clôturer visite'
        btnCloturer.addEventListener('click', () => ouvrirModalCloture(res))
        tdActions.appendChild(btnCloturer)
      }

      // Afficher le résultat si déjà clôturé
      if (res.resultat_visite) {
        const badgeResultat = document.createElement('span')
        const labels = {
          pris: '✅ Bien attribué',
          refuse_client: '🙅 Client a refusé',
          absent: '👻 Client absent'
        }
        badgeResultat.style.cssText = 'font-size:11px;color:#888;padding:2px 8px;background:#f0f0f0;border-radius:10px;'
        badgeResultat.textContent = labels[res.resultat_visite] || res.resultat_visite
        tdActions.appendChild(badgeResultat)
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

function ouvrirModalCloture(reservation) {
  const ancien = document.getElementById('modal-cloture')
  if (ancien) ancien.remove()

  const modal = document.createElement('div')
  modal.id = 'modal-cloture'
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
  const strongPris = document.createElement('strong'); strongPris.textContent = 'Le client a pris le bien'
  const spanPris = document.createElement('span'); spanPris.style.cssText = 'font-size:12px;font-weight:400;'; spanPris.textContent = 'Le bien reste loué/vendu — déclarez la transaction ensuite'
  btnPris.appendChild(document.createTextNode('✅ ')); btnPris.appendChild(strongPris); btnPris.appendChild(document.createElement('br')); btnPris.appendChild(spanPris)

  const btnRefuse = document.createElement('button')
  btnRefuse.style.cssText = 'width:100%;background:#fff3cd;color:#856404;border:none;padding:13px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;margin-bottom:8px;text-align:left;'
  const strongRefuse = document.createElement('strong'); strongRefuse.textContent = 'Le client n\'a pas voulu'
  const spanRefuse = document.createElement('span'); spanRefuse.style.cssText = 'font-size:12px;font-weight:400;'; spanRefuse.textContent = 'Le bien redevient disponible immédiatement'
  btnRefuse.appendChild(document.createTextNode('🙅 ')); btnRefuse.appendChild(strongRefuse); btnRefuse.appendChild(document.createElement('br')); btnRefuse.appendChild(spanRefuse)

  const btnAbsent = document.createElement('button')
  btnAbsent.style.cssText = 'width:100%;background:#f8d7da;color:#721c24;border:none;padding:13px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;margin-bottom:8px;text-align:left;'
  const strongAbsent = document.createElement('strong'); strongAbsent.textContent = 'Le client ne s\'est pas présenté'
  const spanAbsent = document.createElement('span'); spanAbsent.style.cssText = 'font-size:12px;font-weight:400;'; spanAbsent.textContent = 'Le bien redevient disponible immédiatement'
  btnAbsent.appendChild(document.createTextNode('👻 ')); btnAbsent.appendChild(strongAbsent); btnAbsent.appendChild(document.createElement('br')); btnAbsent.appendChild(spanAbsent)

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
        chargerReservations()
        chargerMesBiens()
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

function ouvrirModalDeclaration(reservation) {
  const ancien = document.getElementById('modal-declaration')
  if (ancien) ancien.remove()

  const typeMap = { visite: 'visite', location_jour: 'location_jour', achat: 'vente' }
  const typeDefaut = typeMap[reservation.type_reservation] || 'location'

  const modal = document.createElement('div')
  modal.id = 'modal-declaration'
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(20,18,15,0.55);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;padding:1rem;'

  const box = document.createElement('div')
  box.style.cssText = `
    background:#fff;border-radius:18px;padding:2rem;max-width:460px;width:100%;
    max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 24px 64px rgba(0,0,0,0.25);
    font-family:'Segoe UI',sans-serif;
  `

  // ===== En-tête =====
  const btnClose = document.createElement('button')
  btnClose.id = 'decl-close'
  btnClose.style.cssText = 'position:absolute;top:1rem;right:1rem;background:#F7F3EC;border:none;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;color:#888;line-height:1;'
  btnClose.textContent = '✕'

  const titre = document.createElement('h2')
  titre.style.cssText = 'font-size:19px;font-weight:700;color:#1A1A18;margin:0 0 4px;padding-right:2rem;'
  titre.textContent = '💰 Déclarer une transaction'

  const refLine = document.createElement('p')
  refLine.style.cssText = 'color:#9a9690;font-size:13px;margin:0 0 1.4rem;'
  refLine.textContent = `Réservation #${String(reservation.id).substring(0, 8).toUpperCase()} · ${reservation.client_nom}`

  // ===== Carte récap client =====
  const recapBox = document.createElement('div')
  recapBox.style.cssText = 'background:#F7F3EC;border-radius:12px;padding:14px 16px;margin-bottom:1.4rem;font-size:13px;color:#555;line-height:1.9;'

  function ligneRecap(label, valeur) {
    const p = document.createElement('p')
    p.style.margin = '0'
    const strong = document.createElement('strong')
    strong.style.color = '#1A1A18'
    strong.textContent = label + ' '
    p.appendChild(strong)
    p.appendChild(document.createTextNode(valeur))
    return p
  }

  const typeLabel = reservation.type_reservation === 'achat' ? 'Achat'
    : reservation.type_reservation === 'location_jour' ? 'Location courte durée' : 'Location'

  recapBox.appendChild(ligneRecap('Client :', reservation.client_nom))
  recapBox.appendChild(ligneRecap('Téléphone :', reservation.client_tel))
  recapBox.appendChild(ligneRecap('Type :', typeLabel))

  // ===== Formulaire =====
  const form = document.createElement('div')
  form.style.cssText = 'display:flex;flex-direction:column;gap:1.1rem;'

  function champLabel(texte) {
    const lbl = document.createElement('label')
    lbl.style.cssText = 'font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:6px;letter-spacing:0.2px;'
    lbl.textContent = texte
    return lbl
  }

  const inputStyle = 'width:100%;padding:11px 14px;border:1.5px solid rgba(0,0,0,0.10);border-radius:10px;font-size:14px;font-family:inherit;background:#FBFAF7;outline:none;color:#2C2C28;box-sizing:border-box;transition:border-color 0.15s;'

  // -- Type de transaction
  const blocType = document.createElement('div')
  blocType.appendChild(champLabel('Type de transaction *'))
  const selType = document.createElement('select')
  selType.id = 'decl-type'
  selType.style.cssText = inputStyle + 'cursor:pointer;'
  ;[
    ['location', 'Location mensuelle'],
    ['vente', 'Vente'],
    ['location_jour', 'Location par jour'],
    ['visite', 'Visite uniquement']
  ].forEach(([val, label]) => {
    const opt = document.createElement('option')
    opt.value = val
    opt.textContent = label
    if (val === typeDefaut) opt.selected = true
    selType.appendChild(opt)
  })
  blocType.appendChild(selType)

  // -- Montant
  const blocMontant = document.createElement('div')
  blocMontant.appendChild(champLabel('Montant total de la transaction (FCFA) *'))
  const inpMontant = document.createElement('input')
  inpMontant.id = 'decl-montant'
  inpMontant.type = 'number'
  inpMontant.placeholder = 'Ex: 200000'
  inpMontant.style.cssText = inputStyle
  blocMontant.appendChild(inpMontant)

  const hintCommission = document.createElement('p')
  hintCommission.style.cssText = 'font-size:11.5px;color:#9a9690;margin:6px 0 0;'
  hintCommission.appendChild(document.createTextNode('Commission ImmoCG (10%) : '))
  const commissionValeur = document.createElement('strong')
  commissionValeur.id = 'decl-commission'
  commissionValeur.style.color = '#C9963A'
  commissionValeur.textContent = '0 FCFA'
  hintCommission.appendChild(commissionValeur)
  blocMontant.appendChild(hintCommission)

  inpMontant.addEventListener('input', () => {
    const m = parseInt(inpMontant.value) || 0
    commissionValeur.textContent = `${Math.round(m * 0.10).toLocaleString('fr-FR')} FCFA`
  })

  // -- Notes
  const blocNotes = document.createElement('div')
  blocNotes.appendChild(champLabel('Notes (optionnel)'))
  const inpNotes = document.createElement('textarea')
  inpNotes.id = 'decl-notes'
  inpNotes.rows = 2
  inpNotes.placeholder = 'Détails sur la transaction...'
  inpNotes.style.cssText = inputStyle + 'resize:vertical;'
  blocNotes.appendChild(inpNotes)

  // -- Erreur
  const erreurEl = document.createElement('div')
  erreurEl.id = 'decl-erreur'
  erreurEl.style.cssText = 'color:#b3331f;font-size:13px;display:none;padding:10px 12px;background:#FBEAE7;border-radius:8px;'

  // -- Boutons
  const btnSoumettre = document.createElement('button')
  btnSoumettre.id = 'decl-soumettre'
  btnSoumettre.style.cssText = 'background:#C9963A;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;margin-top:0.3rem;'
  btnSoumettre.textContent = '✅ Confirmer la déclaration'

  const btnAnnuler = document.createElement('button')
  btnAnnuler.id = 'decl-annuler'
  btnAnnuler.style.cssText = 'background:transparent;border:1.5px solid rgba(0,0,0,0.10);color:#888;padding:11px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;'
  btnAnnuler.textContent = 'Annuler'

  form.appendChild(blocType)
  form.appendChild(blocMontant)
  form.appendChild(blocNotes)
  form.appendChild(erreurEl)
  form.appendChild(btnSoumettre)
  form.appendChild(btnAnnuler)

  box.appendChild(btnClose)
  box.appendChild(titre)
  box.appendChild(refLine)
  box.appendChild(recapBox)
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)

  // ===== Comportement =====
  btnClose.addEventListener('click', () => modal.remove())
  btnAnnuler.addEventListener('click', () => modal.remove())
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove() })

  btnSoumettre.addEventListener('click', async () => {
    const montant = parseInt(inpMontant.value)
    if (!montant || montant < 1) {
      erreurEl.textContent = 'Veuillez entrer un montant valide.'
      erreurEl.style.display = 'block'
      return
    }

    erreurEl.style.display = 'none'
    btnSoumettre.textContent = 'Envoi en cours...'
    btnSoumettre.disabled = true

    try {
      const r = await fetch('/transactions/declarer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: reservation.id,
          montant_fcfa: montant,
          type_transaction: selType.value,
          notes: inpNotes.value.trim()
        })
      })
      const data = await r.json()

      if (data.success) {
        // ===== Écran de succès =====
        box.textContent = ''
        const successDiv = document.createElement('div')
        successDiv.style.cssText = 'text-align:center;padding:1.5rem 1rem;'

        const emoji = document.createElement('div')
        emoji.style.cssText = 'font-size:46px;margin-bottom:1rem;'
        emoji.textContent = '✅'

        const h3 = document.createElement('h3')
        h3.style.cssText = 'font-size:19px;font-weight:700;color:#1A1A18;margin:0 0 8px;'
        h3.textContent = 'Transaction déclarée !'

        const p = document.createElement('p')
        p.style.cssText = 'color:#555;line-height:1.7;margin:0 0 1.4rem;font-size:14px;'
        p.appendChild(document.createTextNode('Commission ImmoCG (10%) : '))
        const strongComm = document.createElement('strong')
        strongComm.style.color = '#C9963A'
        strongComm.textContent = `${data.commission_fcfa.toLocaleString('fr-FR')} FCFA`
        p.appendChild(strongComm)
        p.appendChild(document.createElement('br'))
        p.appendChild(document.createTextNode('À régler sous 7 jours.'))

        const btnFermer = document.createElement('button')
        btnFermer.style.cssText = 'background:#C9963A;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-weight:600;cursor:pointer;font-size:14.5px;'
        btnFermer.textContent = 'Fermer'
        btnFermer.addEventListener('click', () => {
          modal.remove()
          chargerReservations()
        })

        successDiv.appendChild(emoji)
        successDiv.appendChild(h3)
        successDiv.appendChild(p)
        successDiv.appendChild(btnFermer)
        box.appendChild(successDiv)
      } else {
        erreurEl.textContent = data.message || 'Erreur lors de la déclaration.'
        erreurEl.style.display = 'block'
        btnSoumettre.textContent = '✅ Confirmer la déclaration'
        btnSoumettre.disabled = false
      }
    } catch {
      erreurEl.textContent = 'Erreur de connexion. Réessayez.'
      erreurEl.style.display = 'block'
      btnSoumettre.textContent = '✅ Confirmer la déclaration'
      btnSoumettre.disabled = false
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