const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const Joi = require('joi')
const { verifierToken } = require('../middleware/auth')
const logger = require('../utils/logger')
const { buildReferenceImmocg } = require('../utils/commissions')
const { envoyerEmailReservation, envoyerEmailInvitationAvis } = require('./email')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// ========== SCHÉMAS ==========

const reservationSchema = Joi.object({
  bien_id: Joi.string().required(),
  client_nom: Joi.string().min(2).max(100).required(),
  client_tel: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/).required(),
  client_email: Joi.string().email().max(255).optional().allow(''),
  type_reservation: Joi.string().valid('visite', 'location_jour', 'achat').default('visite'),
  date_souhaitee: Joi.date().min('now').optional(),
  date_depart: Joi.date().optional(),
  nb_nuits: Joi.number().integer().min(1).optional(),
  criteres_client: Joi.object({
    surface_min: Joi.number().optional(),
    chambres_min: Joi.number().optional(),
    budget_max: Joi.number().optional(),
    equipements: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().max(500).optional()
  }).optional(),
  message: Joi.string().max(1000).optional().allow('')
})

const updateReservationSchema = Joi.object({
  statut: Joi.string().valid('confirmee', 'annulee').required(),
  paiement: Joi.object({
    mode: Joi.string().min(2).max(80).required(),
    montant_fcfa: Joi.number().integer().min(0).required(),
    reference: Joi.string().max(120).optional().allow(''),
    details: Joi.string().max(500).optional().allow(''),
    telephone: Joi.string().max(30).optional().allow(''),
  }).optional(),
})

// ========== ROUTES ==========

