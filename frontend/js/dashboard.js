document.addEventListener('DOMContentLoaded', () => {

  const token = localStorage.getItem('immocg_token')
  const user = JSON.parse(localStorage.getItem('immocg_user') || 'null')

  if (!token || !user) {
    window.location.href = 'login.html'
  }

  if (user?.role === 'admin') {
    window.location.href = 'admin.html'
  }

  document.getElementById('nav-user').textContent = user?.nom_agence || user?.nom || ''
  document.getElementById('welcome-title').textContent = `Bonjour, ${user?.nom_agence || user?.nom} 👋`
  document.getElementById('welcome-sub').textContent = `Bienvenue sur votre espace partenaire ImmoCG`

  async function chargerMesBiens() {
    try {
      const r = await fetch('/biens/mine', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
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

        // Image
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
        } else {
          imgDiv.textContent = '🏠'
        }
        tdImg.appendChild(imgDiv)
        tr.appendChild(tdImg)

        // Type / titre
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

        // Prix
        const tdPrix = document.createElement('td')
        tdPrix.textContent = `${parseInt(b.prix).toLocaleString('fr-FR')} ${b.unite}`
        tr.appendChild(tdPrix)

        // Localisation
        const tdLoc = document.createElement('td')
        tdLoc.textContent = `${b.quartier}, ${b.ville}`
        tr.appendChild(tdLoc)

        // Statut
        const tdStatut = document.createElement('td')
        const span = document.createElement('span')
        span.className = `badge ${b.statut}`
        span.textContent = b.statut === 'disponible' ? 'Disponible'
          : b.statut === 'attente' ? 'En attente'
          : b.statut === 'loue' ? 'Loué' : 'Vendu'
        tdStatut.appendChild(span)
        tr.appendChild(tdStatut)

        // Actions
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

  async function supprimerBien(id) {
    if (!confirm('Supprimer cette annonce ?')) return
    await fetch('/biens/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    chargerMesBiens()
  }

  function seDeconnecter() {
    localStorage.removeItem('immocg_token')
    localStorage.removeItem('immocg_user')
    window.location.href = 'login.html'
  }

  chargerMesBiens()

}) // DOMContentLoaded