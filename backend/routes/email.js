const { Resend } = require('resend')
const {
  buildPaymentInfo,
  genererContratReservationPdf,
  genererContratPartenairePdf,
} = require('../utils/contratPdf')

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || 'gloryngoulou@gmail.com'
const SITE_URL = (process.env.SITE_URL || 'https://immocg.onrender.com').replace(/\/$/, '')
const CONTACT_WHATSAPP = process.env.PAYMENT_PHONE || '+242 06 883 4146'

function buildWhatsAppUrl(telephone, message) {
  const num = String(telephone || '').replace(/[^0-9]/g, '')
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

async function envoyerEmailActivation(agence) {
  if (!process.env.RESEND_API_KEY) return false

  const contratPdf = genererContratPartenairePdf(agence)
  const contratNom = `Contrat-Partenaire-${String(agence.nom_agence || 'Agence').replace(/\s+/g, '-')}.pdf`

  const htmlAgence = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#1A1A18;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
      <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
    </div>
    <div style="background:#fff;padding:30px;border:1px solid #eee;border-radius:0 0 10px 10px;">
      <h2 style="color:#2d6e2d;">✅ Votre compte est activé !</h2>
      <p>Bonjour <strong>${agence.nom_agence}</strong>,</p>
      <p>Votre demande de partenariat a été <strong>validée</strong>. Vous pouvez dès maintenant publier vos annonces sur ImmoCG.</p>
      <p style="color:#444;font-size:13px;">Le contrat de partenariat PDF est joint à ce message.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${SITE_URL}/login.html" style="background:#C9963A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
          Accéder à mon espace agence →
        </a>
      </div>
      <p style="color:#666;font-size:13px;">Identifiant : <strong>${agence.email}</strong></p>
      <p style="color:#888;font-size:13px;">Besoin d'aide ? WhatsApp : <strong>${CONTACT_WHATSAPP}</strong></p>
    </div>
    <div style="text-align:center;padding:15px;color:#aaa;font-size:12px;">
      ImmoCG · Brazzaville, Congo
    </div>
  </div>`

  const htmlAdmin = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#1A1A18;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
      <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
      <p style="color:#aaa;margin:5px 0 0;">Notification admin</p>
    </div>
    <div style="background:#fff;padding:30px;border:1px solid #eee;">
      <h2 style="color:#2d6e2d;">✅ Agence activée</h2>
      <p><strong>Agence :</strong> ${agence.nom_agence}</p>
      <p><strong>Contact :</strong> ${agence.nom}</p>
      <p><strong>Email :</strong> ${agence.email}</p>
      <p><strong>Téléphone :</strong> ${agence.telephone || '—'}</p>
    </div>
  </div>`

  try {
    if (agence.email) {
      await resend.emails.send({
        from: 'ImmoCG <onboarding@resend.dev>',
        to: agence.email,
        subject: '✅ Votre compte partenaire ImmoCG est activé !',
        html: htmlAgence,
        attachments: [{ filename: contratNom, content: contratPdf.toString('base64') }],
      })
    }

    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `✅ Agence activée : ${agence.nom_agence}`,
      html: htmlAdmin,
      attachments: [{ filename: contratNom, content: contratPdf.toString('base64') }],
    })

    return true
  } catch (err) {
    console.error('Erreur email activation:', err.message)
    return false
  }
}

