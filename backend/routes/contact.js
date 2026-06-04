const express = require('express')
const router = express.Router()
const { Resend } = require('resend')
const Joi = require('joi')

const resend = new Resend(process.env.RESEND_API_KEY)
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'gloryngoulou@gmail.com'

// ========== VALIDATION SCHEMA ==========
const contactSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  tel: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/).required(),
  email: Joi.string().email().max(255).optional().allow(''),
  sujet: Joi.string().max(200).optional().allow(''),
  message: Joi.string().min(10).max(5000).required()
})

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

router.post('/', async (req, res) => {
  // Validation stricte des entrées
  const { error, value } = contactSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      details: error.details[0].message
    })
  }

  const { nom, tel, email, sujet, message } = value

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Envoi email non configuré — utilisez WhatsApp',
      fallback_whatsapp: true,
    })
  }

  try {
    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: CONTACT_EMAIL,
      replyTo: email || undefined,
      subject: `[ImmoCG Contact] ${escapeHtml(sujet) || 'Demande'}`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
<h2 style="color:#1A1A18;">Nouveau message — ImmoCG</h2>
<p><strong>Sujet :</strong> ${escapeHtml(sujet)}</p>
<p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
<p><strong>Téléphone :</strong> ${escapeHtml(tel)}</p>
<p><strong>Email :</strong> ${escapeHtml(email) || '—'}</p>
<hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
<p style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(message)}</p>
</div>`,
    })

    res.json({ success: true, message: 'Message envoyé ! Nous vous répondrons sous 24h.' })
  } catch (err) {
    console.error('Contact email error (détails masqués)')
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi' })
  }
})

module.exports = router