const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const Joi = require('joi')
const { verifierToken } = require('../middleware/auth')
const logger = require('../utils/logger')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const avisSchema = Joi.object({
  reservation_id: Joi.string().uuid().required(),
  note: Joi.number().integer().min(1).max(5).required(),
  commentaire: Joi.string().max(800).optional().allow('')
})

// GET /avis — avis publiés (page d'accueil)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('avis')
      .select('*')
      .eq('statut', 'publie')
      .order('publie_at', { ascending: false })
      .limit(9)

    if (error) throw error
    res.json({ success: true, avis: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /avis/verifier/:reservationId — vérifier si l'avis est possible (page publique)
router.get('/verifier/:reservationId', async (req, res) => {
  try {
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, client_nom, resultat_visite, bien_id')
      .eq('id', req.params.reservationId)
      .maybeSingle()

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' })
    }
    if (reservation.resultat_visite !== 'pris') {
      return res.status(400).json({ success: false, message: 'Cette réservation n\'est pas éligible pour un avis' })
    }

    const { data: avisExistant } = await supabase
      .from('avis')
      .select('id')
      .eq('reservation_id', req.params.reservationId)
      .maybeSingle()

    if (avisExistant) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà laissé un avis pour cette réservation' })
    }

    res.json({ success: true, client_nom: reservation.client_nom })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// POST /avis — soumettre un avis (public, lié à une réservation clôturée 'pris')
router.post('/', async (req, res) => {
  const { error, value } = avisSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message })
  }

  try {
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, client_nom, client_tel, resultat_visite, bien_id')
      .eq('id', value.reservation_id)
      .maybeSingle()

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' })
    }
    if (reservation.resultat_visite !== 'pris') {
      return res.status(400).json({ success: false, message: 'Cette réservation n\'est pas éligible pour un avis' })
    }

    const { data: avis, error: insertError } = await supabase
      .from('avis')
      .insert([{
        reservation_id: value.reservation_id,
        bien_id: reservation.bien_id,
        client_nom: reservation.client_nom,
        client_tel: reservation.client_tel,
        note: value.note,
        commentaire: value.commentaire || '',
        statut: 'en_attente'
      }])
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(400).json({ success: false, message: 'Vous avez déjà laissé un avis pour cette réservation' })
      }
      throw insertError
    }

    res.json({ success: true, message: 'Merci pour votre avis ! Il sera publié après vérification.' })
  } catch (err) {
    logger.error('Erreur création avis', { error: err.message })
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /avis/admin — tous les avis (modération admin)
router.get('/admin', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès refusé' })
  try {
    const { data, error } = await supabase
      .from('avis')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, avis: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// PATCH /avis/:id — publier ou rejeter (admin)
router.patch('/:id', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès refusé' })

  const { statut } = req.body
  if (!['publie', 'rejete'].includes(statut)) {
    return res.status(400).json({ success: false, message: 'Statut invalide' })
  }

  try {
    const { error } = await supabase
      .from('avis')
      .update({
        statut,
        publie_at: statut === 'publie' ? new Date().toISOString() : null
      })
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: `Avis ${statut === 'publie' ? 'publié' : 'rejeté'}` })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

module.exports = router