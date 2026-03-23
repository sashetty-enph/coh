import { useState, useEffect } from 'react'
import { configApi } from '../api/config'

export const useJiraConfig = () => {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const data = await configApi.get('jiraConfig')
      setConfig(data || {})
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const saveConfig = async (newConfig) => {
    try {
      await configApi.set('jiraConfig', newConfig)
      setConfig(newConfig)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const isConnected = () => {
    return !!(config.domain && config.email && config.apiToken)
  }

  return {
    config,
    loading,
    error,
    saveConfig,
    refresh: fetchConfig,
    isConnected: isConnected()
  }
}
