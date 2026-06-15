const { Resend } = require('resend')
const resend = new Resend(process.env.RESEND_API_KEY)

async function envoyerEmailActivation(agence) {
  try {
    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: 'gloryngoulou@gmail.com',
      subject: `✅ Agence activée : ${agence.nom_agence}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#1A1A18;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
          <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;">
          <h2 style="color:#2d6e2d;">✅ Agence activée</h2>
          <p><strong>Agence :</strong> ${agence.nom_agence}</p>
          <p><strong>Contact :</strong> ${agence.nom}</p>
          <p><strong>Email :</strong> ${agence.email}</p>
          <p><strong>Téléphone :</strong> ${agence.telephone || '—'}</p>
        </div>
      </div>`
    })
    return true
  } catch (err) {
    console.error('Erreur email activation:', err.message)
    return false
  }
}

async function envoyerEmailRefus(agence) {
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
          <p>Pour plus d'informations : <strong>contact@immocg.com</strong></p>
        </div>
      </div>`
    })
    return true
  } catch (err) {
    console.error('Erreur email refus:', err.message)
    return false
  }
}

async function envoyerEmailReservation(reservation, statut) {
  if (!reservation.client_email) return false
  if (!process.env.RESEND_API_KEY) return false

  try {
    const estConfirmee = statut === 'confirmee'
    const dateVisite = reservation.date_souhaitee
      ? new Date(reservation.date_souhaitee).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
      : 'à définir avec l\'agence'

    const sujet = estConfirmee
      ? '✅ Votre demande de visite est confirmée — ImmoCG'
      : '❌ Votre demande de visite n\'a pas été retenue — ImmoCG'

    const html = estConfirmee ? `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1A1A18;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;">
          <h2 style="color:#155724;">✅ Visite confirmée !</h2>
          <p>Bonjour <strong>${reservation.client_nom}</strong>,</p>
          <p>Votre demande de visite a été <strong>confirmée</strong> par l'agence.</p>
          <div style="background:#d4edda;border-radius:8px;padding:15px;margin:15px 0;">
            <p><strong>📅 Date prévue :</strong> ${dateVisite}</p>
            <p><strong>📞 Contactez l'agence pour confirmer l'heure exacte</strong></p>
          </div>
          <div style="background:#fffdf5;border-radius:8px;padding:15px;margin:15px 0;font-size:13px;color:#7A5A1A;">
            <strong>📋 Rappel des clauses :</strong><br>
            ⏱️ Vous avez <strong>48h</strong> pour confirmer votre présence<br>
            ✅ Si le bien ne correspond pas aux critères annoncés → annulation sans frais
          </div>
        </div>
        <div style="text-align:center;padding:15px;color:#aaa;font-size:12px;">
          ImmoCG · immocg.onrender.com · Brazzaville, Congo
        </div>
      </div>` : `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#1A1A18;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
          <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
        </div>
        <div style="background:#fff;padding:30px;border:1px solid #eee;">
          <h2 style="color:#721c24;">Demande non retenue</h2>
          <p>Bonjour <strong>${reservation.client_nom}</strong>,</p>
          <p>Votre demande de visite n'a pas pu être confirmée par l'agence.</p>
          <div style="text-align:center;margin:20px 0;">
            <a href="https://immocg.onrender.com" style="background:#C9963A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              Voir d'autres biens →
            </a>
          </div>
        </div>
        <div style="text-align:center;padding:15px;color:#aaa;font-size:12px;">
          ImmoCG · immocg.onrender.com · Brazzaville, Congo
        </div>
      </div>`

    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: reservation.client_email,
      subject: sujet,
      html
    })
    return true
  } catch (err) {
    console.error('Erreur email réservation:', err.message)
    return false
  }
}

module.exports = { envoyerEmailActivation, envoyerEmailRefus, envoyerEmailReservation }