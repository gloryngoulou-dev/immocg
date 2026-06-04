async function envoyerMessage() {
      const nom = document.getElementById('nom').value.trim()
      const tel = document.getElementById('tel').value.trim()
      const email = document.getElementById('email')?.value.trim() || ''
      const msg = document.getElementById('message-text').value.trim()
      const sujet = document.getElementById('sujet').options[document.getElementById('sujet').selectedIndex].text
      const msgEl = document.getElementById('msg')

      if (!nom || !tel || !msg) {
        msgEl.textContent = 'Veuillez remplir tous les champs obligatoires.'
        msgEl.className = 'message error'
        return
      }

      msgEl.textContent = 'Envoi en cours...'
      msgEl.className = 'message'

      try {
        const r = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom, tel, email, sujet, message: msg })
        })
        const data = await r.json()

        if (data.success) {
          msgEl.textContent = '✅ ' + data.message
          msgEl.className = 'message success'
          document.getElementById('message-text').value = ''
          return
        }

        if (data.fallback_whatsapp) {
          ouvrirWhatsApp(nom, tel, sujet, msg)
          msgEl.textContent = '✅ Redirection WhatsApp — nous vous répondrons sous 24h.'
          msgEl.className = 'message success'
          return
        }

        msgEl.textContent = data.message || 'Erreur lors de l\'envoi.'
        msgEl.className = 'message error'
      } catch {
        ouvrirWhatsApp(nom, tel, sujet, msg)
        msgEl.textContent = '✅ Redirection WhatsApp — nous vous répondrons sous 24h.'
        msgEl.className = 'message success'
      }
    }

    function ouvrirWhatsApp(nom, tel, sujet, msg) {
      const texte = `Bonjour ImmoCG !\n\nSujet: ${sujet}\nNom: ${nom}\nTél: ${tel}\n\nMessage: ${msg}`
      window.open(`https://wa.me/242068834146?text=${encodeURIComponent(texte)}`, '_blank', 'noopener,noreferrer')
    }