function saisirInfosPaiement(montantSuggere) {
  const mode = (prompt(
    'Mode de paiement (Mobile Money, Virement, Espèces):',
    'Mobile Money'
  ) || '').trim()

  const montantInput = (prompt(
    `Montant à régler par le client (FCFA)${montantSuggere ? ` — suggéré: ${montantSuggere.toLocaleString('fr-FR')}` : ''}:`,
    montantSuggere ? String(montantSuggere) : ''
  ) || '').trim()

  const reference = (prompt('Référence de paiement (ex: IMC-XXXX):', '') || '').trim()
  const details = (prompt(
    'Instructions de paiement:',
    'Airtel Money / MTN Mobile Money — envoyez la preuve par WhatsApp'
  ) || '').trim()
  const telephone = (prompt('Numéro Mobile Money pour le paiement:', '+242 06 883 4146') || '').trim()

  const montant = parseInt(montantInput, 10)
  if (!mode || Number.isNaN(montant) || montant < 0) {
    return null
  }

  return {
    mode,
    montant_fcfa: montant,
    reference,
    details,
    telephone,
  }
}

window.saisirInfosPaiement = saisirInfosPaiement
