const CONTACT_FIELDS = [
  'contact_nom',
  'contact_tel',
  'contact_whatsapp',
  'contact_email',
]

function sanitizeBienPublic(bien) {
  if (!bien) return bien
  const publicBien = { ...bien }
  for (const field of CONTACT_FIELDS) {
    delete publicBien[field]
  }
  return publicBien
}

function sanitizeBiensPublic(biens) {
  return (biens || []).map(sanitizeBienPublic)
}

module.exports = { sanitizeBienPublic, sanitizeBiensPublic, CONTACT_FIELDS }
