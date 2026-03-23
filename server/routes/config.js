import express from 'express'
import { getConfig, setConfig } from '../db.js'

const router = express.Router()

router.get('/:key', (req, res) => {
  try {
    const value = getConfig(req.params.key)
    res.json(value || {})
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:key', (req, res) => {
  try {
    setConfig(req.params.key, req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
