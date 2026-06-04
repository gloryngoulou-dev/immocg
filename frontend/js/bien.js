// Configuration des taux - À MODIFIER SELON VOS TAUX RÉELS
    const TAUX_CAUTION_MOIS = 3
    const TAUX_FRAIS_AGENCE_LOCATION = 1.0
    const TAUX_FRAIS_AGENCE_VENTE = 0.10
    const TAUX_FRAIS_NOTAIRE_VENTE = 0.05
    const FRAIS_VISITE = 5000

    // Récupérer l'ID dans l'URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    async function chargerBien() {
      if (!id) {
        const div = document.createElement('div')
        div.className = 'loading'
        div.textContent = 'Aucun bien sélectionné.'
        document.getElementById('contenu').replaceChildren(div)
        return;
      }

      try {
        const reponse = await fetch(`/biens/${encodeURIComponent(id)}`);
        const data = await reponse.json();

        if (!data.success) {
          const div = document.createElement('div')
          div.className = 'loading'
          div.textContent = 'Bien introuvable.'
          document.getElementById('contenu').replaceChildren(div)
          return;
        }

        afficherBien(data.bien);

      } catch (erreur) {
        const div = document.createElement('div')
        div.className = 'loading'
        div.textContent = '⚠️ Erreur de connexion au serveur. Vérifiez votre connexion.'
        document.getElementById('contenu').replaceChildren(div)
      }
    }

    function afficherBien(b) {
      // Fonction d'échappement HTML pour prévenir les XSS
      function esc(val) {
        return String(val == null ? '' : val)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
      }
      const titre = b.titre || b.Titre || `${b.Type || b.type || 'Bien'} à ${b.Quartier || b.quartier || ''}`;
      const type = b.Type || b.type || 'Bien';
      const quartier = b.Quartier || b.quartier || '';
      const ville = b.ville || 'Brazzaville';
      const adresse = b.adresse || '';
      const prix = b.Prix || b.prix || 0;
      const unite = b.unite || 'FCFA';
      const mode = (b.mode || b.Mode || '').toLowerCase();
      const estLocation = mode === 'louer' || mode === 'location';
      const modeLabel = estLocation ? '📍 À LOUER' : '💰 À VENDRE';
      const chambres = b.Chambres || b.chambres || 0;
      const sallesBain = b.salles_bain || 0;
      const surface = b.Surface || b.surface || 0;
      const surfaceTerrain = b.surface_terrain || 0;
      const description = b.Description || b.description || 'Aucune description disponible.';
      const etat = b.ETAT || b.etat || '';
      const meuble = b.meuble || '';
      const etage = b.Etage || b.etage || '';
      const stationnement = b.Stationnement || b.stationnement || '';
      
      // Images
      let images = [];
      if (b.Images && Array.isArray(b.Images)) {
        images = b.Images;
      } else if (b.images && Array.isArray(b.images)) {
        images = b.images;
      } else if (b.image_url) {
        images = [b.image_url];
      }
      
      const imagePrincipale = images.length > 0 ? images[0] : 'https://placehold.co/800x400?text=Image+non+disponible';

      // Équipements
      let equipements = [];
      if (b.Équipements && Array.isArray(b.Équipements)) {
        equipements = b.Équipements;
      } else if (b.equipements && Array.isArray(b.equipements)) {
        equipements = b.equipements;
      }

      // Contact
      const contactNom = b.contact_nom || 'Agence ImmoCG';
      const contactTel = b.contact_tel || b.Téléphone || '+242 05 123 4567';
      const contactWhatsapp = b.contact_whatsapp || '';
      const contactEmail = b.contact_email || 'contact@immocg.com';
      const contactInitiales = contactNom !== 'Agence ImmoCG' 
        ? contactNom.split(' ').map(n => n[0]).join('').substring(0, 2) 
        : 'AG';

      // ========== CALCUL DES FRAIS (TOUJOURS AFFICHÉS) ==========
      
      
      let caution = 0;
      let fraisNotaire = 0;
      let total = prix;
      

// Calcul frais de visite selon prix
function calculerFraisVisite(prix) {
  if (prix < 100000) return 0
  if (prix < 300000) return 5000
  if (prix < 600000) return 10000
  return 15000
}

const fraisVisite = calculerFraisVisite(prix)
let detailsHTML = ''

if (estLocation) {
  const moisCaution = 2
  const moisAgence = 1
  const totalMois = moisCaution + moisAgence
  const caution = prix * moisCaution
  const fraisAgence = prix * moisAgence
  const total = caution + fraisAgence

  detailsHTML = `
    <div style="background:#e8f4e8;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#2d6e2d;font-weight:500;">
      ✅ Pour emménager : <strong>${totalMois} mois de loyer</strong>
    </div>
    <div class="prix-ligne">
      <span>🔒 Caution (${moisCaution} mois)</span>
      <span>${caution.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="prix-ligne">
      <span>🏢 Frais d'agence (${moisAgence} mois)</span>
      <span>${fraisAgence.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="prix-ligne total">
      <span>💰 TOTAL À PRÉVOIR</span>
      <span>${total.toLocaleString('fr-FR')} FCFA</span>
    </div>
    ${fraisVisite > 0 ? `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);font-size:12px;color:#888780;display:flex;justify-content:space-between;">
      <span>👁️ Frais de visite</span>
      <span>${fraisVisite.toLocaleString('fr-FR')} FCFA</span>
    </div>` : `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);font-size:12px;color:#2d6e2d;">
      👁️ Visite gratuite pour ce bien
    </div>`}
    <div class="info-frais">
      ⓘ Caution de ${moisCaution} mois remboursable à votre départ.
    </div>
    <div style="margin-top:10px;background:#fffdf5;border-radius:8px;padding:10px;font-size:12px;color:#7A5A1A;line-height:1.6;">
      📋 <strong>Comment ça se passe ?</strong><br>
      À la signature : ${totalMois} mois = ${total.toLocaleString('fr-FR')} FCFA<br>
      Chaque mois : ${prix.toLocaleString('fr-FR')} FCFA de loyer<br>
      Au départ : ${caution.toLocaleString('fr-FR')} FCFA remboursés
    </div>
  `
} else {
  const tauxAgence = 0.10
  const tauxNotaire = 0.05
  const fraisAgence = Math.round(prix * tauxAgence)
  const fraisNotaire = Math.round(prix * tauxNotaire)
  const totalFrais = fraisAgence + fraisNotaire
  const totalAcquisition = prix + totalFrais

  detailsHTML = `
    <div style="background:#e8f4e8;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#2d6e2d;font-weight:500;">
      ✅ Frais d'acquisition : <strong>15% du prix</strong>
    </div>
    <div class="prix-ligne">
      <span>🏠 Prix du bien</span>
      <span>${prix.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="prix-ligne">
      <span>🏢 Commission agence (10%)</span>
      <span>${fraisAgence.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="prix-ligne">
      <span>⚖️ Frais de notaire (5%)</span>
      <span>${fraisNotaire.toLocaleString('fr-FR')} FCFA</span>
    </div>
    <div class="prix-ligne total">
      <span>💰 TOTAL ACQUISITION</span>
      <span>${totalAcquisition.toLocaleString('fr-FR')} FCFA</span>
    </div>
    ${fraisVisite > 0 ? `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);font-size:12px;color:#888780;display:flex;justify-content:space-between;">
      <span>👁️ Frais de visite</span>
      <span>${fraisVisite.toLocaleString('fr-FR')} FCFA</span>
    </div>` : ''}
    <div class="info-frais">
      ⓘ Commission agence payée par le vendeur.
    </div>
    <div style="margin-top:10px;background:#fffdf5;border-radius:8px;padding:10px;font-size:12px;color:#7A5A1A;line-height:1.6;">
      📋 <strong>Comment ça se passe ?</strong><br>
      Vous payez : ${prix.toLocaleString('fr-FR')} FCFA au vendeur<br>
      + ${fraisNotaire.toLocaleString('fr-FR')} FCFA au notaire<br>
      Commission agence payée par le vendeur
    </div>
  `
}

      // Badges
      const badges = [];
      if (meuble) badges.push(`<span class="badge badge-meuble">${meuble === 'oui' ? '🏠 Meublé' : '🔑 Non meublé'}</span>`);
      if (etat) badges.push(`<span class="badge badge-etat">🔧 ${etat}</span>`);
      if (stationnement) badges.push(`<span class="badge badge-stationnement">🅿️ ${stationnement}</span>`);
      if (etage && etage !== '0') badges.push(`<span class="badge">📌 Étage: ${etage}</span>`);

      const adresseComplete = [adresse, quartier, ville].filter(a => a && a.trim()).join(', ')

      // Valider les URLs images (seulement http/https)
      function safeUrl(url) {
        try {
          const u = new URL(url)
          return (u.protocol === 'https:' || u.protocol === 'http:') ? url : ''
        } catch(e) { return '' }
      }
      const safeImagePrincipale = safeUrl(imagePrincipale)

      document.getElementById('contenu').innerHTML = DOMPurify.sanitize(`
        <div>
          <div class="galerie">
            <div class="galerie-main" id="main-photo" style="background-image:url(${safeImagePrincipale});"></div>
            ${images.length > 1 ? `
            <div class="galerie-thumbs">
              ${images.map((url, i) => {
                const safe = safeUrl(url)
                return safe ? `<div class="thumb ${i===0?'active':''}" style="background-image:url(${safe});"
                     onclick="changePhoto('${safe}', this)"></div>` : ''
              }).join('')}
            </div>` : ''}
          </div>

          <div class="bien-type">${esc(type)} · ${esc(modeLabel)}</div>
          <div class="bien-titre">${esc(titre)}</div>
          <div class="bien-loc">
            📍 ${esc(adresseComplete || quartier)} · Réf. IMC-${esc(String(b.id).padStart(4, '0'))}
          </div>
          
          <div class="bien-prix">
            ${parseInt(prix).toLocaleString('fr-FR')}
            <span>${esc(unite)}${mode === 'location' ? '/mois' : ''}</span>
          </div>

          <div class="feats">
            <div class="feat">
              <span class="feat-icon">🛏</span>
              <div class="feat-val">${esc(chambres)}</div>
              <div class="feat-lbl">Chambres</div>
            </div>
            <div class="feat">
              <span class="feat-icon">🚿</span>
              <div class="feat-val">${esc(sallesBain)}</div>
              <div class="feat-lbl">Salles de bain</div>
            </div>
            <div class="feat">
              <span class="feat-icon">📐</span>
              <div class="feat-val">${esc(surface)}m²</div>
              <div class="feat-lbl">Surface habitable</div>
            </div>
            ${surfaceTerrain > 0 ? `
            <div class="feat">
              <span class="feat-icon">🌳</span>
              <div class="feat-val">${esc(surfaceTerrain)}m²</div>
              <div class="feat-lbl">Terrain</div>
            </div>` : ''}
          </div>

          ${badges.length > 0 ? `
          <div class="section-titre">Caractéristiques</div>
          <div>${badges.join('')}</div>` : ''}

          <div class="section-titre">Description</div>
          <div class="description">${esc(description).replace(/\n/g, '<br>')}</div>

          ${b.video_url && safeUrl(b.video_url) ? `
          <div class="section-titre">Visite virtuelle</div>
          <div style="position:relative;padding-bottom:56.25%;height:0;border-radius:12px;overflow:hidden;margin-bottom:1.5rem;">
            <iframe src="${safeUrl(b.video_url.includes('youtube') ? b.video_url.replace('watch?v=', 'embed/') : b.video_url)}" 
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
              allowfullscreen></iframe>
          </div>` : ''}

          <div class="section-titre">Équipements &amp; services</div>
          <div class="equipements">
            ${equipements.length > 0 
              ? equipements.map(e => `<div class="equip">✅ ${esc(typeof e === 'string' ? e : e.nom || e)}</div>`).join('') 
              : '<div class="equip" style="color:#888780">Aucun équipement renseigné</div>'}
          </div>
        </div>

        <div class="contact-card">
          <div class="agent">
            <div class="agent-avatar">${esc(contactInitiales)}</div>
            <div>
              <div class="agent-nom">${esc(contactNom)}</div>
              <div class="agent-role">Agent immobilier</div>
              ${contactTel && contactTel !== '+242 05 123 4567' ? `<a href="tel:${esc(contactTel)}" class="agent-phone">📞 ${esc(contactTel)}</a>` : ''}
              ${contactWhatsapp ? `<a href="https://wa.me/${contactWhatsapp.replace(/[^0-9]/g, '')}" class="agent-phone" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
              ${contactEmail ? `<a href="mailto:${esc(contactEmail)}" class="agent-email">✉️ ${esc(contactEmail)}</a>` : ''}
            </div>
          </div>

          <div class="prix-resume">
            ${detailsHTML}
          </div>

          <button class="btn btn-primary" data-nom="${esc(contactNom)}" data-tel="${esc(contactTel)}" id="btn-contacter">📞 Contacter ${esc(contactNom.split(' ')[0])}</button>
          <button class="btn btn-outline" data-id="${esc(String(b.id))}" data-wa="${esc(contactWhatsapp || contactTel)}" id="btn-message">💬 Envoyer un message</button>
          <button class="btn btn-outline" data-id="${esc(String(b.id))}" id="btn-sauver">❤️ Sauvegarder</button>
        </div>
      `, { ADD_ATTR: ['onclick', 'target', 'rel'], FORCE_BODY: false })

      // SEO dynamique
        document.title = `${esc(titre)} — ${esc(quartier)}, ${esc(ville)} | ImmoCG`
        const metaDesc = document.getElementById('meta-desc')
        if (metaDesc) metaDesc.content = `${esc(type)} à ${mode === 'louer' ? 'louer' : 'vendre'} à ${esc(quartier)}, ${esc(ville)}. ${parseInt(prix).toLocaleString('fr-FR')} FCFA. ${esc(description.substring(0, 100))}...`
        const ogTitle = document.getElementById('og-title')
        if (ogTitle) ogTitle.content = `${esc(titre)} — ImmoCG`
        const ogImage = document.getElementById('og-image')
        if (ogImage && images[0]) ogImage.content = safeUrl(images[0]) || ''

      // Attacher les event listeners aux boutons (data-* au lieu d'onclick inline)
      const btnContacter = document.getElementById('btn-contacter')
      if (btnContacter) {
        btnContacter.addEventListener('click', () =>
          contacterAgence(btnContacter.dataset.nom, btnContacter.dataset.tel))
      }
      const btnMessage = document.getElementById('btn-message')
      if (btnMessage) {
        btnMessage.addEventListener('click', () =>
          envoyerMessage(btnMessage.dataset.id, btnMessage.dataset.wa))
      }
      const btnSauver = document.getElementById('btn-sauver')
      if (btnSauver) {
        btnSauver.addEventListener('click', () => sauvegarderBien(btnSauver.dataset.id))
      }
    }

    // Fonctions interactives
    function contacterAgence(nom, phone) {
      if (!phone || phone === '+242 05 123 4567') {
        showToast(`📞 Contactez ${nom} via le formulaire de contact`);
        return;
      }
      if (confirm(`Voulez-vous appeler ${nom} au ${phone} ?`)) {
        window.location.href = `tel:${phone}`;
      }
    }

    function envoyerMessage(bienId, whatsapp) {
      const message = prompt("Votre message :\n\nExprimez votre intérêt pour ce bien :");
      if (message && message.trim()) {
        if (whatsapp && whatsapp !== '+242 05 123 4567') {
          const numClean = whatsapp.replace(/[^0-9]/g, '');
          if (numClean && numClean.length > 8) {
            const url = `https://wa.me/${numClean}?text=${encodeURIComponent(message + '\n\nBien #' + bienId)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
          }
        }
        showToast(`✓ Message envoyé à l'agence. Nous vous répondrons sous 24h.`);
        console.log(`Message pour bien #${bienId}:`, message);
      }
    }

    function sauvegarderBien(bienId) {
      let favoris = JSON.parse(localStorage.getItem('favoris_immocg') || '[]');
      if (!favoris.includes(bienId)) {
        favoris.push(bienId);
        localStorage.setItem('favoris_immocg', JSON.stringify(favoris));
        showToast(`✓ Bien ajouté à vos favoris (${favoris.length} bien(s))`);
      } else {
        favoris = favoris.filter(id => id !== bienId);
        localStorage.setItem('favoris_immocg', JSON.stringify(favoris));
        showToast(`❤️ Bien retiré de vos favoris`);
      }
    }

    function changePhoto(url, el) {
      document.getElementById('main-photo').style.backgroundImage = `url(${url})`;
      document.querySelectorAll('.galerie-thumbs .thumb').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    }

    chargerBien();