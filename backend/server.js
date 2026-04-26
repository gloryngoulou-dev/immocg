const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, '../frontend')))

app.get('/bien', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/bien.html'))
})

const biensRoutes = require('./routes/biens')
const uploadRoutes = require('./routes/upload')

app.use('/biens', biensRoutes)
app.use('/upload', uploadRoutes)

app.get('/api', (req, res) => {
  res.json({ message: 'Serveur ImmoCG fonctionne !' })
})

const uploadVideoRoutes = require('./routes/upload-video')
app.use('/upload-video', uploadVideoRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})