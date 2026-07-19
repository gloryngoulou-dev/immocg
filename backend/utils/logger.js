/**
 * Logger sécurisé pour ImmoCG
 * - Masque les données sensibles en production
 * - Format structuré (JSON)
 * - Niveaux de log configurables (LOG_LEVEL dans .env : error|warn|info|debug)
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info']

// Données à masquer dans les logs
const SENSITIVE_KEYS = [
  'password', 'mot_de_passe', 'secret', 'token', 'key', 'authorization',
  'cookie', 'creditcard', 'ssn', 'jwt'
]

function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data

  const masked = { ...data }
  Object.keys(masked).forEach(key => {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      masked[key] = '***MASQUÉ***'
    }
  })
  return masked
}

const logger = {
  error: (message, context = {}) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        context: process.env.NODE_ENV === 'production'
          ? maskSensitiveData(context)
          : context
      }))
    }
  },

  warn: (message, context = {}) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        context: maskSensitiveData(context)
      }))
    }
  },

  info: (message, context = {}) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        context: maskSensitiveData(context)
      }))
    }
  },

  debug: (message, context = {}) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.debug(JSON.stringify({
        level: 'debug',
        timestamp: new Date().toISOString(),
        message,
        context: maskSensitiveData(context)
      }))
    }
  }
}

module.exports = logger
