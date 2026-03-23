import { api } from './client'

export const configApi = {
  get: (key) => 
    api.get(`/api/config/${key}`),
  
  set: (key, value) => 
    api.put(`/api/config/${key}`, value),
}
