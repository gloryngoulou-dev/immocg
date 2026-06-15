const { jsPDF } = require('jspdf')

const SITE_URL = (process.env.SITE_URL || 'https://immocg.onrender.com').replace(/\/$/, '')
const PAYMENT_PHONE = process.env.PAYMENT_PHONE || '+242 06 883 4146'
const PAYMENT_DETAILS = process.env.DEFAULT_PAYMENT_DETAILS || 'Airtel Money / MTN Mobile Money'

function calculerFraisVisite(prix) {
  if (prix < 100000) return 0
  if (prix < 300000) return 5000
  if (prix < 500000) return 10000
  return 15000
}

function calculerMontantReservation(reservation, bien) {
  const prix = Number(bien.prix) || 0
  const prixJour = Number(bien.prix_jour) || 0
  const type = reservation.type_reservation || 'visite'

  if (type === 'achat') {
    return Math.max(Math.round(prix * 0.1), 50000)
  }
  if (type === 'location_jour') {
    const nuits = reservation.nb_nuits || 2
    return prixJour * nuits
  }
  const fraisVisite = calculerFraisVisite(prix)
  if (fraisVisite > 0) return fraisVisite
  return Math.round(prix * 0.05)
}

const { buildReferenceImmocg, COMMISSION_IMMOCG_PCT } = require('./commissions')

function buildPaymentInfo(paiement, reservation, bien) {
  const montantAuto = calculerMontantReservation(reservation, bien)
  const mode = paiement?.mode || process.env.DEFAULT_PAYMENT_MODE || 'Mobile Money'
  const montant = Number.isFinite(Number(paiement?.montant_fcfa))
    ? Number(paiement.montant_fcfa)
    : montantAuto
  return {
    mode,
    montant,
    reference: paiement?.reference || buildReferenceImmocg(reservation.id),
    details: paiement?.details || PAYMENT_DETAILS,
    telephone: paiement?.telephone || PAYMENT_PHONE,
  }
}

