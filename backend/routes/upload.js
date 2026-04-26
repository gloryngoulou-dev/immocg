const express = require('express')
const router = express.Router()
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Multer garde le fichier en mémoire
const upload = multer({ storage: multer.memoryStorage() })

// Route POST /upload — envoie l'image vers Supabase Storage
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucun fichier reçu' })
  }

  const fichier = req.file
  const nom = `${Date.now()}-${fichier.originalname}`

  const { error } = await supabase.storage
    .from('images')
    .upload(nom, fichier.buffer, {
      contentType: fichier.mimetype
    })

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(nom)

  res.json({ success: true, url: data.publicUrl })
})

module.exports = router