import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getMopsTickets, getMopsTicketById, upsertMopsTicket, deleteMopsTicket, addAuditLog, getCampaignById, upsertCampaign } from '../db.js'
import { calculateDeviation } from '../lib/sla.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const tickets = getMopsTickets()
    res.json(tickets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const ticket = getMopsTicketById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ error: 'MOPS ticket not found' })
    }
    res.json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const ticket = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString()
    }
    
    upsertMopsTicket(ticket)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'mops',
      entityId: ticket.id,
      action: 'created',
      performedBy: req.body.performedBy || 'system',
      newValue: ticket
    })
    
    res.json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = getMopsTicketById(req.params.id)
    const ticket = {
      ...existing,
      ...req.body,
      id: req.params.id
    }
    
    // If status changed to Done, calculate deviation
    if (ticket.jiraStatus === 'Done' && existing.jiraStatus !== 'Done') {
      const campaign = getCampaignById(ticket.campaignId)
      if (campaign && campaign.estimatedEndDate) {
        const actualEndDate = new Date().toISOString().split('T')[0]
        const deviationDays = calculateDeviation(campaign.estimatedEndDate, actualEndDate)
        
        // Update campaign with actual end date and deviation
        upsertCampaign({
          ...campaign,
          actualEndDate,
          deviationDays,
          status: 'completed'
        })
      }
    }
    
    upsertMopsTicket(ticket)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'mops',
      entityId: ticket.id,
      action: 'updated',
      performedBy: req.body.performedBy || 'system',
      previousValue: existing,
      newValue: ticket
    })
    
    res.json(ticket)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const existing = getMopsTicketById(req.params.id)
    deleteMopsTicket(req.params.id)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'mops',
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
