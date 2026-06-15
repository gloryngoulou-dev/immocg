const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const Joi = require('joi')
const { verifierToken } = require('./auth')
const { calculerCommission, buildReferenceImmocg, COMMISSION_IMMOCG_PCT } = require('../utils/commissions')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const declarerSchema = Joi.object({
  reservation_id: Joi.alternatives().try(Joi.string().uuid(), Joi.number().integer().positive()).required(),
  montant_fcfa: Joi.number().integer().min(1).required(),
  type_transaction: Joi.string().valid('location', 'vente', 'location_jour', 'visite').required(),
  notes: Joi.string().max(500).optional().allow(''),
})

router.post('/declarer', verifierToken, async (req, res) => {
  if (req.user.role !== 'agence' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }

  const { error, value } = declarerSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ success: false, message: 'Données invalides', details: error.details[0].message })
  }

  try {
    const { data: reservation, error: resErr } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', value.reservation_id)
      .maybeSingle()

    if (resErr || !reservation) {
      return res.status(404).json({ success: false, message: 'Réservation introuvable' })
    }

    if (reservation.statut !== 'confirmee') {
      return res.status(400).json({ success: false, message: 'Seules les réservations confirmées peuvent être déclarées' })
    }

    if (req.user.role === 'agence') {
      const { data: bien } = await supabase
        .from('biens')
        .select('user_id')
        .eq('id', reservation.bien_id)
        .maybeSingle()

      if (!bien || bien.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Cette réservation ne vous appartient pas' })
      }
    }

    const reference = buildReferenceImmocg(reservation.id)
    const commissionFcfa = calculerCommission(value.montant_fcfa)

    const { data: existante } = await supabase
      .from('transactions')
      .select('id')
      .eq('reservation_id', reservation.id)
      .maybeSingle()

    if (existante) {
      return res.status(400).json({ success: false, message: 'Cette transaction a déjà été déclarée' })
    }

    const { data: transaction, error: insertErr } = await supabase
      .from('transactions')
      .insert([{
        reservation_id: reservation.id,
        bien_id: reservation.bien_id,
        agence_user_id: req.user.role === 'agence' ? req.user.id : null,
        client_nom: reservation.client_nom,
        client_tel: reservation.client_tel,
        type_transaction: value.type_transaction,
        montant_fcfa: value.montant_fcfa,
        commission_pct: COMMISSION_IMMOCG_PCT,
        commission_fcfa: commissionFcfa,
        reference_immocg: reference,
        statut: 'declaree',
        notes: value.notes || null,
      }])
      .select()
      .single()

    if (insertErr) {
      console.error('Erreur insert transaction:', insertErr.message)
      return res.status(500).json({
        success: false,
        message: 'Impossible d\'enregistrer la transaction. Vérifiez que la table transactions existe dans Supabase.',
      })
    }

    res.json({
      success: true,
      message: 'Transaction déclarée. Commission ImmoCG calculée.',
      transaction,
      commission_fcfa: commissionFcfa,
      commission_pct: COMMISSION_IMMOCG_PCT,
    })
  } catch (err) {
    console.error('Erreur déclaration transaction:', err.message)
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

router.get('/mes', verifierToken, async (req, res) => {
  if (req.user.role !== 'agence') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('agence_user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, transactions: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' })
  }
})

router.get('/admin', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalCommission = (data || []).reduce((sum, t) => sum + (t.commission_fcfa || 0), 0)

    res.json({
      success: true,
      transactions: data || [],
      total_commission_fcfa: totalCommission,
      commission_pct: COMMISSION_IMMOCG_PCT,
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' })
  }
})

router.patch('/:id/verifier', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({ statut: 'verifiee' })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, transaction: data })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

module.exports = router