// POST /reservations — créer une réservation
router.post('/', async (req, res) => {
  const { error, value } = reservationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: error.details[0].message
    })
  }

  try {
    // Vérifier que le bien existe et est disponible
    const { data: bien, error: bienError } = await supabase
      .from('biens')
      .select('id, titre, statut, mode, contact_nom, contact_tel')
      .eq('id', value.bien_id)
      .maybeSingle()

    if (bienError || !bien) {
      return res.status(404).json({ success: false, message: 'Bien introuvable' })
    }

    if (bien.statut !== 'disponible') {
      return res.status(400).json({ success: false, message: 'Ce bien n\'est plus disponible' })
    }

    // Vérifier qu'il n'y a pas déjà une réservation active sur ce bien
    const { data: existante } = await supabase
      .from('reservations')
      .select('id')
      .eq('bien_id', value.bien_id)
      .eq('statut', 'confirmee')
      .maybeSingle()

    if (existante) {
      return res.status(400).json({ success: false, message: 'Ce bien est déjà réservé' })
    }

    // Créer la réservation avec expiration 48h
    const expireAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert([{
        ...value,
        criteres_client: value.criteres_client || {},
        statut: 'en_attente',
        expire_at: expireAt
      }])
      .select()
      .single()

    if (insertError) throw insertError

    res.json({
      success: true,
      message: 'Réservation créée avec succès',
      reservation: {
        id: reservation.id,
        reference_immocg: buildReferenceImmocg(reservation.id),
        statut: reservation.statut,
        expire_at: reservation.expire_at,
        clauses: {
          delai_client: '48h pour confirmer votre présence',
          delai_agence: '24h pour valider votre demande',
          correspondance: 'Si le bien ne correspond pas aux critères annoncés, annulation sans frais'
        }
      }
    })
  } catch (err) {
    logger.error('Erreur création réservation', { error: err.message })
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /reservations/admin — toutes les réservations (admin uniquement)
router.get('/admin', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, reservations: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /reservations/bien/:id — réservations d'un bien (pour l'agence)
router.get('/bien/:id', verifierToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('bien_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, reservations: data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /reservations/mes — toutes les réservations des biens de l'agence connectée
router.get('/mes', verifierToken, async (req, res) => {
  try {
    // Récupérer les biens de l'agence
    const { data: biens } = await supabase
      .from('biens')
      .select('id')
      .eq('user_id', req.user.id)

    if (!biens || biens.length === 0) {
      return res.json({ success: true, reservations: [] })
    }

    const bienIds = biens.map(b => b.id)

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .in('bien_id', bienIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, reservations: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// PATCH /reservations/:id — confirmer ou annuler (agence)
router.patch('/:id', verifierToken, async (req, res) => {
  const { error, value } = updateReservationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: error.details[0].message,
    })
  }

  const { statut, paiement } = value

  try {
    const { data, error: updateError } = await supabase
      .from('reservations')
      .update({
        statut,
        confirmed_at: statut === 'confirmee' ? new Date().toISOString() : null,
      })
      .eq('id', req.params.id)
      .select()

    if (updateError) throw updateError
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' })
    }

    const reservation = data[0]

    // Si confirmée : annuler automatiquement les autres demandes en attente sur ce bien
    if (statut === 'confirmee') {
      const { data: autresEnAttente } = await supabase
        .from('reservations')
        .update({ statut: 'expiree' })
        .eq('bien_id', reservation.bien_id)
        .eq('statut', 'en_attente')
        .neq('id', reservation.id)
        .select()

      // Notifier les clients dont la demande vient d'expirer
      if (autresEnAttente && autresEnAttente.length > 0) {
        const { data: bienPourNotif } = await supabase
          .from('biens')
          .select('*')
          .eq('id', reservation.bien_id)
          .maybeSingle()

        autresEnAttente.forEach(autre => {
          envoyerEmailReservation(autre, 'expiree', bienPourNotif, null).catch(() => {})
        })
      }
    }

    const { data: bien } = await supabase
      .from('biens')
      .select('*')
      .eq('id', reservation.bien_id)
      .maybeSingle()

    envoyerEmailReservation(reservation, statut, bien, paiement).catch(() => {})

    res.json({ success: true, message: `Réservation ${statut === 'confirmee' ? 'confirmée' : 'annulée'}` })
  } catch (err) {
    logger.error('Erreur update réservation', { error: err.message })
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// ========== EXPIRATION AUTOMATIQUE ==========
// Demandes 'en_attente' dont le délai (expire_at) est dépassé → passent à 'expiree'
async function expirerReservationsDepassees() {
  try {
    const { data: expirees } = await supabase
      .from('reservations')
      .update({ statut: 'expiree' })
      .eq('statut', 'en_attente')
      .lt('expire_at', new Date().toISOString())
      .select()

    if (expirees && expirees.length > 0) {
      logger.info(`Demandes expirées automatiquement`, { total: expirees.length })

      // Notifier les clients concernés
      for (const res of expirees) {
        const { data: bien } = await supabase
          .from('biens')
          .select('*')
          .eq('id', res.bien_id)
          .maybeSingle()
        envoyerEmailReservation(res, 'expiree', bien, null).catch(() => {})
      }
    }
  } catch (err) {
    logger.error('Erreur expiration automatique', { error: err.message })
  }
}

module.exports = router
module.exports.expirerReservationsDepassees = expirerReservationsDepassees

// PATCH /reservations/:id/cloturer — déclarer le résultat de la visite
// resultat: 'pris' (le client a pris le bien) | 'refuse_client' (client n'a pas voulu) | 'absent' (no-show)
router.patch('/:id/cloturer', verifierToken, async (req, res) => {
  const { resultat } = req.body
  if (!['pris', 'refuse_client', 'absent'].includes(resultat)) {
    return res.status(400).json({ success: false, message: 'Résultat invalide' })
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .update({ resultat_visite: resultat, cloture_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' })
    }

    const reservation = data[0]

    // Si le client n'a pas pris le bien ou ne s'est pas présenté → remettre le bien disponible
    if (resultat !== 'pris') {
      await supabase
        .from('biens')
        .update({ statut: 'disponible' })
        .eq('id', reservation.bien_id)
    } else {
      // Client a pris le bien → inviter à laisser un avis
      envoyerEmailInvitationAvis(reservation).catch(() => {})
    }

    res.json({
      success: true,
      message: resultat === 'pris'
        ? 'Visite clôturée — bien attribué. Pensez à déclarer la transaction.'
        : 'Visite clôturée — le bien repasse disponible.'
    })
  } catch (err) {
    logger.error('Erreur clôture réservation', { error: err.message })
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})