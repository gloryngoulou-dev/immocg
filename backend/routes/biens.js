const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const { verifierToken } = require('./auth')
const { sanitizeBiensPublic } = require('../utils/biens')
const Joi = require('joi')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ========== SCHÉMAS DE VALIDATION ==========

const queryParamsSchema = Joi.object({
  quartier: Joi.string().max(100).optional(),
  type: Joi.string().valid('appartement', 'maison', 'terrain', 'local', 'bureau').optional(),
  mode: Joi.string().valid('vente', 'location', 'viager', 'jour').optional(),
  admin: Joi.boolean().optional()
})

const idParamSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.number().integer().positive()
  ).required()
})

const bienCreationSchema = Joi.object({
  type: Joi.string().valid('appartement', 'maison', 'terrain', 'local', 'bureau').required(),
  quartier: Joi.string().max(100).required(),
  ville: Joi.string().max(100).required(),
  prix: Joi.number().positive().required(),
  unite: Joi.string().valid('FCFA', 'EUR', 'USD').default('FCFA'),
  mode: Joi.string().valid('vente', 'location', 'viager', 'jour').required(),
  prix_jour: Joi.number().positive().optional(), // Prix par nuit pour location/jour
  duree_min_jours: Joi.number().integer().min(1).max(30).default(1), // Durée min en jours
  chambres: Joi.number().integer().min(0).max(20).optional(),
  salles_bain: Joi.number().integer().min(0).max(20).optional(),
  surface: Joi.number().positive().optional(),
  surface_terrain: Joi.number().positive().optional(),
  description: Joi.string().max(5000).optional(),
  titre: Joi.string().max(200).required(),
  adresse: Joi.string().max(300).optional(),
  etat: Joi.string().valid('neuf', 'très bon', 'bon', 'à rénover').optional(),
  meuble: Joi.boolean().optional(),
  etage: Joi.string().max(50).optional(),
  parking: Joi.boolean().optional(),
  contact_nom: Joi.string().max(100).required(),
  contact_tel: Joi.string().pattern(/^[0-9+\-\s]{10,20}$/).required(),
  contact_whatsapp: Joi.string().pattern(/^[0-9+\-\s]{10,20}$/).optional(),
  contact_email: Joi.string().email().max(255).optional(),
  image_url: Joi.string().uri().optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  video_url: Joi.string().uri().optional(),
  equipements: Joi.array().items(Joi.string()).optional()
})

const statutUpdateSchema = Joi.object({
  statut: Joi.string().valid('disponible', 'vendu', 'loué', 'attente').required()
})

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }
  next()
}

// ========== ROUTES ==========

router.get('/', async (req, res) => {
  // Validation des paramètres de requête
  const { error, value } = queryParamsSchema.validate(req.query)
  if (error) {
    return res.status(400).json({ success: false, message: 'Paramètres invalides' })
  }

  const { quartier, type, mode, admin } = value
  const isAdmin = admin === true

  try {
    let query = supabase.from('biens').select('*').order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('statut', 'disponible')
    }

    if (quartier) {
      const searchTerm = `%${quartier.replace(/[%_]/g, '\\$&')}%`
      query = query.or(`quartier.ilike.${searchTerm},titre.ilike.${searchTerm},description.ilike.${searchTerm}`)
    }
    if (type) query = query.eq('type', type)
    if (mode) query = query.eq('mode', mode)

    const { data, error: dbError } = await query
    if (dbError) throw dbError

    const biens = isAdmin ? data : sanitizeBiensPublic(data)
    res.json({ success: true, total: biens.length, biens })
  } catch (err) {
    console.error('Erreur chargement biens')
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

router.get('/mine', verifierToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('biens')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, total: data.length, biens: data })
  } catch (err) {
    console.error('Erreur chargement biens utilisateur')
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

router.get('/:id', async (req, res) => {
  // Validation de l'ID
  const { error: idError } = idParamSchema.validate({ id: req.params.id })
  if (idError) {
    return res.status(400).json({ success: false, message: 'ID invalide' })
  }

  try {
    const { data, error } = await supabase
      .from('biens')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Bien non trouvé' })
    }

    if (data.statut !== 'disponible') {
      return res.status(404).json({ success: false, message: 'Bien non disponible' })
    }

    res.json({ success: true, bien: data })
  } catch (err) {
    console.error('Erreur chargement bien')
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

router.post('/', verifierToken, async (req, res) => {
  // Validation des données du bien
  const { error, value } = bienCreationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      details: error.details[0].message 
    })
  }

  try {
    const { data, error: insertError } = await supabase
      .from('biens')
      .insert([{
        ...value,
        user_id: req.user.id,
        statut: 'attente',
      }])
      .select()

    if (insertError) throw insertError

    res.json({ success: true, bien: data[0] })
  } catch (err) {
    console.error('Erreur création bien')
    res.status(500).json({ success: false, message: 'Erreur lors de la création' })
  }
})

router.delete('/:id', verifierToken, requireAdmin, async (req, res) => {
  // Validation de l'ID
  const { error: idError } = idParamSchema.validate({ id: req.params.id })
  if (idError) {
    return res.status(400).json({ success: false, message: 'ID invalide' })
  }

  try {
    const { error } = await supabase
      .from('biens')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Bien supprimé' })
  } catch (err) {
    console.error('Erreur suppression bien')
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

router.patch('/:id/statut', verifierToken, requireAdmin, async (req, res) => {
  // Validation de l'ID
  const { error: idError } = idParamSchema.validate({ id: req.params.id })
  if (idError) {
    return res.status(400).json({ success: false, message: 'ID invalide' })
  }

  // Validation du statut
  const { error, value } = statutUpdateSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ success: false, message: 'Statut invalide' })
  }

  try {
    const { error: updateError } = await supabase
      .from('biens')
      .update({ statut: value.statut })
      .eq('id', req.params.id)

    if (updateError) throw updateError
    res.json({ success: true })
  } catch (err) {
    console.error('Erreur mise à jour statut')
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

module.exports = router