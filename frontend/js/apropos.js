async function chargerStats() {
      try {
        const r1 = await fetch('/biens')
        const d1 = await r1.json()
        document.getElementById('nb-biens').textContent = (d1.biens || []).length

        const r2 = await fetch('/auth/stats')
        const d2 = await r2.json()
        if (d2.success) document.getElementById('nb-agences').textContent = d2.actives
      } catch {}
    }
    chargerStats()