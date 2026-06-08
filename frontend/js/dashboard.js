const user = JSON.parse(localStorage.getItem('immocg_user') || 'null')

  if (!user) {
    window.location.href = 'login.html'
  } else {
    if (user.role === 'admin') {
      window.location.href = 'admin.html'
    }
    document.getElementById('nav-user').textContent = user?.nom_agence || user?.nom || ''
    document.getElementById('welcome-title').textContent = `Bonjour, ${user?.nom_agence || user?.nom} 👋`
    document.getElementById('welcome-sub').textContent = `Bienvenue sur votre espace partenaire ImmoCG`
  }

  // Vérifier le cookie avant de charger les données
  async function init() {
    try {
      const r = await fetch('/auth/me', { credentials: 'include' })
      const data = await r.json()
      if (!data.success) {
        localStorage.removeItem('immocg_user')
        window.location.href = 'login.html'
        return
      }
      chargerMesBiens()
      chargerReservations()
    } catch {
      chargerMesBiens()
      chargerReservations()
    }
  }

  async function chargerMesBiens() {
    try {
      const r = await fetch('/biens/mine', {
        credentials: 'include'
      })

      if (r.status === 401) {
        // Session expirée — forcer reconnexion
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
        td.textContent = 'Vous n\'avez pas encore publié d\'annonces.'
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

        // Client
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

        // Bien
        const tdBien = document.createElement('td')
        tdBien.style.fontSize = '13px'
        tdBien.textContent = `Bien #${String(res.bien_id).substring(0,8)}...`
        tr.appendChild(tdBien)

        // Type
        const tdType = document.createElement('td')
        tdType.textContent = res.type_reservation === 'location_jour' ? '📅 Par jour'
          : res.type_reservation === 'achat' ? '💰 Achat' : '🏠 Visite'
        tr.appendChild(tdType)

        // Date
        const tdDate = document.createElement('td')
        tdDate.style.fontSize = '12px'
        tdDate.textContent = res.date_souhaitee
          ? new Date(res.date_souhaitee).toLocaleDateString('fr-FR')
          : '—'
        tr.appendChild(tdDate)

        // Statut
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

        // Actions
        const tdActions = document.createElement('td')
        if (res.statut === 'en_attente') {
          const btnConfirmer = document.createElement('button')
          btnConfirmer.className = 'btn-sm btn-valider'
          btnConfirmer.textContent = '✅ Valider'
          btnConfirmer.addEventListener('click', () => traiterReservation(res.id, 'confirmee'))

          const btnRefuser = document.createElement('button')
          btnRefuser.className = 'btn-sm btn-refuser'
          btnRefuser.textContent = '❌ Refuser'
          btnRefuser.addEventListener('click', () => traiterReservation(res.id, 'annulee'))

          tdActions.appendChild(btnConfirmer)
          tdActions.appendChild(btnRefuser)
        }

        // Afficher les critères si présents
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

  async function traiterReservation(id, statut) {
    const action = statut === 'confirmee' ? 'confirmer' : 'refuser'
    if (!confirm(`Voulez-vous ${action} cette réservation ?`)) return
    try {
      await fetch('/reservations/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ statut })
      })
      chargerReservations()
    } catch {}
  }

  function afficherCriteres(res) {
    const c = res.criteres_client || {}
    const lignes = []
    if (c.surface_min) lignes.push(`Surface min: ${c.surface_min}m²`)
    if (c.chambres_min) lignes.push(`Chambres min: ${c.chambres_min}`)
    if (c.notes) lignes.push(`Notes: ${c.notes}`)
    alert(`Critères de ${res.client_nom}:\n\n${lignes.join('\n') || 'Aucun critère spécifié'}`)
  }

  window.traiterReservation = traiterReservation
    if (!confirm('Supprimer cette annonce ?')) return
    await fetch('/biens/' + id, {
      method: 'DELETE',
      credentials: 'include'
    })
    chargerMesBiens()
  

  function seDeconnecter() {
    localStorage.removeItem('immocg_user')
    // Le cookie HttpOnly sera supprimé via une route logout
    fetch('/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
      window.location.href = 'login.html'
    })
  }

window.seDeconnecter = seDeconnecter
window.supprimerBien = supprimerBien

// Lancer après que toutes les fonctions sont définies
init()