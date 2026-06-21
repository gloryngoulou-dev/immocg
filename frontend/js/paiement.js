// ========== MODAL SAISIE INFOS PAIEMENT ==========
// Remplace les anciens prompt() par un vrai formulaire

function saisirInfosPaiement(montantSuggere) {
  return new Promise((resolve) => {
    const ancien = document.getElementById('modal-paiement')
    if (ancien) ancien.remove()

    const modal = document.createElement('div')
    modal.id = 'modal-paiement'
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:1rem;'

    const box = document.createElement('div')
    box.style.cssText = 'background:#fff;border-radius:16px;padding:2rem;max-width:440px;width:100%;max-height:90vh;overflow-y:auto;position:relative;'

    const titre = document.createElement('h2')
    titre.style.cssText = 'font-size:18px;font-weight:700;color:#1A1A18;margin-bottom:0.3rem;'
    titre.textContent = '💳 Informations de paiement'

    const sous = document.createElement('p')
    sous.style.cssText = 'font-size:13px;color:#888;margin-bottom:1.2rem;'
    sous.textContent = 'À transmettre au client avec la confirmation'

    // Mode
    const lblMode = document.createElement('label')
    lblMode.style.cssText = 'font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px;'
    lblMode.textContent = 'Mode de paiement *'
    const selMode = document.createElement('select')
    selMode.style.cssText = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:0.8rem;box-sizing:border-box;'
    ;['Mobile Money', 'Virement bancaire', 'Espèces'].forEach(m => {
      const opt = document.createElement('option')
      opt.value = m; opt.textContent = m
      selMode.appendChild(opt)
    })

    // Montant
    const lblMontant = document.createElement('label')
    lblMontant.style.cssText = 'font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px;'
    lblMontant.textContent = 'Montant à régler par le client (FCFA) *'
    const inpMontant = document.createElement('input')
    inpMontant.type = 'number'
    inpMontant.value = montantSuggere ? String(montantSuggere) : ''
    inpMontant.placeholder = 'Ex: 15000'
    inpMontant.style.cssText = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:0.3rem;box-sizing:border-box;'

    const hintMontant = document.createElement('p')
    hintMontant.style.cssText = 'font-size:11px;color:#aaa;margin-bottom:0.8rem;'
    hintMontant.textContent = montantSuggere ? `Montant suggéré : ${montantSuggere.toLocaleString('fr-FR')} FCFA` : ''

    // Téléphone Mobile Money
    const lblTel = document.createElement('label')
    lblTel.style.cssText = 'font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px;'
    lblTel.textContent = 'Numéro Mobile Money pour réception *'
    const inpTel = document.createElement('input')
    inpTel.type = 'tel'
    inpTel.value = '+242 06 883 4146'
    inpTel.style.cssText = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:0.8rem;box-sizing:border-box;'

    // Référence
    const lblRef = document.createElement('label')
    lblRef.style.cssText = 'font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px;'
    lblRef.textContent = 'Référence de paiement (optionnel)'
    const inpRef = document.createElement('input')
    inpRef.type = 'text'
    inpRef.placeholder = 'Ex: IMC-XXXX'
    inpRef.style.cssText = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:0.8rem;box-sizing:border-box;'

    // Instructions
    const lblInstr = document.createElement('label')
    lblInstr.style.cssText = 'font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:4px;'
    lblInstr.textContent = 'Instructions pour le client'
    const inpInstr = document.createElement('textarea')
    inpInstr.rows = 2
    inpInstr.value = 'Airtel Money / MTN Mobile Money — envoyez la preuve par WhatsApp'
    inpInstr.style.cssText = 'width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:none;margin-bottom:1rem;box-sizing:border-box;'

    const erreur = document.createElement('div')
    erreur.style.cssText = 'color:#c0392b;font-size:13px;display:none;margin-bottom:0.5rem;'

    const btnValider = document.createElement('button')
    btnValider.style.cssText = 'width:100%;background:#C9963A;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;'
    btnValider.textContent = '✅ Confirmer et valider la réservation'

    const btnAnnuler = document.createElement('button')
    btnAnnuler.style.cssText = 'width:100%;background:none;border:1px solid #ddd;color:#555;padding:10px;border-radius:10px;font-size:14px;cursor:pointer;margin-top:8px;'
    btnAnnuler.textContent = 'Annuler'
    btnAnnuler.addEventListener('click', () => {
      modal.remove()
      resolve(null)
    })

    box.appendChild(titre); box.appendChild(sous)
    box.appendChild(lblMode); box.appendChild(selMode)
    box.appendChild(lblMontant); box.appendChild(inpMontant); box.appendChild(hintMontant)
    box.appendChild(lblTel); box.appendChild(inpTel)
    box.appendChild(lblRef); box.appendChild(inpRef)
    box.appendChild(lblInstr); box.appendChild(inpInstr)
    box.appendChild(erreur); box.appendChild(btnValider); box.appendChild(btnAnnuler)
    modal.appendChild(box)
    document.body.appendChild(modal)

    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove()
        resolve(null)
      }
    })

    btnValider.addEventListener('click', () => {
      const montant = parseInt(inpMontant.value)
      if (Number.isNaN(montant) || montant < 0) {
        erreur.textContent = 'Veuillez entrer un montant valide'
        erreur.style.display = 'block'
        return
      }
      if (!selMode.value) {
        erreur.textContent = 'Veuillez choisir un mode de paiement'
        erreur.style.display = 'block'
        return
      }

      modal.remove()
      resolve({
        mode: selMode.value,
        montant_fcfa: montant,
        reference: inpRef.value.trim(),
        details: inpInstr.value.trim(),
        telephone: inpTel.value.trim()
      })
    })
  })
}

window.saisirInfosPaiement = saisirInfosPaiement