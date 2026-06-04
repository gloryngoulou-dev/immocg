document.addEventListener('DOMContentLoaded', () => {

    let tousLesBiens = []
    // Gestion connexion
    const userConnecte = JSON.parse(localStorage.getItem('immocg_user') || 'null')
    if (userConnecte) {
      document.getElementById('nav-login').style.display = 'none'
      const navBtn = document.getElementById('nav-user-btn')
      navBtn.style.display = 'inline-block'
      navBtn.textContent = userConnecte.nom_agence || userConnecte.nom
      navBtn.href = userConnecte.role === 'admin' ? 'admin.html' : 'dashboard.html'
    }

    // Comment ça marche
    const steps = {
      chercheur: [
        { icon: '🔍', num: '1', title: 'Recherchez', desc: 'Filtrez par quartier, budget, type de bien' },
        { icon: '📸', num: '2', title: 'Consultez', desc: 'Photos, vidéos, équipements, localisation exacte' },
        { icon: '📞', num: '3', title: 'Contactez', desc: 'Appelez ou WhatsApp directement l\'agence' },
        { icon: '🏠', num: '4', title: 'Emménagez', desc: 'Visitez, signez et emménagez dans votre nouveau logement' }
      ],
      agence: [
        { icon: '📝', num: '1', title: 'Inscrivez-vous', desc: 'Créez votre compte agence en 2 minutes' },
        { icon: '✅', num: '2', title: 'Validation', desc: 'Notre équipe valide votre partenariat sous 24h' },
        { icon: '📝', num: '3', title: 'Publiez', desc: 'Ajoutez vos biens avec photos et détails' },
        { icon: '💰', num: '4', title: 'Encaissez', desc: 'Recevez des contacts qualifiés et concluez vos transactions' }
      ]
    }

    function afficherSteps(type, btn) {
      document.querySelectorAll('.how-tab').forEach(t => t.classList.remove('active'))
      btn.classList.add('active')
      const container = document.getElementById('how-steps')
      container.textContent = ''
      steps[type].forEach(s => {
        const div = document.createElement('div')
        div.className = 'how-step'
        const icon = document.createElement('div')
        icon.className = 'how-icon'
        icon.textContent = s.icon
        const num = document.createElement('div')
        num.className = 'how-num'
        num.textContent = s.num
        const title = document.createElement('div')
        title.className = 'how-title'
        title.textContent = s.title
        const desc = document.createElement('div')
        desc.className = 'how-desc'
        desc.textContent = s.desc
        div.appendChild(icon)
        div.appendChild(num)
        div.appendChild(title)
        div.appendChild(desc)
        container.appendChild(div)
      })
    }
    afficherSteps('chercheur', document.querySelector('.how-tab'))

    function majCompteur(n) {
      const el = document.getElementById('biens-count')
      if (el) el.textContent = n === 1 ? '1 bien trouvé' : `${n} biens trouvés`
    }

    function majHint(texte, loading) {
      const hint = document.getElementById('search-hint')
      if (!hint) return
      hint.textContent = texte || ''
      hint.classList.toggle('loading', !!loading)
    }

    function initRecherche() {
      const datalist = document.getElementById('liste-quartiers')
      if (datalist && typeof IMMOCG_CONFIG !== 'undefined') {
        datalist.textContent = ''
        IMMOCG_CONFIG.quartiers.forEach(q => {
          const opt = document.createElement('option')
          opt.value = q
          datalist.appendChild(opt)
        })
      }

      document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault()
        appliquerFiltres()
      })

      document.getElementById('search-type').addEventListener('change', appliquerFiltres)
      document.getElementById('search-mode').addEventListener('change', appliquerFiltres)

      let timer
      document.getElementById('search-quartier').addEventListener('input', () => {
        clearTimeout(timer)
        timer = setTimeout(appliquerFiltres, 350)
      })
    }

    async function chargerBiens(filtres = {}) {
      majHint('Chargement des biens à Brazzaville...', true)
      const params = new URLSearchParams()
      if (filtres.quartier) params.set('quartier', filtres.quartier)
      if (filtres.type) params.set('type', filtres.type)
      if (filtres.mode) params.set('mode', filtres.mode)

      try {
        const url = params.toString() ? `/biens?${params}` : '/biens'
        const r = await fetch(url)
        const data = await r.json()
        if (!data.success) throw new Error(data.message || 'Erreur')

        tousLesBiens = data.biens || []
        document.getElementById('stat-biens').textContent = tousLesBiens.length
        afficherBiens(tousLesBiens)
        majCompteur(tousLesBiens.length)
        majHint(tousLesBiens.length ? '' : 'Aucun bien pour ces critères.')
      } catch {
        const el = document.getElementById('liste-biens')
        el.textContent = ''
        const div = document.createElement('div')
        div.className = 'loading'
        div.textContent = 'Erreur de connexion. Réessayez.'
        el.appendChild(div)
        majHint('Impossible de charger les biens.')
      }
    }

    async function chargerStats() {
      try {
        const r = await fetch('/auth/stats')
        const data = await r.json()
        if (data.success) {
          document.getElementById('stat-agences').textContent = data.actives
        }
      } catch {}
    }
    chargerStats()

    function afficherBiens(biens) {
      const container = document.getElementById('liste-biens')
      container.textContent = ''

      if (biens.length === 0) {
        const div = document.createElement('div')
        div.className = 'empty-state'
        div.textContent = 'Aucun bien trouvé.'
        container.appendChild(div)
        return
      }

      const icones = { 'Villa': '🏡', 'Appartement': '🏢', 'Studio': '🏠', 'Maison': '🏘️', 'Bureau': '🏗️', 'Terrain': '🌳' }

      biens.forEach(b => {
        function safeUrl(url) {
          try { const u = new URL(url); return (u.protocol==='https:'||u.protocol==='http:') ? url : '' } catch { return '' }
        }

        const card = document.createElement('div')
        card.className = 'card'
        card.addEventListener('click', () => window.location.href = 'bien.html?id=' + encodeURIComponent(b.id))

        // Image
        const cardImg = document.createElement('div')
        cardImg.className = 'card-img'
        const imgSafe = safeUrl(b.image_url)
        if (imgSafe) {
          cardImg.style.backgroundImage = `url(${imgSafe})`
        } else {
          cardImg.textContent = icones[b.type] || '🏠'
        }
        const badge = document.createElement('div')
        badge.className = 'card-badge' + (b.mode === 'louer' ? ' louer' : '')
        badge.textContent = b.mode === 'louer' ? 'À louer' : 'À vendre'
        cardImg.appendChild(badge)

        // Body
        const cardBody = document.createElement('div')
        cardBody.className = 'card-body'

        const cardType = document.createElement('div')
        cardType.className = 'card-type'
        cardType.textContent = b.type

        const cardTitre = document.createElement('div')
        cardTitre.className = 'card-titre'
        cardTitre.textContent = b.titre || b.type + ' à ' + b.quartier

        const cardPrix = document.createElement('div')
        cardPrix.className = 'card-prix'
        cardPrix.textContent = `${parseInt(b.prix).toLocaleString('fr-FR')} `
        const prixSpan = document.createElement('span')
        prixSpan.textContent = b.unite
        cardPrix.appendChild(prixSpan)

        const cardLoc = document.createElement('div')
        cardLoc.className = 'card-loc'
        cardLoc.textContent = `📍 ${b.quartier}, ${b.ville}`

        const cardFeats = document.createElement('div')
        cardFeats.className = 'card-feats'
        ;[`🛏 ${b.chambres} ch.`, `🚿 ${b.salles_bain} sdb.`, `📐 ${b.surface}m²`].forEach(t => {
          const span = document.createElement('span')
          span.textContent = t
          cardFeats.appendChild(span)
        })

        const cardBtn = document.createElement('button')
        cardBtn.type = 'button'
        cardBtn.className = 'card-btn'
        cardBtn.textContent = 'Voir le détail'
        cardBtn.addEventListener('click', (e) => { e.stopPropagation(); window.location.href = 'bien.html?id=' + encodeURIComponent(b.id) })

        cardBody.appendChild(cardType)
        cardBody.appendChild(cardTitre)
        cardBody.appendChild(cardPrix)
        cardBody.appendChild(cardLoc)
        cardBody.appendChild(cardFeats)
        cardBody.appendChild(cardBtn)

        card.appendChild(cardImg)
        card.appendChild(cardBody)
        container.appendChild(card)
      })
    }

    function appliquerFiltres() {
      const quartier = document.getElementById('search-quartier').value.trim()
      const type = document.getElementById('search-type').value
      const mode = document.getElementById('search-mode').value

      document.querySelectorAll('.hero-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.quartier === quartier && quartier !== '')
      })

      chargerBiens({ quartier, type, mode })
      document.getElementById('biens').scrollIntoView({ behavior: 'smooth' })
    }

    function filtrerParQuartier(q) {
      document.getElementById('search-quartier').value = q
      appliquerFiltres()
    }

    function afficherTout() {
      document.getElementById('search-quartier').value = ''
      document.getElementById('search-type').value = ''
      document.getElementById('search-mode').value = ''
      document.querySelectorAll('.hero-tag').forEach(t => t.classList.remove('active'))
      chargerBiens()
    }

    initRecherche()
    chargerBiens()

    function toggleMenu() {
  const menu = document.getElementById('nav-menu')
  const closeBtn = document.getElementById('close-btn')
  const isOpen = menu.classList.toggle('open')
  closeBtn.style.display = isOpen ? 'block' : 'none'
  document.body.style.overflow = isOpen ? 'hidden' : ''
}

function closeMenu() {
  const menu = document.getElementById('nav-menu')
  menu.classList.remove('open')
  const closeBtn = document.getElementById('close-btn')
  if (closeBtn) closeBtn.style.display = 'none'
  document.body.style.overflow = ''
}

// UN SEUL event listener
document.addEventListener('click', (e) => {
  const menu = document.getElementById('nav-menu')
  const hamburger = document.querySelector('.hamburger')
  if (menu.classList.contains('open') && 
      !menu.contains(e.target) && 
      !hamburger.contains(e.target)) {
    closeMenu()
  }
})
  
}) // DOMContentLoaded