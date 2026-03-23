import { api } from './client'

export const mopsApi = {
  getAll: () => 
    api.get('/api/mops'),
  
  getById: (id) => 
    api.get(`/api/mops/${id}`),
  
  create: (ticket) => 
    api.post('/api/mops', ticket),
  
  update: (id, ticket) => 
    api.put(`/api/mops/${id}`, ticket),
  
  delete: (id) => 
    api.delete(`/api/mops/${id}`),
}