function genererContratReservationPdf(reservation, bien, paiement) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const marge = 20
  const paiementInfo = buildPaymentInfo(paiement, reservation, bien)

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const typeContrat = reservation.type_reservation === 'achat'
    ? 'PROMESSE DE VENTE'
    : reservation.type_reservation === 'location_jour'
      ? 'CONTRAT DE LOCATION COURTE DUREE'
      : reservation.type_reservation === 'visite'
        ? 'CONTRAT DE VISITE ET RESERVATION'
        : 'CONTRAT DE BAIL D\'HABITATION'

  const refDoc = buildReferenceImmocg(reservation.id)

  doc.setDrawColor(201, 150, 58)
  doc.setLineWidth(0.8)
  doc.rect(10, 10, 190, 277)
  doc.setLineWidth(0.3)
  doc.rect(11.5, 11.5, 187, 274)

  doc.setFillColor(26, 26, 24)
  doc.rect(10, 10, 190, 40, 'F')

  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('ImmoCG', marge, 32)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text('Plateforme immobiliere de Brazzaville', marge, 40)
  doc.text(`${SITE_URL.replace('https://', '')}`, marge, 46)

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(`Ref: ${refDoc}`, pageW - marge, 30, { align: 'right' })
  doc.text(`Date: ${dateAujourdhui}`, pageW - marge, 37, { align: 'right' })
  doc.text('Republique du Congo', pageW - marge, 44, { align: 'right' })

  doc.setFillColor(248, 245, 240)
  doc.rect(10, 50, 190, 18, 'F')
  doc.setDrawColor(201, 150, 58)
  doc.setLineWidth(1.5)
  doc.line(10, 50, 10, 68)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 26, 24)
  doc.text(typeContrat, pageW / 2, 62, { align: 'center' })

  let y = 78

  doc.setFillColor(248, 245, 240)
  doc.roundedRect(marge, y, 82, 42, 2, 2, 'F')
  doc.setDrawColor(201, 150, 58)
  doc.roundedRect(marge, y, 82, 42, 2, 2, 'S')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('BAILLEUR / PROPRIETAIRE', marge + 4, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.text(bien.contact_nom || 'Agence partenaire', marge + 4, y + 15)
  doc.setFontSize(8)
  doc.text(`Tel: ${bien.contact_tel || '—'}`, marge + 4, y + 22)
  doc.text(`Email: ${bien.contact_email || '—'}`, marge + 4, y + 29)
  doc.text(`${bien.quartier || '—'}, ${bien.ville || 'Brazzaville'}`, marge + 4, y + 36)

  doc.setFillColor(248, 245, 240)
  doc.roundedRect(pageW - marge - 82, y, 82, 42, 2, 2, 'F')
  doc.roundedRect(pageW - marge - 82, y, 82, 42, 2, 2, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('LOCATAIRE / ACHETEUR', pageW - marge - 78, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.text(reservation.client_nom || '—', pageW - marge - 78, y + 15)
  doc.setFontSize(8)
  doc.text(`Tel: ${reservation.client_tel || '—'}`, pageW - marge - 78, y + 22)
  doc.text(`Email: ${reservation.client_email || '—'}`, pageW - marge - 78, y + 29)
  doc.text('Piece d\'identite: ___________________', pageW - marge - 78, y + 36)

  y += 50

  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DESIGNATION DU BIEN', marge + 3, y + 5)
  y += 10

  const bienInfos = [
    ['Nature:', bien.type || bien.titre || '—', 'Surface:', `${bien.surface || '—'} m2`],
    ['Adresse:', `${bien.quartier || '—'}, ${bien.ville || 'Brazzaville'}`, 'Chambres:', `${bien.chambres || '—'}`],
    ['Titre:', bien.titre || '—', 'Etat:', bien.etat || 'Non precise'],
  ]

  bienInfos.forEach((row) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text(row[0], marge, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 24)
    doc.text(String(row[1]).substring(0, 35), marge + 22, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text(row[2], 120, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 24)
    doc.text(String(row[3]), 145, y)
    y += 7
  })

  y += 3
  doc.setDrawColor(220, 220, 220)
  doc.line(marge, y, pageW - marge, y)
  y += 7

  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFont('helvetica', 'bold')
  doc.text('MODALITES DE PAIEMENT', marge + 3, y + 5)
  y += 10

  const prixLabel = reservation.type_reservation === 'location_jour'
    ? `${Number(bien.prix_jour || 0).toLocaleString('fr-FR')} FCFA / nuit`
    : `${Number(bien.prix || 0).toLocaleString('fr-FR')} FCFA`

  const paiementRows = [
    ['Prix / Loyer:', prixLabel],
    ['Montant a regler:', `${paiementInfo.montant.toLocaleString('fr-FR')} FCFA`],
    ['Mode de paiement:', paiementInfo.mode],
    ['Reference:', paiementInfo.reference],
    ['Numero Mobile Money:', paiementInfo.telephone],
    ['Instructions:', paiementInfo.details],
    ['Date visite / entree:', reservation.date_souhaitee
      ? new Date(reservation.date_souhaitee).toLocaleDateString('fr-FR') : 'A convenir'],
  ]

  paiementRows.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text(label, marge, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(26, 26, 24)
    const lines = doc.splitTextToSize(String(val), 105)
    doc.text(lines, marge + 48, y)
    y += Math.max(lines.length * 5, 7)
  })

  y += 3
  doc.setDrawColor(220, 220, 220)
  doc.line(marge, y, pageW - marge, y)
  y += 7

  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFont('helvetica', 'bold')
  doc.text('CLAUSES ET CONDITIONS', marge + 3, y + 5)
  y += 10

  const clauses = [
    `Art. 1 — Reference ImmoCG obligatoire : ${refDoc}. Toute transaction issue de cette demande est tracee par ImmoCG.`,
    'Art. 2 — Le bailleur s\'engage a remettre le bien conforme a l\'annonce ImmoCG.',
    'Art. 3 — Le client dispose de 48h pour confirmer sa presence apres validation.',
    'Art. 4 — L\'agence dispose de 24h pour valider ou refuser la demande.',
    'Art. 5 — Le paiement doit etre effectue selon les modalites ci-dessus avant la visite ou l\'entree.',
    'Art. 6 — En cas de non-correspondance du bien, annulation sans frais.',
    `Art. 7 — ImmoCG est apporteur d\'affaires. Commission plateforme : ${COMMISSION_IMMOCG_PCT}% sur le montant de la transaction, payable sous 7 jours.`,
    'Art. 8 — L\'agence s\'engage a declarer toute transaction conclue via ImmoCG dans les 7 jours.',
    'Art. 9 — Contrat soumis au droit congolais. Litiges devant les juridictions de Brazzaville.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(50, 50, 50)
  clauses.forEach((clause) => {
    const lines = doc.splitTextToSize(clause, 165)
    doc.text(lines, marge + 2, y)
    y += lines.length * 5.5 + 1.5
  })

  y += 5
  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('SIGNATURES', marge + 3, y + 5)
  y += 12

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fait a Brazzaville, le ${dateAujourdhui}`, pageW / 2, y, { align: 'center' })
  y += 12
  doc.text('Le Bailleur', marge + 20, y, { align: 'center' })
  doc.text('Le Client', pageW - marge - 20, y, { align: 'center' })
  y += 18
  doc.line(marge, y, marge + 70, y)
  doc.line(pageW - marge - 70, y, pageW - marge, y)

  doc.setFillColor(26, 26, 24)
  doc.rect(10, 275, 190, 12, 'F')
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.text(`ImmoCG · ${SITE_URL}`, pageW / 2, 281, { align: 'center' })
  doc.text('Document genere automatiquement — Signatures originales requises', pageW / 2, 285, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

function genererContratPartenairePdf(agence) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const marge = 20
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const ref = `PART-${String(agence.id || '').substring(0, 8).toUpperCase()}`

  doc.setFillColor(26, 26, 24)
  doc.rect(10, 10, 190, 35, 'F')
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('ImmoCG', marge, 30)
  doc.setFontSize(10)
  doc.setTextColor(200, 200, 200)
  doc.text('Contrat de partenariat agence', marge, 38)

  let y = 55
  doc.setTextColor(26, 26, 24)
  doc.setFontSize(12)
  doc.text('CONTRAT DE PARTENARIAT', 105, y, { align: 'center' })
  y += 12

  const lignes = [
    `Reference: ${ref}`,
    `Date: ${date}`,
    '',
    `Agence: ${agence.nom_agence || '—'}`,
    `Representant: ${agence.nom || '—'}`,
    `Email: ${agence.email || '—'}`,
    `Telephone: ${agence.telephone || '—'}`,
    '',
    'Objet: activation du compte partenaire ImmoCG.',
    '',
    'Engagements de l\'agence:',
    '- Publier des annonces exactes et conformes.',
    '- Repondre aux demandes de visite sous 24h.',
    '- Respecter les clauses ImmoCG vis-a-vis des clients.',
    `- Declarer toute transaction conclue via ImmoCG sous 7 jours.`,
    `- Payer la commission ImmoCG de ${COMMISSION_IMMOCG_PCT}% sur chaque location ou vente.`,
    '- Ne pas detourner les clients hors plateforme apres contact ImmoCG.',
    '',
    'Engagements ImmoCG:',
    '- Mettre a disposition la plateforme de publication.',
    '- Assurer la visibilite des annonces validees.',
    '- Tracer les demandes avec reference unique (IMC-XXXX).',
    '',
    `Espace agence: ${SITE_URL}/login.html`,
    '',
    'Signature agence: __________________________',
    'Signature ImmoCG: __________________________',
  ]

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  lignes.forEach((line) => {
    doc.text(line, marge, y)
    y += 7
  })

  return Buffer.from(doc.output('arraybuffer'))
}

module.exports = {
  calculerMontantReservation,
  buildPaymentInfo,
  genererContratReservationPdf,
  genererContratPartenairePdf,
}
