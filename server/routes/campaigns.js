import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getCampaigns, getCampaignById, upsertCampaign, deleteCampaign, addAuditLog } from '../db.js'
import { calculateSlaDate } from '../lib/sla.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const campaigns = getCampaigns()
    res.json(campaigns)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }
    res.json(campaign)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const campaign = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Calculate SLA if complexity and raisedDate provided
    if (campaign.complexity && campaign.raisedDate) {
      campaign.slaDate = calculateSlaDate(
        campaign.raisedDate,
        campaign.complexity,
        campaign.estimatedEndDate
      )
    }
    
    upsertCampaign(campaign)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'campaign',
      entityId: campaign.id,
      action: 'created',
      performedBy: req.body.performedBy || 'system',
      newValue: campaign
    })
    
    res.json(getCampaignById(campaign.id))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = getCampaignById(req.params.id)
    const campaign = {
      id: req.params.id,
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    }
    
    // Recalculate SLA if relevant fields changed
    if (campaign.complexity && campaign.raisedDate) {
      campaign.slaDate = calculateSlaDate(
        campaign.raisedDate,
        campaign.complexity,
        campaign.estimatedEndDate
      )
    }
    
    upsertCampaign(campaign)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'campaign',
      entityId: campaign.id,
      action: 'updated',
      performedBy: req.body.performedBy || 'system',
      previousValue: existing,
      newValue: campaign
    })
    
    res.json(getCampaignById(campaign.id))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const existing = getCampaignById(req.params.id)
    deleteCampaign(req.params.id)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'campaign',
      entityId: req.params.id,
      action: 'deleted',
      performedBy: req.body.performedBy || 'system',
      previousValue: existing
    })
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
