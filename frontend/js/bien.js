// Configuration des taux - À MODIFIER SELON VOS TAUX RÉELS
const TAUX_CAUTION_MOIS = 3;
const TAUX_FRAIS_AGENCE_LOCATION = 1.0;
const TAUX_FRAIS_AGENCE_VENTE = 0.10;
const TAUX_FRAIS_NOTAIRE_VENTE = 0.05;
const FRAIS_VISITE = 5000;

// Récupérer l'ID dans l'URL
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

let bienContactWhatsapp = '';
let bienContactTel = '';
let currentBienId = '';
let currentBienMode = '';

function getLeadsImmocg() {
  try { return JSON.parse(sessionStorage.getItem('immocg_leads') || '{}') } catch { return {} }
}

function enregistrerLead(bienId, reservationId, ref) {
  const leads = getLeadsImmocg()
  leads[String(bienId)] = {
    reservationId,
    ref: ref || `IMC-${String(reservationId).substring(0, 8).toUpperCase()}`,
    at: Date.now(),
  }
  sessionStorage.setItem('immocg_leads', JSON.stringify(leads))
}

function leadAutorise(bienId) {
  return !!getLeadsImmocg()[String(bienId)]
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function chargerBien() {
  if (!id) {
    const div = document.createElement('div');
    div.className = 'loading';
    div.textContent = 'Aucun bien sélectionné.';
    document.getElementById('contenu').replaceChildren(div);
    return;
  }

  try {
    const reponse = await fetch(`/biens/${encodeURIComponent(id)}`);
    const data = await reponse.json();

    if (!data.success) {
      const div = document.createElement('div');
      div.className = 'loading';
      div.textContent = 'Bien introuvable.';
      document.getElementById('contenu').replaceChildren(div);
      return;
    }

    afficherBien(data.bien);

  } catch (erreur) {
    const div = document.createElement('div');
    div.className = 'loading';
    div.textContent = '⚠️ Erreur de connexion au serveur. Vérifiez votre connexion.';
    document.getElementById('contenu').replaceChildren(div);
  }
}

function afficherBien(b) {
  // Fonction d'échappement HTML pour prévenir les XSS
  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }
  
  const titre = b.titre || b.Titre || `${b.Type || b.type || 'Bien'} à ${b.Quartier || b.quartier || ''}`;
  const type = b.Type || b.type || 'Bien';
  const quartier = b.Quartier || b.quartier || '';
  const ville = b.ville || 'Brazzaville';
  const adresse = b.adresse || '';
  const prix = b.Prix || b.prix || 0;
  const prixJour = b.prix_jour || 0;
  const dureeMin = b.duree_min_jours || 1;
  const unite = b.unite || 'FCFA';
  const mode = (b.mode || b.Mode || '').toLowerCase();
  const estLocation = mode === 'louer' || mode === 'location';
  const estParJour = mode === 'jour';
  const modeLabel = estParJour ? '📅 LOCATION PAR JOUR' : estLocation ? '📍 À LOUER' : '💰 À VENDRE';
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
  bienContactWhatsapp = contactWhatsapp;
  bienContactTel = contactTel;
  currentBienId = String(b.id);
  currentBienMode = mode;

  const lead = getLeadsImmocg()[currentBienId];
  const contactAutorise = leadAutorise(currentBienId);
  const refImmocg = lead?.ref || '';
  const waMsg = encodeURIComponent(`Bonjour, je vous contacte via ImmoCG (Ref: ${refImmocg}). Je suis intéressé(e) par ce bien.`);
  const waHref = contactWhatsapp
    ? `https://wa.me/${contactWhatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}`
    : (contactTel && contactTel !== '+242 05 123 4567'
      ? `https://wa.me/${contactTel.replace(/[^0-9]/g, '')}?text=${waMsg}`
      : '');
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
    if (prix < 100000) return 0;
    if (prix < 300000) return 5000;
    if (prix < 600000) return 10000;
    return 15000;
  }

  const fraisVisite = calculerFraisVisite(prix);
  let detailsHTML = '';

  if (estParJour) {
    // Calcul estimatif pour 3 nuits
    const total3Nuits = prixJour * 3;
    detailsHTML = `
      <div style="background:#e8f4e8;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#2d6e2d;font-weight:500;">
        📅 Location courte durée — ${dureeMin > 1 ? `min. ${dureeMin} nuits` : 'disponible à la nuit'}
      </div>
      <div class="prix-ligne">
        <span>🌙 Prix par nuit</span>
        <span>${parseInt(prixJour).toLocaleString('fr-FR')} ${esc(unite)}</span>
      </div>
      <div class="prix-ligne">
        <span>📆 Exemple 3 nuits</span>
        <span>${total3Nuits.toLocaleString('fr-FR')} ${esc(unite)}</span>
      </div>
      <div class="prix-ligne total">
        <span>🔒 Caution (remboursable)</span>
        <span>${parseInt(prixJour * 2).toLocaleString('fr-FR')} ${esc(unite)}</span>
      </div>
      <div class="info-frais">
        ⓘ La caution est remboursée à votre départ si aucun dommage.
      </div>
      <div style="margin-top:12px;background:#fffdf5;border-radius:8px;padding:10px;font-size:12px;color:#7A5A1A;line-height:1.6;">
        📋 <strong>Comment réserver ?</strong><br>
        1. Contactez l'agence ci-dessous<br>
        2. Confirmez vos dates par WhatsApp<br>
        3. Versez la caution pour bloquer le bien<br>
        ⚠️ Délai max. 48h pour confirmer votre arrivée
      </div>
    `;
  } else if (estLocation) {
    const moisCaution = 2;
    const moisAgence = 1;
    const totalMois = moisCaution + moisAgence;
    const caution = prix * moisCaution;
    const fraisAgence = prix * moisAgence;
    const total = caution + fraisAgence;

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
    `;
  } else {
    const tauxAgence = 0.10;
    const tauxNotaire = 0.05;
    const fraisAgence = Math.round(prix * tauxAgence);
    const fraisNotaire = Math.round(prix * tauxNotaire);
    const totalFrais = fraisAgence + fraisNotaire;
    const totalAcquisition = prix + totalFrais;

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
    `;
  }

  // Badges
  const badges = [];
  if (meuble) badges.push(`<span class="badge badge-meuble">${meuble === 'oui' ? '🏠 Meublé' : '🔑 Non meublé'}</span>`);
  if (etat) badges.push(`<span class="badge badge-etat">🔧 ${etat}</span>`);
  if (stationnement) badges.push(`<span class="badge badge-stationnement">🅿️ ${stationnement}</span>`);
  if (etage && etage !== '0') badges.push(`<span class="badge">📌 Étage: ${etage}</span>`);

  const adresseComplete = [adresse, quartier, ville].filter(a => a && a.trim()).join(', ');

  // Valider les URLs images (seulement http/https)
  function safeUrl(url) {
    try {
      const u = new URL(url);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '';
    } catch(e) { return ''; }
  }
  const safeImagePrincipale = safeUrl(imagePrincipale);

  // Générer le badge de vérification
  const verificationBadge = (() => {
    if (!b.derniere_verification) return '';
    const diff = Date.now() - new Date(b.derniere_verification).getTime();
    const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (jours <= 7) return '<div style="display:inline-flex;align-items:center;gap:6px;background:#d4edda;color:#155724;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:6px 0 8px;">✅ Disponibilité vérifiée il y a ' + jours + ' jour(s)</div>';
    if (jours <= 15) return '<div style="display:inline-flex;align-items:center;gap:6px;background:#fff3cd;color:#856404;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:6px 0 8px;">⚠️ Vérifié il y a ' + jours + ' jours</div>';
    return '<div style="display:inline-flex;align-items:center;gap:6px;background:#f8d7da;color:#721c24;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:6px 0 8px;">🔴 Non vérifié depuis ' + jours + ' jours</div>';
  })();

  document.getElementById('contenu').innerHTML = DOMPurify.sanitize(`
    <div>
      <div class="galerie">
        <div class="galerie-main" id="main-photo" style="background-image:url(${safeImagePrincipale});"></div>
        ${images.length > 1 ? `
        <div class="galerie-thumbs">
          ${images.map((url, i) => {
            const safe = safeUrl(url);
            return safe ? `<div class="thumb ${i===0?'active':''}" style="background-image:url(${safe});"
                 onclick="changePhoto('${safe}', this)"></div>` : '';
          }).join('')}
        </div>` : ''}
      </div>

      <div class="bien-type">${esc(type)} · ${esc(modeLabel)}</div>
      <div class="bien-titre">${esc(titre)}</div>
      <div class="bien-loc">
        📍 ${esc(adresseComplete || quartier)} · Réf. IMC-${esc(String(b.id).padStart(4, '0'))}
      </div>

      ${verificationBadge}

      <div class="bien-prix">
        ${estParJour 
          ? `${parseInt(prixJour).toLocaleString('fr-FR')}<span>${esc(unite)}/nuit${dureeMin > 1 ? ` · min. ${dureeMin} nuits` : ''}</span>`
          : `${parseInt(prix).toLocaleString('fr-FR')}<span>${esc(unite)}${estLocation && !unite.includes('/') ? '/mois' : ''}</span>`
        }
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
          ${contactAutorise ? `
            ${refImmocg ? `<div style="font-size:11px;color:#C9963A;font-weight:600;margin:4px 0;">Réf. ImmoCG : ${esc(refImmocg)}</div>` : ''}
            ${contactTel && contactTel !== '+242 05 123 4567' ? `<a href="tel:${esc(contactTel)}" class="agent-phone">📞 ${esc(contactTel)}</a>` : ''}
            ${waHref ? `<a href="${waHref}" class="agent-phone" target="_blank" rel="noopener">💬 WhatsApp (Ref ImmoCG)</a>` : ''}
            ${contactEmail ? `<a href="mailto:${esc(contactEmail)}" class="agent-email">✉️ ${esc(contactEmail)}</a>` : ''}
          ` : `
            <div style="background:#fffdf5;border:1px solid #f0d98a;border-radius:8px;padding:10px;font-size:12px;color:#7A5A1A;margin-top:8px;line-height:1.6;">
              🔒 <strong>Contact via ImmoCG</strong><br>
              Envoyez d'abord une demande officielle pour obtenir une référence unique et tracer votre dossier.
            </div>
          `}
        </div>
      </div>

      <div class="prix-resume">
        ${detailsHTML}
      </div>

      ${contactAutorise
        ? `<button class="btn btn-primary" data-nom="${esc(contactNom)}" data-tel="${esc(contactTel)}" data-id="${esc(currentBienId)}" data-mode="${esc(mode)}" id="btn-contacter">📞 Contacter ${esc(contactNom.split(' ')[0])}</button>`
        : `<button class="btn btn-primary" data-id="${esc(currentBienId)}" data-mode="${esc(mode)}" id="btn-contacter">📝 Demander via ImmoCG</button>`
      }
      <button class="btn btn-reserve" data-id="${esc(String(b.id))}" data-mode="${esc(mode)}" id="btn-reserver">📅 ${estParJour ? 'Réserver ce logement' : 'Demander une visite'}</button>
      <button class="btn btn-outline" data-id="${esc(String(b.id))}" id="btn-sauver">❤️ Sauvegarder</button>
      <button class="btn btn-signaler" data-id="${esc(String(b.id))}" id="btn-signaler" style="background:none;border:1px solid #ddd;color:#888;font-size:12px;padding:8px 16px;border-radius:8px;cursor:pointer;margin-top:4px;">⚠️ Signaler une erreur</button>
    </div>
  `, { ADD_ATTR: ['onclick', 'target', 'rel'], FORCE_BODY: false });

  // SEO dynamique
  document.title = `${esc(titre)} — ${esc(quartier)}, ${esc(ville)} | ImmoCG`;
  const metaDesc = document.getElementById('meta-desc');
  if (metaDesc) metaDesc.content = `${esc(type)} à ${mode === 'louer' ? 'louer' : 'vendre'} à ${esc(quartier)}, ${esc(ville)}. ${parseInt(prix).toLocaleString('fr-FR')} FCFA. ${esc(description.substring(0, 100))}...`;
  const ogTitle = document.getElementById('og-title');
  if (ogTitle) ogTitle.content = `${esc(titre)} — ImmoCG`;
  const ogImage = document.getElementById('og-image');
  if (ogImage && images[0]) ogImage.content = safeUrl(images[0]) || '';

  // Attacher les event listeners aux boutons
  const btnContacter = document.getElementById('btn-contacter');
  if (btnContacter) {
    btnContacter.addEventListener('click', () =>
      contacterAgence(btnContacter.dataset.nom, btnContacter.dataset.tel, btnContacter.dataset.id, btnContacter.dataset.mode));
  }
  const btnReserver = document.getElementById('btn-reserver');
  if (btnReserver) {
    btnReserver.addEventListener('click', () =>
      ouvrirModalReservation(btnReserver.dataset.id, btnReserver.dataset.mode));
  }
  const btnSauver = document.getElementById('btn-sauver');
  if (btnSauver) {
    btnSauver.addEventListener('click', () => sauvegarderBien(btnSauver.dataset.id));
  }
  const btnSignaler = document.getElementById('btn-signaler');
  if (btnSignaler) {
    btnSignaler.addEventListener('click', () => ouvrirModalSignalement(btnSignaler.dataset.id));
  }
}

