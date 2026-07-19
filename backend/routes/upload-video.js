const express = require('express')
const router = express.Router()
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')
const { verifierToken } = require('../middleware/auth')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
})

router.post('/', verifierToken, upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucun fichier reçu' })
  }

  const fichier = req.file
  const nom = `${Date.now()}-${fichier.originalname}`

  const { error } = await supabase.storage
    .from('videos')
    .upload(nom, fichier.buffer, {
      contentType: fichier.mimetype
    })

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(nom)

  res.json({ success: true, url: data.publicUrl })
})

module.exports = router