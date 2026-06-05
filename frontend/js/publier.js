const photosAUploader = [] // tableau global
const files = new Array(5).fill(null)

const grid = document.getElementById('photos-grid')

for (let i = 0; i < 5; i++) {
  const slot = document.createElement('div')
  slot.className = 'photo-slot'
  slot.id = `slot-${i}`

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.addEventListener('change', function() { selectPhoto(this, i) })

  const icon = document.createElement('span')
  icon.className = 'slot-icon'
  icon.textContent = i === 0 ? '📷' : '+'

  const img = document.createElement('img')
  img.id = `img-${i}`
  img.alt = ''

  const btn = document.createElement('button')
  btn.className = 'remove-photo'
  btn.type = 'button'
  btn.textContent = '✕'
  btn.addEventListener('click', function(e) { removePhoto(e, i) })

  slot.appendChild(input)
  slot.appendChild(icon)
  slot.appendChild(img)
  slot.appendChild(btn)
  grid.appendChild(slot)
}

function selectPhoto(input, index) {
  const file = input.files[0]
  if (!file) return
  files[index] = file
  const img = document.getElementById(`img-${index}`)
  img.src = URL.createObjectURL(file)
  document.getElementById(`slot-${index}`).classList.add('has-photo')
  console.log('Photo sélectionnée slot', index, file.name)
}

function removePhoto(e, index) {
  e.preventDefault()
  e.stopPropagation()
  files[index] = null
  document.getElementById(`img-${index}`).src = ''
  document.getElementById(`slot-${index}`).classList.remove('has-photo')
}

async function uploaderPhoto(file) {
  const formData = new FormData()
  formData.append('image', file)
  const token = localStorage.getItem('immocg_token')
  const r = await fetch('/upload', {
    method: 'POST',
    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    body: formData
  })
  const d = await r.json()
  return d.success ? d.url : null
}

function setProgress(p) {
  document.getElementById('progress-bar').style.display = 'block'
  document.getElementById('progress-fill').style.width = p + '%'
}

async function publierBien() {
  const btn = document.getElementById('submit-btn')

  if (!document.getElementById('prix').value) return afficherMessage('Le prix est obligatoire.', 'error')
  if (!document.getElementById('description').value) return afficherMessage('La description est obligatoire.', 'error')
  if (!document.getElementById('contact_tel').value) return afficherMessage('Le téléphone est obligatoire.', 'error')

  btn.disabled = true
  btn.textContent = 'Publication en cours...'

  try {
    const photosSelectionnees = files.filter(f => f !== null)
    console.log('Nombre de photos à uploader:', photosSelectionnees.length)

    const urls = []
    for (let i = 0; i < photosSelectionnees.length; i++) {
      setProgress(Math.round((i / photosSelectionnees.length) * 60))
      const url = await uploaderPhoto(photosSelectionnees[i])
      console.log('URL uploadée:', url)
      if (url) urls.push(url)
    }

    setProgress(70)
    console.log('Toutes les URLs:', urls)

    const equipements = [...document.querySelectorAll('.equip-item input:checked')].map(e => e.value)

    const bien = {
  type: document.getElementById('type').value,
  mode: document.getElementById('mode').value,
  prix: parseInt(document.getElementById('prix').value),
  unite: document.getElementById('unite').value,
  quartier: document.getElementById('quartier').value,
  ville: document.getElementById('ville').value,
  titre: document.getElementById('titre').value,
  adresse: document.getElementById('adresse').value,
  chambres: parseInt(document.getElementById('chambres').value) || 0,
  salles_bain: parseInt(document.getElementById('salles_bain').value) || 0,
  surface: parseInt(document.getElementById('surface').value) || 0,
  surface_terrain: parseInt(document.getElementById('surface_terrain').value) || 0,
  etat: document.getElementById('etat').value,
  meuble: document.getElementById('meuble').value,
  etage: document.getElementById('etage').value,
  parking: document.getElementById('parking').value,
  contact_nom: document.getElementById('contact_nom').value,
  contact_tel: document.getElementById('contact_tel').value,
  contact_whatsapp: document.getElementById('contact_whatsapp').value,
  contact_email: document.getElementById('contact_email').value,
  description: document.getElementById('description').value,
  image_url: urls[0] || null,
  user_id: JSON.parse(localStorage.getItem('immocg_user') || 'null')?.id || null,
  images: urls,
  equipements: equipements,
  video_url: await uploaderVideo()
}

    setProgress(85)

    const token = localStorage.getItem('immocg_token')
    const r = await fetch('/biens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify(bien)
    })
    const data = await r.json()
    setProgress(100)

    if (data.success) {
      afficherMessage('✅ Annonce publiée avec succès ! Redirection...', 'success')
      setTimeout(() => { window.location.href = 'index.html' }, 9000)
    } else {
      afficherMessage('Erreur : ' + data.message, 'error')
      btn.disabled = false
      btn.textContent = 'Publier mon annonce'
    }
  } catch (err) {
    console.error('Erreur:', err)
    afficherMessage('Erreur de connexion au serveur.', 'error')
    btn.disabled = false
    btn.textContent = 'Publier mon annonce'
  }
}

function afficherMessage(msg, type) {
  const el = document.getElementById('message')
  el.textContent = msg
  el.className = 'message ' + type
}

function verifierVideo(input) {
  const file = input.files[0]
  if (!file) return
  
  const maxSize = 50 * 1024 * 1024 // 50MB
  const errEl = document.getElementById('video-error')
  
  if (file.size > maxSize) {
    errEl.textContent = `⚠️ Vidéo trop lourde (${(file.size/1024/1024).toFixed(1)}MB). Maximum 50MB. Utilisez plutôt un lien YouTube.`
    errEl.style.display = 'block'
    input.value = ''
    return
  }
  
  errEl.style.display = 'none'
  const preview = document.getElementById('video-preview')
  preview.src = URL.createObjectURL(file)
  preview.style.display = 'block'
  document.getElementById('video_url').value = ''
}

async function uploaderVideo() {
  const input = document.getElementById('video')
  if (!input.files[0]) return document.getElementById('video_url').value || null

  const formData = new FormData()
  formData.append('video', input.files[0])

  const token = localStorage.getItem('immocg_token')
  const r = await fetch('/upload-video', {
    method: 'POST',
    headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    body: formData
  })
  const d = await r.json()
  return d.success ? d.url : null
}

window.publierBien = publierBien
window.selectPhoto = selectPhoto
window.removePhoto = removePhoto