const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const Joi = require('joi')
const { verifierToken } = require('./auth')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const signalementSchema = Joi.object({
  bien_id: Joi.string().required(),
  type_signalement: Joi.string().valid(
    'prix_errone', 'bien_indisponible', 'photos_fausses',
    'coordonnees_incorrectes', 'autre'
  ).required(),
  description: Joi.string().max(500).optional().allow('')
})

// POST /signalements — créer un signalement (public)
router.post('/', async (req, res) => {
  const { error, value } = signalementSchema.validate(req.body)
  if (error) return res.status(400).json({ success: false, message: error.details[0].message })

  try {
    // Incrémenter nb_signalements sur le bien
    await supabase.rpc('incrementer_signalements', { bien_id_param: value.bien_id })

    const { error: insertError } = await supabase
      .from('signalements')
      .insert([{ ...value, signale_par_ip: req.ip }])

    if (insertError) throw insertError
    res.json({ success: true, message: 'Signalement enregistré. Merci pour votre retour.' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /signalements — tous les signalements (admin)
router.get('/', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès refusé' })
  try {
    const { data, error } = await supabase
      .from('signalements')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, signalements: data || [] })
  } catch {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// PATCH /signalements/:id/traiter — marquer traité (admin)
router.patch('/:id/traiter', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès refusé' })
  try {
    await supabase.from('signalements').update({ traite: true }).eq('id', req.params.id)
    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

module.exports = router