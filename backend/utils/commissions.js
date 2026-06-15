const COMMISSION_IMMOCG_PCT = Number(process.env.COMMISSION_IMMOCG_PCT || 10)
const ABONNEMENT_MENSUEL_FCFA = Number(process.env.ABONNEMENT_MENSUEL_FCFA || 10000)
const DELAI_PAIEMENT_COMMISSION_JOURS = 7

function calculerCommission(montantFcfa) {
  const montant = Number(montantFcfa) || 0
  return Math.round(montant * COMMISSION_IMMOCG_PCT / 100)
}

function buildReferenceImmocg(reservationId) {
  return `IMC-${String(reservationId || '').substring(0, 8).toUpperCase()}`
}

module.exports = {
  COMMISSION_IMMOCG_PCT,
  ABONNEMENT_MENSUEL_FCFA,
  DELAI_PAIEMENT_COMMISSION_JOURS,
  calculerCommission,
  buildReferenceImmocg,
}
