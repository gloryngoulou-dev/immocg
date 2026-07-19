const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()
const logger = require('./utils/logger')

const app = express()
app.use(cookieParser())

const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '')
const allowedOrigins = [
  SITE_URL,
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
].filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    callback(new Error('Origine non autorisée par CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.google.com https://cdnjs.cloudflare.com; frame-src https://www.youtube.com;"
  )
  next()
})

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, { ip: req.ip })
  next()
})

// ============================================
// ⏱️ RATE LIMITING — Protection anti brute-force & spam
// ============================================

// Login/Register : max 20 tentatives par IP, par heure
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20,
  skipSuccessfulRequests: true, // Ne compte pas les logins réussis
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 1 heure.' },
})

// Contact : max 5 messages par IP, par heure (anti-spam)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Limite de messages atteinte. Réessayez plus tard.' },
})

// API générale : max 300 requêtes par IP, par 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes, réessayez dans quelques minutes.' },
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

app.get('/sitemap.xml', async (req, res) => {
  try {
    const base = SITE_URL || `${req.protocol}://${req.get('host')}`
    const staticPages = [
      { loc: `${base}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${base}/index.html`, priority: '1.0', changefreq: 'daily' },
      { loc: `${base}/apropos.html`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${base}/contact.html`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${base}/conditions.html`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${base}/register.html`, priority: '0.8', changefreq: 'monthly' },
      { loc: `${base}/blog.html`, priority: '0.6', changefreq: 'weekly' },
    ]

    const { data: biens } = await supabase
      .from('biens')
      .select('id, created_at')
      .eq('statut', 'disponible')

    const bienPages = (biens || []).map(b => ({
      loc: `${base}/bien.html?id=${b.id}`,
      priority: '0.9',
      changefreq: 'weekly',
      lastmod: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : undefined,
    }))

    const urls = [...staticPages, ...bienPages]
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    res.type('application/xml').send(xml)
  } catch {
    res.status(500).type('text/plain').send('Erreur génération sitemap')
  }
})

app.use(express.static(path.join(__dirname, '../frontend')))

app.get('/bien', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/bien.html'))
})

const biensRoutes = require('./routes/biens')
const uploadRoutes = require('./routes/upload')
const uploadVideoRoutes = require('./routes/upload-video')
const { router: authRoutes } = require('./routes/auth')
const contactRoutes = require('./routes/contact')
const reservationsRoutes = require('./routes/reservations')
const signalementsRoutes = require('./routes/signalements')
const avisRoutes = require('./routes/avis')
const transactionsRoutes = require('./routes/transactions')

// Montage des routes avec rate-limiting
app.use('/auth', authLimiter, authRoutes)
app.use('/contact', contactLimiter, contactRoutes)
app.use('/biens', apiLimiter, biensRoutes)
app.use('/upload', apiLimiter, uploadRoutes)
app.use('/upload-video', apiLimiter, uploadVideoRoutes)
app.use('/reservations', apiLimiter, reservationsRoutes)
app.use('/signalements', apiLimiter, signalementsRoutes)
app.use('/avis', apiLimiter, avisRoutes)
app.use('/transactions', apiLimiter, transactionsRoutes)

app.get('/og-image.jpg', (req, res) => {
  res.type('image/svg+xml')
  res.sendFile(path.join(__dirname, '../frontend/og-image.svg'))
})

app.get('/api', (req, res) => {
  res.json({ message: 'Serveur ImmoCG fonctionne !' })
})

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/favicon.svg'))
})

app.use((err, req, res, next) => {
  logger.error('Erreur serveur non gérée', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : err.message,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`, { port: PORT, env: process.env.NODE_ENV || 'development' })

  reservationsRoutes.expirerReservationsDepassees()
  setInterval(() => {
    reservationsRoutes.expirerReservationsDepassees()
  }, 60 * 60 * 1000)
})
