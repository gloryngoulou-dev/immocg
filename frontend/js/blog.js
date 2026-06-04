const articles = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
    cat: 'Guide locataire',
    titre: 'Comment trouver un appartement à Brazzaville en 2026',
    desc: 'Nos conseils pratiques pour trouver votre logement rapidement et en toute sécurité.',
    date: 'Mai 2026',
    contenu: `
      <h3>1. Définissez votre budget</h3>
      <p>Prévoyez 3 mois de loyer pour emménager : 2 mois de caution remboursable + 1 mois de frais d'agence.</p>
      <h3>2. Choisissez votre quartier</h3>
      <ul>
        <li><strong>Bacongo</strong> : Calme, résidentiel</li>
        <li><strong>Poto-Poto</strong> : Animé, central</li>
        <li><strong>Moungali</strong> : Populaire, accessibles</li>
        <li><strong>Centre-ville</strong> : Premium</li>
      </ul>
      <h3>3. Passez par une agence certifiée ImmoCG</h3>
      <p>Biens vérifiés, prix réels, accompagnement professionnel.</p>
      <h3>4. Vérifiez le bien avant de signer</h3>
      <ul>
        <li>Visitez en journée</li>
        <li>Vérifiez eau et électricité</li>
        <li>Testez la plomberie</li>
        <li>Vérifiez la sécurité du quartier</li>
      </ul>
    `
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    cat: 'Prix du marché',
    titre: 'Prix des loyers à Brazzaville en 2026 — quartier par quartier',
    desc: 'Les prix moyens dans chaque quartier pour mieux préparer votre budget.',
    date: 'Mai 2026',
    contenu: `
      <h3>Studios (1 pièce)</h3>
      <ul>
        <li>Moungali / Ouenzé : 50 000 — 100 000 FCFA</li>
        <li>Poto-Poto / Bacongo : 80 000 — 150 000 FCFA</li>
        <li>Centre-ville : 150 000 — 250 000 FCFA</li>
      </ul>
      <h3>Appartements F2/F3</h3>
      <ul>
        <li>Quartiers populaires : 100 000 — 200 000 FCFA</li>
        <li>Résidentiels : 200 000 — 400 000 FCFA</li>
        <li>Standing : 400 000 — 800 000 FCFA</li>
      </ul>
      <h3>Villas</h3>
      <ul>
        <li>Standard : 300 000 — 600 000 FCFA</li>
        <li>Haut standing : 1 200 000 FCFA et plus</li>
      </ul>
    `
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
    cat: 'Droits & Lois',
    titre: 'Droits du locataire au Congo — ce que vous devez savoir',
    desc: 'Connaissez vos droits pour éviter les abus et les arnaques.',
    date: 'Mai 2026',
    contenu: `
      <h3>La loi qui vous protège</h3>
      <p>Loi n° 37-2012 portant réglementation de la location à usage d'habitation.</p>
      <h3>Vos droits</h3>
      <ul>
        <li>Contrat de bail écrit obligatoire</li>
        <li>Caution remboursable à la fin du bail</li>
        <li>Préavis obligatoire avant résiliation</li>
        <li>Logement en bon état garanti</li>
      </ul>
      <h3>Vos obligations</h3>
      <ul>
        <li>Payer le loyer à temps</li>
        <li>Entretenir le logement</li>
        <li>Pas de sous-location sans accord</li>
      </ul>
    `
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
    cat: 'Investissement',
    titre: 'Acheter un bien au Congo — guide complet',
    desc: 'Tout ce qu\'il faut savoir avant d\'acheter terrain, maison ou appartement.',
    date: 'Mai 2026',
    contenu: `
      <h3>Les frais</h3>
      <ul>
        <li>Commission agence : 10% (payée par le vendeur)</li>
        <li>Frais notaire : 5% (à votre charge)</li>
      </ul>
      <h3>Documents à vérifier</h3>
      <ul>
        <li>Titre foncier (le plus sûr)</li>
        <li>Attestation villagéoise</li>
        <li>Permis de construire</li>
      </ul>
      <h3>⚠️ Attention</h3>
      <p>Ne jamais payer sans titre foncier vérifié par un notaire.</p>
    `
  }
]

function afficherArticles() {
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
  }
  const container = document.getElementById('liste-articles')
  container.textContent = ''
  articles.forEach(a => {
    const div = document.createElement('div')
    div.className = 'article'
    div.addEventListener('click', () => lireArticle(a.id))

    // Image
    const imgDiv = document.createElement('div')
    imgDiv.className = 'article-img'
    try {
      const u = new URL(a.image)
      if (u.protocol === 'https:' || u.protocol === 'http:') {
        imgDiv.style.backgroundImage = `url(${a.image})`
      }
    } catch(e) {}
    const overlay = document.createElement('div')
    overlay.className = 'article-img-overlay'
    const catSpan = document.createElement('span')
    catSpan.className = 'article-img-cat'
    catSpan.textContent = a.cat
    overlay.appendChild(catSpan)
    imgDiv.appendChild(overlay)

    // Body
    const body = document.createElement('div')
    body.className = 'article-body'
    const titre = document.createElement('div')
    titre.className = 'article-titre'
    titre.textContent = a.titre
    const desc = document.createElement('div')
    desc.className = 'article-desc'
    desc.textContent = a.desc
    const meta = document.createElement('div')
    meta.className = 'article-meta'
    meta.textContent = `📅 ${a.date} · 3 min de lecture`
    body.appendChild(titre)
    body.appendChild(desc)
    body.appendChild(meta)

    div.appendChild(imgDiv)
    div.appendChild(body)
    container.appendChild(div)
  })
}

    function lireArticle(id) {
      const a = articles.find(x => x.id === id)
      if (!a) return
      const el = document.getElementById('article-complet')
      el.innerHTML = DOMPurify.sanitize(`
        <button class="btn-retour" onclick="fermerArticle()">← Retour aux articles</button>
        <div class="article-cat">${a.cat}</div>
        <h2>${a.titre}</h2>
        <div class="article-meta" style="margin-bottom:1.5rem;">📅 ${a.date}</div>
        ${a.contenu}
        <div style="margin-top:2rem;padding:1.5rem;background:#F7F3EC;border-radius:10px;">
          <p style="font-size:14px;color:#444;">Vous cherchez un logement au Congo ? <a href="index.html" style="color:#C9963A;font-weight:600;">Consultez nos annonces →</a></p>
        </div>
      `)
      el.classList.add('active')
      document.getElementById('liste-articles').style.display = 'none'
      el.scrollIntoView({ behavior: 'smooth' })
    }

    function fermerArticle() {
      document.getElementById('article-complet').classList.remove('active')
      document.getElementById('liste-articles').style.display = 'grid'
    }

    afficherArticles()