const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

router.get('/', async (req, res) => {
  const admin = req.query.admin === 'true'
  let query = supabase.from('biens').select('*').order('created_at', { ascending: false })
  if (!admin) query = query.eq('statut', 'disponible')
  const { data, error } = await query
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
  res.json({ success: true, bien: data })
})

router.post('/', async (req, res) => {
  const { type, quartier, ville, prix, unite, mode, chambres, salles_bain, surface, surface_terrain, description, titre, adresse, etat, meuble, etage, parking, contact_nom, contact_tel, contact_whatsapp, contact_email, image_url, images, video_url, equipements, user_id } = req.body
  const { data, error } = await supabase
    .from('biens')
    .insert([{ type, quartier, ville, prix, unite, mode, chambres, salles_bain, surface, surface_terrain, description, titre, adresse, etat, meuble, etage, parking, contact_nom, contact_tel, contact_whatsapp, contact_email, image_url, images, video_url, equipements, user_id, statut: 'attente' }])
    .select()
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, bien: data[0] })
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('biens')
    .delete()
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, message: 'Bien supprimé' })
})

router.patch('/:id/statut', async (req, res) => {
  const { statut } = req.body
  const { error } = await supabase
    .from('biens')
    .update({ statut })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true })
})

module.exports = router