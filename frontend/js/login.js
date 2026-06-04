document.addEventListener('DOMContentLoaded', () => {

    // Si déjà connecté, rediriger
    const token = localStorage.getItem('immocg_token')
    const user = JSON.parse(localStorage.getItem('immocg_user') || 'null')
    if (token && user) {
      if (user.role === 'admin') window.location.href = 'admin.html'
      else window.location.href = 'dashboard.html'
    }

    async function seConnecter() {
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      const btn = document.getElementById('btn-login')

      if (!email || !password) {
        afficherMessage('Veuillez remplir tous les champs.', 'error')
        return
      }

      btn.disabled = true
      btn.textContent = 'Connexion...'

      try {
        const r = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, mot_de_passe: password })
        })
        const data = await r.json()

        if (data.success) {
          // Le token JWT est géré côté serveur via cookie HttpOnly
          // On stocke uniquement les infos non-sensibles pour l'UI
          localStorage.setItem('immocg_user', JSON.stringify({
            nom: data.user.nom,
            email: data.user.email,
            role: data.user.role
          }))
          afficherMessage('✅ Connexion réussie ! Redirection...', 'success')
          setTimeout(() => {
            if (data.user.role === 'admin') window.location.href = 'admin.html'
            else window.location.href = 'dashboard.html'
          }, 1000)
        } else {
          afficherMessage(data.message, 'error')
          btn.disabled = false
          btn.textContent = 'Se connecter'
        }
      } catch (err) {
        afficherMessage('Erreur de connexion au serveur.', 'error')
        btn.disabled = false
        btn.textContent = 'Se connecter'
      }
    }

    function afficherMessage(msg, type) {
      const el = document.getElementById('message')
      el.textContent = msg
      el.className = 'message ' + type
    }

    // Connexion avec Entrée
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') seConnecter()
    })
  

}) // DOMContentLoaded