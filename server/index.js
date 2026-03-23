import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import resourcesRouter from './routes/resources.js'
import campaignsRouter from './routes/campaigns.js'
import mopsRouter from './routes/mops.js'
import capacityRouter from './routes/capacity.js'
import configRouter from './routes/config.js'
import jiraRouter from './routes/jira.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// API Routes
app.use('/api/resources', resourcesRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/mops', mopsRouter)
app.use('/api/capacity', capacityRouter)
app.use('/api/config', configRouter)
app.use('/api/jira', jiraRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../dist')))

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Campaign Operations Hub running on http://0.0.0.0:${PORT}`)
})
