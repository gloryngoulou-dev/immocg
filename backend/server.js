const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

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
}))
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com; frame-src https://www.youtube.com;"
  )
  next()
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

app.use('/biens', biensRoutes)
app.use('/upload', uploadRoutes)
app.use('/upload-video', uploadVideoRoutes)
app.use('/auth', authRoutes)
app.use('/contact', contactRoutes)

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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})