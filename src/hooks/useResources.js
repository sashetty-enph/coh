import { useState, useEffect } from 'react'
import { resourcesApi } from '../api/resources'

export const useResources = () => {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchResources = async () => {
    try {
      setLoading(true)
      const data = await resourcesApi.getAll()
      setResources(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const createResource = async (resource) => {
    try {
      const created = await resourcesApi.create(resource)
      setResources([...resources, created])
      return created
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateResource = async (id, updates) => {
    try {
      const updated = await resourcesApi.update(id, updates)
      setResources(resources.map(r => r.id === id ? updated : r))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteResource = async (id) => {
    try {
      await resourcesApi.delete(id)
      setResources(resources.filter(r => r.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    resources,
    loading,
    error,
    refresh: fetchResources,
    createResource,
    updateResource,
    deleteResource
  }
}
