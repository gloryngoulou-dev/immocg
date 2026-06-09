// ========== GÉNÉRATEUR DE CONTRAT PDF ==========
// Utilise jsPDF chargé via CDN

function genererContratPDF(reservation, bien) {
  // jsPDF doit être chargé — on charge dynamiquement si absent
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

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const typeContrat = reservation.type_reservation === 'achat'
    ? 'PROMESSE DE VENTE' : reservation.type_reservation === 'location_jour'
    ? 'CONTRAT DE LOCATION COURTE DURÉE' : 'CONTRAT DE LOCATION'

  // ===== EN-TÊTE =====
  doc.setFillColor(26, 26, 24)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(201, 150, 58)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('ImmoCG', 20, 18)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Plateforme immobilière de Brazzaville — Congo', 20, 26)
  doc.text(`Réf: IMC-${String(reservation.id).substring(0,8).toUpperCase()}`, 150, 18)
  doc.text(`Date: ${dateAujourdhui}`, 150, 26)

  // ===== TITRE =====
  doc.setTextColor(26, 26, 24)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(typeContrat, 105, 50, { align: 'center' })
  doc.setDrawColor(201, 150, 58)
  doc.setLineWidth(0.8)
  doc.line(20, 54, 190, 54)

  // ===== PARTIES =====
  let y = 65

  // Bailleur
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('BAILLEUR / VENDEUR', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`Agence : ${bien.contact_nom || 'ImmoCG'}`, 20, y); y += 6
  doc.text(`Téléphone : ${bien.contact_tel || '—'}`, 20, y); y += 6
  doc.text(`Email : ${bien.contact_email || '—'}`, 20, y); y += 10

  // Locataire
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('LOCATAIRE / ACHETEUR', 20, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`Nom : ${reservation.client_nom}`, 20, y); y += 6
  doc.text(`Téléphone : ${reservation.client_tel}`, 20, y); y += 6
  if (reservation.client_email) {
    doc.text(`Email : ${reservation.client_email}`, 20, y); y += 6
  }
  y += 6

  // Ligne séparation
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(20, y, 190, y); y += 10

  // ===== BIEN =====
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.setFontSize(11)
  doc.text('BIEN IMMOBILIER', 20, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`Type : ${bien.type || '—'}`, 20, y); y += 6
  doc.text(`Adresse : ${bien.quartier}, ${bien.ville}`, 20, y); y += 6
  doc.text(`Surface : ${bien.surface || '—'} m²   Chambres : ${bien.chambres || '—'}`, 20, y); y += 6

  const prixLabel = reservation.type_reservation === 'location_jour'
    ? `Prix : ${parseInt(bien.prix_jour || 0).toLocaleString('fr-FR')} FCFA / nuit`
    : `Loyer / Prix : ${parseInt(bien.prix || 0).toLocaleString('fr-FR')} FCFA`
  doc.text(prixLabel, 20, y); y += 10

  // Dates
  if (reservation.date_souhaitee) {
    doc.text(`Date d'entrée / visite : ${new Date(reservation.date_souhaitee).toLocaleDateString('fr-FR')}`, 20, y); y += 6
  }
  if (reservation.date_depart) {
    doc.text(`Date de départ : ${new Date(reservation.date_depart).toLocaleDateString('fr-FR')}`, 20, y); y += 6
  }
  y += 4

  doc.line(20, y, 190, y); y += 10

  // ===== CLAUSES =====
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(201, 150, 58)
  doc.text('CLAUSES ET CONDITIONS', 20, y); y += 8
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(10)

  const clauses = [
    '1. Le bailleur s\'engage à mettre le bien à disposition dans l\'état décrit dans l\'annonce.',
    '2. Le locataire dispose de 48h pour confirmer sa présence après validation de la demande.',
    '3. L\'agence dispose de 24h pour valider ou refuser toute demande de visite ou réservation.',
    '4. En cas de non-correspondance avec les critères annoncés, annulation sans frais.',
    '5. Une caution remboursable est exigée à l\'entrée dans les lieux.',
    '6. Tout dommage constaté à la sortie sera déduit de la caution.',
    '7. Le présent contrat est régi par le droit congolais en vigueur.',
  ]

  clauses.forEach(clause => {
    const lines = doc.splitTextToSize(clause, 170)
    doc.text(lines, 20, y)
    y += lines.length * 6 + 2
  })

  y += 6
  doc.line(20, y, 190, y); y += 12

  // ===== SIGNATURES =====
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  doc.text('Fait à Brazzaville, le ' + dateAujourdhui, 105, y, { align: 'center' }); y += 15

  doc.text('Le Bailleur', 50, y, { align: 'center' })
  doc.text('Le Locataire', 160, y, { align: 'center' }); y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('Signature et cachet', 50, y, { align: 'center' })
  doc.text('Signature', 160, y, { align: 'center' }); y += 20

  doc.setDrawColor(100, 100, 100)
  doc.line(20, y, 80, y)
  doc.line(130, y, 190, y)

  // ===== PIED DE PAGE =====
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('ImmoCG — immocg.onrender.com — contact@immocg.com', 105, 287, { align: 'center' })
  doc.text('Document généré automatiquement — non valide sans signatures originales', 105, 292, { align: 'center' })

  // Télécharger
  const nomFichier = `contrat-immocg-${reservation.client_nom.replace(/\s/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(nomFichier)
}

window.genererContratPDF = genererContratPDF