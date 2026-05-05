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