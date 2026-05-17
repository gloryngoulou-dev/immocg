const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const { verifierToken } = require('./auth')
const { sanitizeBiensPublic } = require('../utils/biens')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }
  next()
}

async function loadBiens(req, res, admin) {
  let query = supabase.from('biens').select('*').order('created_at', { ascending: false })
  if (!admin) {
    query = query.eq('statut', 'disponible').eq('ville', 'Brazzaville')
    const { quartier, type, mode } = req.query
    if (quartier?.trim()) {
      const t = quartier.trim()
      query = query.or(`quartier.ilike.%${t}%,titre.ilike.%${t}%,description.ilike.%${t}%`)
    }
    if (type?.trim()) query = query.eq('type', type.trim())
    if (mode?.trim()) query = query.eq('mode', mode.trim())
  }
  const { data, error } = await query
  if (error) return res.status(500).json({ success: false, message: error.message })
  const biens = admin ? data : sanitizeBiensPublic(data)
  res.json({ success: true, total: biens.length, biens })
}

router.get('/', async (req, res) => {
  const admin = req.query.admin === 'true'

  if (admin) {
    return verifierToken(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès refusé' })
      }
      return loadBiens(req, res, true)
    })
  }

  return loadBiens(req, res, false)
})

router.get('/mine', verifierToken, async (req, res) => {
  const { data, error } = await supabase
    .from('biens')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, total: data.length, biens: data })
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('biens')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ success: false, message: 'Bien non trouvé' })
  if (data.statut !== 'disponible') {
    return res.status(404).json({ success: false, message: 'Bien non disponible' })
  }
  res.json({ success: true, bien: data })
})

router.post('/', verifierToken, async (req, res) => {
  const { type, quartier, ville, prix, unite, mode, chambres, salles_bain, surface, surface_terrain, description, titre, adresse, etat, meuble, etage, parking, contact_nom, contact_tel, contact_whatsapp, contact_email, image_url, images, video_url, equipements } = req.body
  const { data, error } = await supabase
    .from('biens')
    .insert([{
      type, quartier, ville, prix, unite, mode, chambres, salles_bain, surface, surface_terrain,
      description, titre, adresse, etat, meuble, etage, parking,
      contact_nom, contact_tel, contact_whatsapp, contact_email,
      image_url, images, video_url, equipements,
      user_id: req.user.id,
      statut: 'attente',
    }])
    .select()
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, bien: data[0] })
})

router.delete('/:id', verifierToken, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('biens')
    .delete()
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, message: 'Bien supprimé' })
})

router.patch('/:id/statut', verifierToken, requireAdmin, async (req, res) => {
  const { statut } = req.body
  const { error } = await supabase
    .from('biens')
    .update({ statut })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true })
})

module.exports = router
