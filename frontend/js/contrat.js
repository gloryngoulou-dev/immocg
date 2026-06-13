// ========== GÉNÉRATEUR DE CONTRAT PDF PROFESSIONNEL ==========

function genererContratPDF(reservation, bien) {
  if (typeof window.jsPDF === 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => _genererPDF(reservation, bien)
    document.head.appendChild(script)
  } else {
    _genererPDF(reservation, bien)
  }
}

function _genererPDF(reservation, bien) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const marge = 20

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const typeContrat = reservation.type_reservation === 'achat'
    ? 'PROMESSE DE VENTE'
    : reservation.type_reservation === 'location_jour'
    ? 'CONTRAT DE LOCATION COURTE DURÉE'
    : 'CONTRAT DE BAIL D\'HABITATION'

  const refDoc = `IMC-${String(reservation.id || '').substring(0,8).toUpperCase()}`

  // ===== BORDURE DE PAGE =====
  doc.setDrawColor(201, 150, 58)
  doc.setLineWidth(0.8)
  doc.rect(10, 10, 190, 277)
  doc.setLineWidth(0.3)
  doc.rect(11.5, 11.5, 187, 274)

  // ===== EN-TÊTE =====
  doc.setFillColor(26, 26, 24)
  doc.rect(10, 10, 190, 40, 'F')

  // Logo ImmoCG
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('ImmoCG', marge, 32)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text('Plateforme Immobilière de Brazzaville', marge, 40)
  doc.text('immocg.onrender.com · contact@immocg.com', marge, 46)

  // Infos document (droite)
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(8)
  doc.text(`Réf: ${refDoc}`, pageW - marge, 30, { align: 'right' })
  doc.text(`Date: ${dateAujourdhui}`, pageW - marge, 37, { align: 'right' })
  doc.text('République du Congo', pageW - marge, 44, { align: 'right' })

  // ===== TITRE DU CONTRAT =====
  doc.setTextColor(26, 26, 24)
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

  // ===== SECTION : PARTIES =====
  // Cadre Bailleur
  doc.setFillColor(248, 245, 240)
  doc.roundedRect(marge, y, 82, 42, 2, 2, 'F')
  doc.setDrawColor(201, 150, 58)
  doc.setLineWidth(0.3)
  doc.roundedRect(marge, y, 82, 42, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('BAILLEUR / PROPRIÉTAIRE', marge + 4, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.text(bien.contact_nom || 'Agence ImmoCG', marge + 4, y + 15)
  doc.setFontSize(8)
  doc.text(`Tél: ${bien.contact_tel || '—'}`, marge + 4, y + 22)
  doc.text(`Email: ${bien.contact_email || '—'}`, marge + 4, y + 29)
  doc.text(`Quartier: ${bien.quartier || '—'}, ${bien.ville || 'Brazzaville'}`, marge + 4, y + 36)

  // Cadre Locataire
  doc.setFillColor(248, 245, 240)
  doc.roundedRect(pageW - marge - 82, y, 82, 42, 2, 2, 'F')
  doc.setDrawColor(201, 150, 58)
  doc.roundedRect(pageW - marge - 82, y, 82, 42, 2, 2, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('LOCATAIRE / ACHETEUR', pageW - marge - 78, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.text(reservation.client_nom || '—', pageW - marge - 78, y + 15)
  doc.setFontSize(8)
  doc.text(`Tél: ${reservation.client_tel || '—'}`, pageW - marge - 78, y + 22)
  doc.text(`Email: ${reservation.client_email || '—'}`, pageW - marge - 78, y + 29)
  doc.text('Pièce d\'identité: ___________________', pageW - marge - 78, y + 36)

  y += 50

  // ===== SECTION : BIEN =====
  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉSIGNATION DU BIEN IMMOBILIER', marge + 3, y + 5)
  y += 10

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const bienInfos = [
    [`Nature du bien:`, bien.type || '—', `Surface habitable:`, `${bien.surface || '—'} m²`],
    [`Adresse:`, `${bien.quartier || '—'}, ${bien.ville || 'Brazzaville'}`, `Chambres:`, `${bien.chambres || '—'}`],
    [`État du bien:`, bien.etat || 'Non précisé', `Salles de bain:`, `${bien.salles_bain || '—'}`],
  ]

  bienInfos.forEach(row => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100,100,100)
    doc.text(row[0], marge, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(26,26,24)
    doc.text(row[1], marge + 35, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100,100,100)
    doc.text(row[2], 120, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(26,26,24)
    doc.text(row[3], 155, y)
    y += 7
  })

  y += 3
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(marge, y, pageW - marge, y)
  y += 7

  // ===== SECTION : CONDITIONS FINANCIÈRES =====
  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CONDITIONS FINANCIÈRES', marge + 3, y + 5)
  y += 10

  doc.setTextColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const prixLabel = reservation.type_reservation === 'location_jour'
    ? `${parseInt(bien.prix_jour || 0).toLocaleString('fr-FR')} FCFA / nuit`
    : `${parseInt(bien.prix || 0).toLocaleString('fr-FR')} FCFA / mois`

  const conditions = [
    ['Loyer mensuel / Prix:', prixLabel],
    ['Caution:', reservation.type_reservation === 'location_jour'
      ? `${parseInt((bien.prix_jour || 0) * 2).toLocaleString('fr-FR')} FCFA`
      : `${parseInt((bien.prix || 0) * 2).toLocaleString('fr-FR')} FCFA (2 mois)`],
    ['Date d\'entrée / Visite:', reservation.date_souhaitee
      ? new Date(reservation.date_souhaitee).toLocaleDateString('fr-FR') : '___________'],
    ['Date de départ:', reservation.date_depart
      ? new Date(reservation.date_depart).toLocaleDateString('fr-FR') : '___________'],
    ['Mode de paiement:', 'Espèces / Mobile Money'],
  ]

  conditions.forEach(([label, val]) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100,100,100)
    doc.text(label, marge, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(26,26,24)
    doc.text(val, marge + 55, y)
    y += 7
  })

  y += 3
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(marge, y, pageW - marge, y)
  y += 7

  // ===== CLAUSES =====
  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CLAUSES ET CONDITIONS GÉNÉRALES', marge + 3, y + 5)
  y += 10

  const clauses = [
    'Art. 1 — Le bailleur s\'engage à remettre le bien dans l\'état décrit dans l\'annonce publiée sur ImmoCG.',
    'Art. 2 — Le locataire dispose d\'un délai de 48 heures pour confirmer sa présence après validation de la demande.',
    'Art. 3 — L\'agence dispose d\'un délai de 24 heures pour valider ou refuser toute demande de visite ou réservation.',
    'Art. 4 — En cas de non-correspondance du bien avec les critères annoncés, la résiliation est prononcée sans frais.',
    'Art. 5 — La caution sera restituée dans un délai de 15 jours après l\'état des lieux de sortie, déduction faite des éventuels dommages.',
    'Art. 6 — Tout sous-location est strictement interdite sans accord écrit du bailleur.',
    'Art. 7 — Le présent contrat est soumis au droit congolais en vigueur. Tout litige sera porté devant les juridictions compétentes de Brazzaville.',
  ]

  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  clauses.forEach(clause => {
    const lines = doc.splitTextToSize(clause, 165)
    doc.text(lines, marge + 2, y)
    y += lines.length * 5.5 + 1.5
  })

  y += 5
  doc.setDrawColor(220, 220, 220)
  doc.line(marge, y, pageW - marge, y)
  y += 8

  // ===== SIGNATURES =====
  doc.setFillColor(26, 26, 24)
  doc.rect(marge, y, 170, 7, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES DES PARTIES', marge + 3, y + 5)
  y += 12

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fait à Brazzaville, le ${dateAujourdhui}`, pageW / 2, y, { align: 'center' })
  y += 10

  // Zone signatures
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 26, 24)
  doc.text('Le Bailleur', marge + 20, y, { align: 'center' })
  doc.text('Le Locataire / Acheteur', pageW - marge - 20, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(7.5)
  doc.text('(Signature et cachet)', marge + 20, y, { align: 'center' })
  doc.text('(Signature précédée de la mention "Lu et approuvé")', pageW - marge - 20, y, { align: 'center' })
  y += 18

  doc.setDrawColor(26, 26, 24)
  doc.setLineWidth(0.5)
  doc.line(marge, y, marge + 70, y)
  doc.line(pageW - marge - 70, y, pageW - marge, y)

  // ===== PIED DE PAGE =====
  doc.setFillColor(26, 26, 24)
  doc.rect(10, 275, 190, 12, 'F')
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.text('ImmoCG · Plateforme immobilière de Brazzaville, Congo · immocg.onrender.com', pageW / 2, 281, { align: 'center' })
  doc.text('Document généré automatiquement — Valide uniquement avec les signatures originales des deux parties', pageW / 2, 285, { align: 'center' })

  const nomFichier = `Contrat-ImmoCG-${(reservation.client_nom || 'client').replace(/\s/g,'-')}-${dateAujourdhui.replace(/\s/g,'-')}.pdf`
  doc.save(nomFichier)
}

window.genererContratPDF = genererContratPDF