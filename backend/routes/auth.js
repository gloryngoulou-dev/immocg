const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { createClient } = require('@supabase/supabase-js')
const { hashPassword, verifyPassword, isHashed } = require('../utils/password')
const Joi = require('joi') // À installer : npm install joi

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  process.stderr.write('ERREUR DEMARRAGE: variable JWT_SECRET manquante\n')
  process.exit(1)
}

const { envoyerEmailActivation, envoyerEmailRefus, buildWhatsAppUrl } = require('./email')

// ========== SCHÉMAS DE VALIDATION ==========

const loginSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  mot_de_passe: Joi.string().min(6).required()
})

const registerSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required().max(255),
  mot_de_passe: Joi.string().min(6).required(),
  telephone: Joi.string().pattern(/^[0-9+\-\s]{10,20}$/).allow(''),
  nom_agence: Joi.string().min(2).max(100).required()
})

const updateUserSchema = Joi.object({
  actif: Joi.boolean().required()
})

const userIdParamSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.string().uuid(),
    Joi.number().integer().positive()
  ).required()
})

// ========== FONCTIONS UTILITAIRES ==========

async function upgradePasswordIfNeeded(userId, plainPassword) {
  if (!userId || !plainPassword) return
  const hashed = await hashPassword(plainPassword)
  const { error } = await supabase
    .from('users')
    .update({ mot_de_passe: hashed })
    .eq('id', userId)
  if (error) { /* upgrade silencieux — erreur non critique */ }
}

// ========== ROUTES ==========

// POST /auth/login
router.post('/login', async (req, res) => {
  // 1. Validation des entrées
  const { error, value } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      details: error.details[0].message 
    })
  }

  const { email, mot_de_passe } = value

  try {
    // 2. Requête paramétrée (Supabase le fait automatiquement avec .eq)
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle() // Utiliser maybeSingle() au lieu de single() pour éviter erreur 406

    if (dbError || !user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' })
    }

    if (!user.actif) {
      return res.status(401).json({ success: false, message: 'Compte en attente de validation ou désactivé' })
    }

    const motDePasseOk = await verifyPassword(mot_de_passe, user.mot_de_passe)

    if (!motDePasseOk) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' })
    }

    if (!isHashed(user.mot_de_passe)) {
      await upgradePasswordIfNeeded(user.id, mot_de_passe)
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Envoi du token via cookie HttpOnly (inaccessible au JavaScript)
    res.cookie('immocg_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      success: true,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        nom_agence: user.nom_agence,
      },
    })
  } catch (err) {
    console.error('Erreur login:', err)
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
  }
})

// POST /auth/register
router.post('/register', async (req, res) => {
  // 1. Validation des entrées
  const { error, value } = registerSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      details: error.details[0].message 
    })
  }

  const { nom, email, mot_de_passe, telephone, nom_agence } = value

  try {
    // 2. Vérifier si l'email existe déjà
    const { data: existant } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existant) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' })
    }

    const motDePasseHash = await hashPassword(mot_de_passe)

    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        nom,
        email,
        mot_de_passe: motDePasseHash,
        telephone: telephone || null,
        nom_agence,
        role: 'agence',
        actif: false,
      }])

    if (insertError) {
      console.error('Erreur insertion:', insertError)
      return res.status(500).json({ success: false, message: 'Erreur lors de la création du compte' })
    }

    res.json({
      success: true,
      message: 'Compte créé ! En attente de validation par ImmoCG.',
    })
  } catch (err) {
    console.error('Erreur register:', err)
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
  }
})

// Middleware de vérification token
function verifierToken(req, res, next) {
  const token = req.cookies?.immocg_token || req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ success: false, message: 'Non connecté — veuillez vous reconnecter' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expirée — veuillez vous reconnecter' })
  }
}

// GET /auth/me
router.get('/me', verifierToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, role, nom_agence, telephone')
      .eq('id', req.user.id)
      .maybeSingle()

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    }

    res.json({ success: true, user })
  } catch (err) {
    console.error('Erreur me:', err)
    res.status(500).json({ success: false, message: 'Erreur interne' })
  }
})

// GET /auth/users (admin only)
router.get('/users', verifierToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nom, email, role, nom_agence, telephone, actif, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, users: data })
  } catch (err) {
    console.error('Erreur users:', err)
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération' })
  }
})

// PATCH /auth/users/:id (admin only)
router.patch('/users/:id', verifierToken, async (req, res) => {
  // 1. Vérifier rôle admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' })
  }

  // 2. Valider l'ID dans les paramètres
  const { error: idError, value: idValue } = userIdParamSchema.validate({ id: req.params.id })
  if (idError) {
    return res.status(400).json({ success: false, message: 'ID utilisateur invalide' })
  }

  // 3. Valider le corps de la requête
  const { error, value } = updateUserSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      details: error.details[0].message 
    })
  }

  const { actif } = value
  const userId = idValue.id

  try {
    // 4. Récupérer l'agence
    const { data: agence, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (selectError || !agence) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' })
    }

    // 5. Mettre à jour
    const { error: updateError } = await supabase
      .from('users')
      .update({ actif })
      .eq('id', userId)

    if (updateError) throw updateError

    // 6. Envoyer les emails (ne pas bloquer la réponse)
    let whatsapp_url = null
    if (agence) {
      if (actif) {
        await envoyerEmailActivation(agence).catch(err => console.error('Email activation échoué:', err))
        whatsapp_url = buildWhatsAppUrl(
          agence.telephone,
          `Bonjour ${agence.nom_agence}, votre compte partenaire ImmoCG a été activé ! Connectez-vous sur ${(process.env.SITE_URL || 'https://immocg.onrender.com').replace(/\/$/, '')}/login.html pour publier vos annonces.`
        )
      } else {
        await envoyerEmailRefus(agence).catch(err => console.error('Email refus échoué:', err))
      }
    }

    res.json({
      success: true,
      message: `Utilisateur ${actif ? 'activé' : 'désactivé'} avec succès`,
      whatsapp_url,
    })
  } catch (err) {
    console.error('Erreur update user:', err)
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' })
  }
})

// GET /auth/stats
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, actif')
      .eq('role', 'agence')

    if (error) throw error

    res.json({
      success: true,
      total: data.length,
      actives: data.filter(u => u.actif).length,
    })
  } catch (err) {
    console.error('Erreur stats:', err)
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' })
  }
})

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('immocg_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  res.json({ success: true, message: 'Déconnecté' })
})

module.exports = { router, verifierToken }