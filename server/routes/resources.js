import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getResources, getAllResources, getResourceById, upsertResource, deleteResource, addAuditLog } from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true'
    const resources = includeInactive ? getAllResources() : getResources()
    res.json(resources)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const resource = getResourceById(req.params.id)
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' })
    }
    res.json(resource)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const resource = {
      id: uuidv4(),
      ...req.body,
      isActive: 1
    }
    upsertResource(resource)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'resource',
      entityId: resource.id,
      action: 'created',
      performedBy: req.body.performedBy || 'system',
      newValue: resource
    })
    
    res.json(resource)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = getResourceById(req.params.id)
    const resource = {
      id: req.params.id,
      ...req.body
    }
    upsertResource(resource)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'resource',
      entityId: resource.id,
      action: 'updated',
      performedBy: req.body.performedBy || 'system',
      previousValue: existing,
      newValue: resource
    })
    
    res.json(resource)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const existing = getResourceById(req.params.id)
    deleteResource(req.params.id)
    
    addAuditLog({
      id: uuidv4(),
      entityType: 'resource',
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
