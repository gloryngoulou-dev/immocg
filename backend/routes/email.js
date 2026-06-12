const { Resend } = require('resend')
const resend = new Resend(process.env.RESEND_API_KEY)

async function envoyerEmailActivation(agence) {
  try {
    // Email à l'agence
    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: 'gloryngoulou@gmail.com', // En attendant domaine vérifié
      subject: `✅ Agence activée : ${agence.nom_agence}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1A1A18; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #C9963A; margin: 0;">ImmoCG</h1>
            <p style="color: #aaa; margin: 5px 0 0;">Notification Admin</p>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #eee;">
            <h2 style="color: #2d6e2d;">✅ Agence activée</h2>
            <p style="color: #444; line-height: 1.6;">Une agence vient d'être activée sur ImmoCG :</p>
            <div style="background: #F7F3EC; border-radius: 8px; padding: 15px; margin: 15px 0;">
              <p><strong>Agence :</strong> ${agence.nom_agence}</p>
              <p><strong>Contact :</strong> ${agence.nom}</p>
              <p><strong>Email :</strong> ${agence.email}</p>
              <p><strong>Téléphone :</strong> ${agence.telephone || '—'}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <p style="color: #888; font-size: 13px;">Email envoyé automatiquement par ImmoCG</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #aaa; font-size: 12px;">
            ImmoCG · Brazzaville, Congo · 2026
          </div>
        </div>
      `
    })
    console.log('Email notification envoyé à gloryngoulou@gmail.com')
    return true
  } catch (error) {
    console.error('Erreur email:', error)
    return false
  }
}

async function envoyerEmailRefus(agence) {
  try {
    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: agence.email,
      subject: 'Votre demande de partenariat ImmoCG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1A1A18; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #C9963A; margin: 0;">ImmoCG</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1A1A18;">Bonjour ${agence.nom_agence},</h2>
            <p style="color: #444; line-height: 1.6;">
              Après examen de votre dossier, nous ne sommes pas en mesure d'activer votre compte partenaire pour le moment.
            </p>
            <p style="color: #444; line-height: 1.6;">
              Pour plus d'informations, contactez-nous à <strong>contact@immocg.com</strong>.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #aaa; font-size: 12px;">
            ImmoCG · Brazzaville, Congo · 2026
          </div>
        </div>
      `
    })
    return true
  } catch (error) {
    console.error('Erreur email refus:', error)
    return false
  }
}

module.exports = { envoyerEmailActivation, envoyerEmailRefus }
async function envoyerEmailReservation(reservation, statut) {
  if (!reservation.client_email) return false
  try {
    const estConfirmee = statut === 'confirmee'
    const sujet = estConfirmee
      ? `✅ Votre demande de visite a été confirmée — ImmoCG`
      : `❌ Votre demande de visite — ImmoCG`

    const couleur = estConfirmee ? '#2d6e2d' : '#c0392b'
    const emoji = estConfirmee ? '✅' : '❌'
    const message = estConfirmee
      ? `Votre demande de visite a été <strong>confirmée</strong> par l'agence.<br><br>
         Vous avez <strong>48h</strong> pour confirmer votre présence.<br>
         L'agence vous contactera directement pour organiser la visite.`
      : `Votre demande de visite n'a pas pu être confirmée pour le moment.<br><br>
         Consultez d'autres biens disponibles sur ImmoCG.`

    await resend.emails.send({
      from: 'ImmoCG <onboarding@resend.dev>',
      to: reservation.client_email,
      subject: sujet,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <div style="background:#1A1A18;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
            <h1 style="color:#C9963A;margin:0;">ImmoCG</h1>
            <p style="color:#aaa;margin:5px 0 0;font-size:13px;">Plateforme immobilière de Brazzaville</p>
          </div>
          <div style="background:#fff;padding:30px;border:1px solid #eee;border-radius:0 0 10px 10px;">
            <h2 style="color:${couleur};">${emoji} ${estConfirmee ? 'Demande confirmée !' : 'Demande non confirmée'}</h2>
            <p style="color:#444;line-height:1.8;">Bonjour <strong>${reservation.client_nom}</strong>,</p>
            <p style="color:#444;line-height:1.8;">${message}</p>
            ${estConfirmee ? `
            <div style="background:#fffdf5;border-radius:8px;padding:15px;margin:15px 0;font-size:13px;color:#7A5A1A;line-height:1.8;">
              <strong>📋 Rappel des clauses :</strong><br>
              ⏱️ Vous avez 48h pour confirmer votre présence<br>
              ✅ Si le bien ne correspond pas aux critères, annulation sans frais
            </div>` : ''}
            <a href="https://immocg.onrender.com" style="display:inline-block;background:#C9963A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:10px;">
              Voir les annonces →
            </a>
          </div>
          <p style="text-align:center;color:#aaa;font-size:12px;margin-top:15px;">
            ImmoCG · Brazzaville, Congo · immocg.onrender.com
          </p>
        </div>
      `
    })
    return true
  } catch (err) {
    console.error('Erreur email réservation:', err.message)
    return false
  }
}

module.exports = { envoyerEmailActivation, envoyerEmailRefus, envoyerEmailReservation }

async function envoyerEmailReservation(reservation, statut) {
  if (!reservation.client_email) return false
  if (!process.env.RESEND_API_KEY) return false

  try {
    const estConfirmee = statut === 'confirmee'
    const sujet = estConfirmee
      ? '✅ Votre demande de visite est confirmée — ImmoCG'
      : '❌ Votre demande de visite n\'a pas été retenue — ImmoCG'

    const dateVisite = reservation.date_souhaitee
      ? new Date(reservation.date_souhaitee).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
      : 'à définir avec l\'agence'

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
          <p style="color:#555;">À bientôt sur ImmoCG !</p>
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
          <h2 style="color:#721c24;">Votre demande n'a pas été retenue</h2>
          <p>Bonjour <strong>${reservation.client_nom}</strong>,</p>
          <p>Nous sommes désolés, votre demande de visite n'a pas pu être confirmée par l'agence.</p>
          <p>D'autres biens correspondant à vos critères sont disponibles sur notre plateforme.</p>
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