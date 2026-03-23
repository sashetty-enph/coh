import { useState, useEffect } from 'react'
import { campaignsApi } from '../api/campaigns'

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const data = await campaignsApi.getAll()
      setCampaigns(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const createCampaign = async (campaign) => {
    try {
      const created = await campaignsApi.create(campaign)
      setCampaigns([created, ...campaigns])
      return created
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateCampaign = async (id, updates) => {
    try {
      const updated = await campaignsApi.update(id, updates)
      setCampaigns(campaigns.map(c => c.id === id ? updated : c))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteCampaign = async (id) => {
    try {
      await campaignsApi.delete(id)
      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    campaigns,
    loading,
    error,
    refresh: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign
  }
}
