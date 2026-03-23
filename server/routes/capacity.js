import express from 'express'
import { getResourceCapacity, getNextAvailableSlot, suggestResources, getTeamUtilization } from '../lib/capacity.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const weeksAhead = parseInt(req.query.weeksAhead) || 3
    const capacity = getResourceCapacity(weeksAhead)
    res.json(capacity)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/next-available', (req, res) => {
  try {
    const { resourceId, estimatedHours } = req.query
    
    if (!resourceId || !estimatedHours) {
      return res.status(400).json({ error: 'resourceId and estimatedHours are required' })
    }
    
    const slot = getNextAvailableSlot(resourceId, parseFloat(estimatedHours))
    res.json(slot)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/suggest', (req, res) => {
  try {
    const { estimatedHours, role } = req.query
    
    if (!estimatedHours) {
      return res.status(400).json({ error: 'estimatedHours is required' })
    }
    
    const suggestions = suggestResources(parseFloat(estimatedHours), role || null)
    res.json(suggestions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/team-utilization', (req, res) => {
  try {
    const utilization = getTeamUtilization()
    res.json({ utilizationPct: Math.round(utilization * 10) / 10 })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