async function envoyerEmailRefus(agence) {
  if (!process.env.RESEND_API_KEY) return false

  try {
    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: agence.email,
      subject: 'Votre demande de partenariat ImmoCG',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#1A1A18;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;border-radius:0 0 10px 10px;">
          <h2>Bonjour ${agence.nom_agence},</h2>
          <p>Après examen de votre dossier, nous ne sommes pas en mesure d'activer votre compte partenaire pour le moment.</p>
          <p>Pour plus d'informations : WhatsApp <strong>${CONTACT_WHATSAPP}</strong></p>
        </div>
      </div>`,
    })
    return true
  } catch (err) {
    console.error('Erreur email refus:', err.message)
    return false
  }
}

async function envoyerEmailReservation(reservation, statut, bien, paiement) {
  if (!reservation.client_email) return false
  if (!process.env.RESEND_API_KEY) return false
  if (!bien) return false

  try {
    const estConfirmee = statut === 'confirmee'
    const paiementInfo = buildPaymentInfo(paiement, reservation, bien)
    const dateVisite = reservation.date_souhaitee
      ? new Date(reservation.date_souhaitee).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'à définir avec l\'agence'

    const sujet = estConfirmee
      ? '✅ Votre réservation est confirmée — Contrat et paiement ImmoCG'
      : statut === 'expiree'
      ? '⌛ Ce bien a été réservé par un autre client — ImmoCG'
      : '❌ Votre demande n\'a pas été retenue — ImmoCG'

    const blocPaiement = estConfirmee ? `
      <div style="background:#f8f8f8;border:1px solid #eee;border-radius:10px;padding:14px;margin:16px 0;">
        <p style="margin:0 0 8px 0;"><strong>💳 Modalités de paiement</strong></p>
        <p style="margin:0;">Montant à régler : <strong>${paiementInfo.montant.toLocaleString('fr-FR')} FCFA</strong></p>
        <p style="margin:0;">Mode : <strong>${paiementInfo.mode}</strong></p>
        <p style="margin:0;">Référence : <strong>${paiementInfo.reference}</strong></p>
        <p style="margin:0;">Numéro : <strong>${paiementInfo.telephone}</strong></p>
        <p style="margin:6px 0 0 0;color:#666;">${paiementInfo.details}</p>
      </div>
      <p style="color:#444;font-size:13px;">📄 Votre contrat PDF est joint à ce message.</p>` : ''

    const html = estConfirmee ? `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1A1A18;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;">
          <h2 style="color:#155724;">✅ Réservation confirmée !</h2>
          <p>Bonjour <strong>${reservation.client_nom}</strong>,</p>
          <p>Votre demande pour le bien <strong>${bien.titre || bien.type || ''}</strong> a été confirmée.</p>
          <div style="background:#d4edda;border-radius:8px;padding:15px;margin:15px 0;">
            <p><strong>📅 Date prévue :</strong> ${dateVisite}</p>
            <p><strong>📍 Lieu :</strong> ${bien.quartier || ''}, ${bien.ville || 'Brazzaville'}</p>
          </div>
          ${blocPaiement}
          <div style="background:#fffdf5;border-radius:8px;padding:15px;margin:15px 0;font-size:13px;color:#7A5A1A;">
            <strong>📋 Rappel :</strong><br>
            ⏱️ Vous avez <strong>48h</strong> pour confirmer votre présence<br>
            ✅ Si le bien ne correspond pas aux critères → annulation sans frais
          </div>
        </div>
        <div style="text-align:center;padding:15px;color:#aaa;font-size:12px;">
          ImmoCG · ${SITE_URL} · Brazzaville, Congo
        </div>
      </div>` : `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1A1A18;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;">
          <h2 style="color:#721c24;">${statut === 'expiree' ? 'Bien déjà réservé' : 'Demande non retenue'}</h2>
          <p>Bonjour <strong>${reservation.client_nom}</strong>,</p>
          <p>${statut === 'expiree'
            ? 'Ce bien a été réservé par un autre client avant la confirmation de votre demande. Nous sommes désolés pour le désagrément.'
            : 'Votre demande n\'a pas pu être confirmée par l\'agence.'}</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${SITE_URL}" style="background:#C9963A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              Voir d'autres biens →
            </a>
          </div>
        </div>
        <div style="text-align:center;padding:15px;color:#aaa;font-size:12px;">
          ImmoCG · ${SITE_URL} · Brazzaville, Congo
        </div>
      </div>`

    const emailPayload = {
      from: 'ImmoCG <onboarding@resend.dev>',
      to: reservation.client_email,
      subject: sujet,
      html,
    }

    if (estConfirmee) {
      const contratPdf = genererContratReservationPdf(reservation, bien, paiement)
      const contratNom = `Contrat-ImmoCG-${String(reservation.client_nom || 'client').replace(/\s+/g, '-')}.pdf`
      emailPayload.attachments = [{ filename: contratNom, content: contratPdf.toString('base64') }]
    }

    await resend.emails.send(emailPayload)
    return true
  } catch (err) {
    console.error('Erreur email réservation:', err.message)
    return false
  }
}

module.exports = {
  envoyerEmailActivation,
  envoyerEmailRefus,
  envoyerEmailReservation,
  buildWhatsAppUrl,
}