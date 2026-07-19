const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  logger.error('JWT_SECRET manquant ou trop court (32 caractères minimum)')
  process.exit(1)
}

/**
 * Middleware d'authentification — vérifie le cookie httpOnly 'immocg_token'
 * (ou un header Authorization: Bearer <token> en secours, ex. pour des clients API).
 * Attache l'utilisateur décodé à req.user.
 */
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
    logger.warn('Token invalide ou expiré', { error: err.message })
    return res.status(401).json({ success: false, message: 'Session expirée — veuillez vous reconnecter' })
  }
}

/**
 * Middleware de vérification de rôle — à utiliser APRÈS verifierToken.
 * Usage : router.delete('/:id', verifierToken, authorize('admin'), ...)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non connecté' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé' })
    }
    next()
  }
}

// Alias pratique pour le cas le plus fréquent (admin uniquement)
const requireAdmin = authorize('admin')

module.exports = { verifierToken, authorize, requireAdmin, JWT_SECRET }
