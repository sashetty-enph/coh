import { api } from './client'

export const capacityApi = {
  getCapacity: (weeksAhead = 3) => 
    api.get(`/api/capacity?weeksAhead=${weeksAhead}`),
  
  getNextAvailable: (resourceId, estimatedHours) => 
    api.get(`/api/capacity/next-available?resourceId=${resourceId}&estimatedHours=${estimatedHours}`),
  
  getSuggestions: (estimatedHours, role = null) => 
    api.get(`/api/capacity/suggest?estimatedHours=${estimatedHours}${role ? `&role=${role}` : ''}`),
  
  getTeamUtilization: () => 
    api.get('/api/capacity/team-utilization'),
}
