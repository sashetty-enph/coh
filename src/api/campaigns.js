import { api } from './client'

export const campaignsApi = {
  getAll: () => 
    api.get('/api/campaigns'),
  
  getById: (id) => 
    api.get(`/api/campaigns/${id}`),
  
  create: (campaign) => 
    api.post('/api/campaigns', campaign),
  
  update: (id, campaign) => 
    api.put(`/api/campaigns/${id}`, campaign),
  
  delete: (id) => 
    api.delete(`/api/campaigns/${id}`),
}
