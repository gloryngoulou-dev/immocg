const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET || 'immocg_secret_2026'

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body

  if (!email || !mot_de_passe) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' })
  }

  if (!user.actif) {
    return res.status(401).json({ success: false, message: 'Compte désactivé' })
  }

  // Vérifier le mot de passe (texte simple pour l'instant)
  const motDePasseOk = mot_de_passe === user.mot_de_passe

  if (!motDePasseOk) {
    return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' })
  }

  // Créer le token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      nom_agence: user.nom_agence
    }
  })
})

// POST /auth/register — pour créer un compte agence
router.post('/register', async (req, res) => {
  const { nom, email, mot_de_passe, telephone, nom_agence } = req.body

  if (!nom || !email || !mot_de_passe || !nom_agence) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' })
  }

  // Vérifier si email existe déjà
  const { data: existant } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existant) {
    return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' })
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ nom, email, mot_de_passe, telephone, nom_agence, role: 'agence', actif: false }])
    .select()

  if (error) {
    return res.status(500).json({ success: false, message: error.message })
  }

  res.json({
    success: true,
    message: 'Compte créé ! En attente de validation par ImmoCG.'
  })
})

// Middleware pour vérifier le token
function verifierToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, message: 'Token manquant' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide' })
  }
}

// GET /auth/me — récupérer l'utilisateur connecté
router.get('/me', verifierToken, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, nom, email, role, nom_agence, telephone')
    .eq('id', req.user.id)
    .single()

  res.json({ success: true, user })
})

module.exports = { router, verifierToken }