// Fonctions interactives
function contacterAgence(nom, phone, bienId, mode) {
  if (!leadAutorise(bienId)) {
    ouvrirModalReservation(bienId, mode);
    return;
  }
  if (!phone || phone === '+242 05 123 4567') {
    showToast(`📞 Contactez ${nom} via WhatsApp avec votre référence ImmoCG`);
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

// ========== SYSTÈME DE RÉSERVATION ==========

function ouvrirModalReservation(bienId, mode) {
  // Supprimer modal existant si présent
  const existant = document.getElementById('modal-reservation');
  if (existant) existant.remove();

  const estParJour = mode === 'jour';

  const modal = document.createElement('div');
  modal.id = 'modal-reservation';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);
    display:flex;align-items:center;justify-content:center;padding:1rem;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background:#fff;border-radius:16px;padding:2rem;max-width:500px;width:100%;
    max-height:90vh;overflow-y:auto;position:relative;
  `;

  box.innerHTML = DOMPurify.sanitize(`
    <button id="modal-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:22px;cursor:pointer;color:#888;">✕</button>
    <h2 style="font-size:20px;font-weight:700;color:#1A1A18;margin-bottom:0.3rem;">
      ${estParJour ? '📅 Réserver ce logement' : '🏠 Demander une visite'}
    </h2>
    <p style="color:#888780;font-size:13px;margin-bottom:1.5rem;">
      Remplissez ce formulaire — l'agence vous contactera sous 24h
    </p>

    <!-- CLAUSES -->
    <div style="background:#fffdf5;border:1px solid #f0d98a;border-radius:10px;padding:1rem;margin-bottom:1.5rem;font-size:12px;line-height:1.8;color:#7A5A1A;">
      <strong>📋 Clauses à respecter par les deux parties :</strong><br>
      ⏱️ <strong>Client :</strong> 48h max pour confirmer votre présence après validation<br>
      ⏱️ <strong>Agence :</strong> 24h max pour valider ou refuser votre demande<br>
      ✅ <strong>Correspondance :</strong> Si le bien ne correspond pas aux critères annoncés, annulation sans frais<br>
      ⚠️ Passé ces délais, le bien sera automatiquement remis en disponibilité
    </div>

    <!-- FORMULAIRE -->
    <div style="display:flex;flex-direction:column;gap:0.8rem;">
      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;">Votre nom complet *</label>
        <input id="res-nom" type="text" placeholder="Ex: Jean Moukala" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;">Téléphone / WhatsApp *</label>
        <input id="res-tel" type="tel" placeholder="+242 06 XXX XXXX" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;">Email (optionnel)</label>
        <input id="res-email" type="email" placeholder="votre@email.com" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
      </div>
      ${estParJour ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
        <div>
          <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;">Date d'arrivée *</label>
          <input id="res-arrivee" type="date" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;">Date de départ *</label>
          <input id="res-depart" type="date" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
        </div>
      </div>` : `
      <div>
        <label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;">Date souhaitée pour la visite</label>
        <input id="res-date" type="date" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
      </div>`}

      <!-- CRITÈRES CLIENT -->
      <div style="background:#f8f8f8;border-radius:8px;padding:0.8rem;margin-top:0.3rem;">
        <p style="font-size:12px;font-weight:600;color:#555;margin-bottom:0.6rem;">🎯 Vos critères (pour garantir la correspondance du bien)</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;">
          <div>
            <label style="font-size:11px;color:#888;display:block;margin-bottom:3px;">Surface min. (m²)</label>
            <input id="res-surface" type="number" placeholder="Ex: 50" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
          </div>
          <div>
            <label style="font-size:11px;color:#888;display:block;margin-bottom:3px;">Chambres min.</label>
            <input id="res-chambres" type="number" placeholder="Ex: 2" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
          </div>
        </div>
        <div style="margin-top:0.6rem;">
          <label style="font-size:11px;color:#888;display:block;margin-bottom:3px;">Notes / équipements souhaités</label>
          <textarea id="res-notes" placeholder="Ex: Je veux que le bien soit meublé, avec parking..." rows="2" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;resize:none;"></textarea>
        </div>
      </div>

      <div id="res-erreur" style="color:#c0392b;font-size:13px;display:none;padding:8px;background:#fdf0f0;border-radius:6px;"></div>

      <button id="res-soumettre" style="background:#C9963A;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;margin-top:0.3rem;">
        ${estParJour ? '📅 Confirmer la réservation' : '🏠 Envoyer ma demande de visite'}
      </button>
      <p style="font-size:11px;color:#aaa;text-align:center;">En soumettant, vous acceptez les clauses ci-dessus</p>
    </div>
  `);

  modal.appendChild(box);
  document.body.appendChild(modal);

  // Fermer le modal
  document.getElementById('modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Dates minimum = aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = ['res-arrivee', 'res-depart', 'res-date'].map(id => document.getElementById(id)).filter(Boolean);
  dateInputs.forEach(input => input.min = today);

  // Soumettre la réservation
  document.getElementById('res-soumettre').addEventListener('click', async () => {
    const nom = document.getElementById('res-nom').value.trim();
    const tel = document.getElementById('res-tel').value.trim();
    const email = document.getElementById('res-email')?.value.trim() || '';
    const erreurEl = document.getElementById('res-erreur');
    const btn = document.getElementById('res-soumettre');

    if (!nom || nom.length < 2) {
      erreurEl.textContent = 'Veuillez entrer votre nom complet';
      erreurEl.style.display = 'block';
      return;
    }
    if (!tel || tel.length < 8) {
      erreurEl.textContent = 'Veuillez entrer un numéro de téléphone valide';
      erreurEl.style.display = 'block';
      return;
    }

    erreurEl.style.display = 'none';
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    const payload = {
      bien_id: bienId,
      client_nom: nom,
      client_tel: tel,
      client_email: email,
      type_reservation: estParJour ? 'location_jour' : 'visite',
      criteres_client: {
        surface_min: parseInt(document.getElementById('res-surface')?.value) || null,
        chambres_min: parseInt(document.getElementById('res-chambres')?.value) || null,
        notes: document.getElementById('res-notes')?.value.trim() || null
      }
    };

    if (estParJour) {
      payload.date_souhaitee = document.getElementById('res-arrivee')?.value || null;
      payload.date_depart = document.getElementById('res-depart')?.value || null;
    } else {
      payload.date_souhaitee = document.getElementById('res-date')?.value || null;
    }

    try {
      const r = await fetch('/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json();

      if (data.success) {
        const ref = data.reservation.reference_immocg || `IMC-${String(data.reservation.id).substring(0, 8).toUpperCase()}`
        enregistrerLead(bienId, data.reservation.id, ref)

        const msgWA = encodeURIComponent(`Bonjour, je suis ${nom} (${tel}). Demande ImmoCG Ref: ${ref}. Merci de confirmer.`);
        
        // Construire la page de succès avec createElement (pas d'innerHTML)
        box.textContent = '';
        const successDiv = document.createElement('div');
        successDiv.style.cssText = 'text-align:center;padding:2rem 1rem;';

        const emoji = document.createElement('div');
        emoji.style.cssText = 'font-size:48px;margin-bottom:1rem;';
        emoji.textContent = '✅';

        const titreH2 = document.createElement('h2');
        titreH2.style.cssText = 'font-size:20px;font-weight:700;color:#1A1A18;margin-bottom:0.5rem;';
        titreH2.textContent = 'Demande envoyée !';

        const para = document.createElement('p');
        para.style.cssText = 'color:#555;line-height:1.6;margin-bottom:1rem;';
        para.appendChild(document.createTextNode("L'agence a "));
        const strongDelai = document.createElement('strong'); strongDelai.textContent = '24h'; para.appendChild(strongDelai);
        para.appendChild(document.createTextNode(' pour valider votre demande.'));
        para.appendChild(document.createElement('br'));
        para.appendChild(document.createTextNode('Votre référence ImmoCG : '));
        const strongRef = document.createElement('strong'); strongRef.textContent = ref; para.appendChild(strongRef);

        const clauses = document.createElement('div');
        clauses.style.cssText = 'background:#fffdf5;border-radius:10px;padding:1rem;font-size:12px;color:#7A5A1A;line-height:1.8;text-align:left;margin-bottom:1rem;';
        const titreClauses = document.createElement('strong'); titreClauses.textContent = '📋 Rappel des clauses :';
        clauses.appendChild(titreClauses);
        ;[
          '⏱️ L\'agence a 24h pour vous répondre',
          '⏱️ Vous avez 48h pour confirmer votre présence',
          '✅ Si le bien ne correspond pas aux critères, annulation sans frais'
        ].forEach(ligne => {
          clauses.appendChild(document.createElement('br'))
          clauses.appendChild(document.createTextNode(ligne))
        });

        const paraWA = document.createElement('p');
        paraWA.style.cssText = 'font-size:13px;color:#555;margin-bottom:1rem;';
        paraWA.textContent = 'Vous pouvez aussi contacter l\'agence directement :';

        const waDiv = document.createElement('div');
        waDiv.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem;';
        const waNum = (bienContactWhatsapp || bienContactTel || '').replace(/[^0-9]/g, '') || '242068834146';
        const waLink = document.createElement('a');
        waLink.href = `https://wa.me/${waNum}?text=${msgWA}`;
        waLink.target = '_blank';
        waLink.rel = 'noopener noreferrer';
        waLink.style.cssText = 'background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;';
        waLink.textContent = waNum === '242068834146' ? '💬 WhatsApp ImmoCG' : '💬 WhatsApp agence';
        waDiv.appendChild(waLink);

        const btnFermer = document.createElement('button');
        btnFermer.style.cssText = 'background:#C9963A;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-weight:600;cursor:pointer;font-size:15px;';
        btnFermer.textContent = 'Fermer';
        btnFermer.addEventListener('click', () => { modal.remove(); location.reload(); });

        successDiv.appendChild(emoji);
        successDiv.appendChild(titreH2);
        successDiv.appendChild(para);
        successDiv.appendChild(clauses);
        successDiv.appendChild(paraWA);
        successDiv.appendChild(waDiv);
        successDiv.appendChild(btnFermer);
        box.appendChild(successDiv);
      } else {
        erreurEl.textContent = data.message || 'Erreur lors de l\'envoi';
        erreurEl.style.display = 'block';
        btn.textContent = estParJour ? '📅 Confirmer la réservation' : '🏠 Envoyer ma demande de visite';
        btn.disabled = false;
      }
    } catch {
      erreurEl.textContent = 'Erreur de connexion. Réessayez.';
      erreurEl.style.display = 'block';
      btn.textContent = estParJour ? '📅 Confirmer la réservation' : '🏠 Envoyer ma demande de visite';
      btn.disabled = false;
    }
  });
}

// ========== SIGNALEMENT ==========
function ouvrirModalSignalement(bienId) {
  const existant = document.getElementById('modal-signalement');
  if (existant) existant.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-signalement';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:1rem;';

  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:16px;padding:2rem;max-width:420px;width:100%;position:relative;';
  box.innerHTML = DOMPurify.sanitize(`
    <button id="sig-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:22px;cursor:pointer;color:#888;">✕</button>
    <h2 style="font-size:18px;font-weight:700;margin-bottom:0.5rem;">⚠️ Signaler une erreur</h2>
    <p style="font-size:13px;color:#888;margin-bottom:1.2rem;">Aidez-nous à maintenir la qualité des annonces</p>
    <div style="display:flex;flex-direction:column;gap:0.7rem;">
      <label style="font-size:13px;font-weight:600;color:#555;">Type d'erreur *</label>
      <select id="sig-type" style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;">
        <option value="bien_indisponible">🔴 Ce bien n'est plus disponible</option>
        <option value="prix_errone">💰 Le prix affiché est incorrect</option>
        <option value="photos_fausses">📷 Les photos ne correspondent pas</option>
        <option value="coordonnees_incorrectes">📞 Les coordonnées sont incorrectes</option>
        <option value="autre">Autre problème</option>
      </select>
      <label style="font-size:13px;font-weight:600;color:#555;">Détails (optionnel)</label>
      <textarea id="sig-desc" rows="3" placeholder="Décrivez le problème..." style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:none;"></textarea>
      <div id="sig-erreur" style="color:#c0392b;font-size:13px;display:none;"></div>
      <button id="sig-soumettre" style="background:#C9963A;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:700;cursor:pointer;">Envoyer le signalement</button>
    </div>
  `);
  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById('sig-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  document.getElementById('sig-soumettre').addEventListener('click', async () => {
    const type = document.getElementById('sig-type').value;
    const desc = document.getElementById('sig-desc').value.trim();
    const btn = document.getElementById('sig-soumettre');
    btn.textContent = 'Envoi...';
    btn.disabled = true;
    try {
      const r = await fetch('/signalements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bien_id: bienId, type_signalement: type, description: desc })
      });
      const data = await r.json();
      if (data.success) {
        box.innerHTML = DOMPurify.sanitize(`
          <div style="text-align:center;padding:1.5rem;">
            <div style="font-size:40px;margin-bottom:1rem;">✅</div>
            <h3 style="font-weight:700;margin-bottom:0.5rem;">Merci pour votre signalement</h3>
            <p style="color:#555;font-size:14px;margin-bottom:1.5rem;">Notre équipe examinera ce bien dans les 24h.</p>
            <button onclick="document.getElementById('modal-signalement').remove()" style="background:#C9963A;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-weight:600;cursor:pointer;">Fermer</button>
          </div>
        `);
      } else {
        document.getElementById('sig-erreur').textContent = data.message;
        document.getElementById('sig-erreur').style.display = 'block';
        btn.textContent = 'Envoyer le signalement';
        btn.disabled = false;
      }
    } catch {
      document.getElementById('sig-erreur').textContent = 'Erreur de connexion';
      document.getElementById('sig-erreur').style.display = 'block';
      btn.textContent = 'Envoyer le signalement';
      btn.disabled = false;
    }
  });
}