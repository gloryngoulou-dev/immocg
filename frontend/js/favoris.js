function esc(v) {
      return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
    }

    async function chargerFavoris() {
      const favoris = JSON.parse(localStorage.getItem('favoris_immocg') || '[]')
      const container = document.getElementById('liste-favoris')

      if (favoris.length === 0) {
        document.getElementById('nb-favoris').textContent = 'Aucun favori sauvegardé'
        container.textContent = ''
        const div = document.createElement('div')
        div.className = 'empty-state'
        div.style.gridColumn = '1/-1'
        const h2 = document.createElement('h2')
        h2.textContent = 'Aucun favori'
        const p = document.createElement('p')
        p.textContent = 'Vous n\'avez pas encore sauvegardé de biens. Explorez nos annonces et cliquez sur ❤️ pour sauvegarder.'
        const btn = document.createElement('button')
        btn.className = 'btn-explorer'
        btn.textContent = 'Explorer les biens'
        btn.addEventListener('click', () => window.location.href = 'index.html')
        div.appendChild(h2)
        div.appendChild(p)
        div.appendChild(btn)
        container.appendChild(div)
        return
      }

      document.getElementById('nb-favoris').textContent = `${favoris.length} bien(s) sauvegardé(s)`

      const biens = []
      for (const id of favoris) {
        try {
          const r = await fetch(`/biens/${encodeURIComponent(id)}`)
          const d = await r.json()
          if (d.success) biens.push(d.bien)
        } catch {}
      }

      container.textContent = ''

      if (biens.length === 0) {
        const div = document.createElement('div')
        div.style.cssText = 'text-align:center;padding:3rem;color:#888780;grid-column:1/-1;'
        div.textContent = 'Ces biens ne sont plus disponibles.'
        container.appendChild(div)
        return
      }

      const icones = { 'Villa': '🏡', 'Appartement': '🏢', 'Studio': '🏠', 'Maison': '🏘️' }

      biens.forEach(b => {
        function safeUrl(url) {
          try {
            const u = new URL(url)
            return (u.protocol === 'https:' || u.protocol === 'http:') ? url : ''
          } catch(e) { return '' }
        }

        const card = document.createElement('div')
        card.className = 'card'

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
        badge.className = 'card-badge'
        badge.textContent = b.mode === 'louer' ? 'À louer' : 'À vendre'
        const btnRetirer = document.createElement('button')
        btnRetirer.className = 'card-remove'
        btnRetirer.title = 'Retirer des favoris'
        btnRetirer.textContent = '✕'
        btnRetirer.addEventListener('click', (e) => retirerFavori(b.id, e.target))
        cardImg.appendChild(badge)
        cardImg.appendChild(btnRetirer)

        // Body
        const cardBody = document.createElement('div')
        cardBody.className = 'card-body'
        cardBody.addEventListener('click', () => window.location.href = 'bien.html?id=' + encodeURIComponent(b.id))

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

        const cardBtn = document.createElement('button')
        cardBtn.className = 'card-btn'
        cardBtn.textContent = 'Voir le détail'

        cardBody.appendChild(cardType)
        cardBody.appendChild(cardTitre)
        cardBody.appendChild(cardPrix)
        cardBody.appendChild(cardLoc)
        cardBody.appendChild(cardBtn)

        card.appendChild(cardImg)
        card.appendChild(cardBody)
        container.appendChild(card)
      })

    function retirerFavori(id, btn) {
      let favoris = JSON.parse(localStorage.getItem('favoris_immocg') || '[]')
      favoris = favoris.filter(f => f !== id)
      localStorage.setItem('favoris_immocg', JSON.stringify(favoris))
      btn.closest('.card').remove()
      const restant = document.querySelectorAll('.card').length
      document.getElementById('nb-favoris').textContent = `${restant} bien(s) sauvegardé(s)`
      if (restant === 0) chargerFavoris()
    }

    chargerFavoris()
    }