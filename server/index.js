import express from 'express'
import cors from 'cors'
import resourcesRouter from './routes/resources.js'
import campaignsRouter from './routes/campaigns.js'
import mopsRouter from './routes/mops.js'
import capacityRouter from './routes/capacity.js'
import configRouter from './routes/config.js'
import jiraRouter from './routes/jira.js'

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Routes
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

app.listen(PORT, () => {
  console.log(`🚀 Campaign Operations Hub API running on http://localhost:${PORT}`)
})
