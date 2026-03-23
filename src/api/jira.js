import { api } from './client'

export const jiraApi = {
  proxy: (domain, endpoint, method = 'GET', auth, body = null) => 
    api.post('/api/jira/proxy', { domain, endpoint, method, auth, body }),
  
  importEncam: () => 
    api.post('/api/jira/import-encam'),
  
  createMops: (data) => 
    api.post('/api/jira/create-mops', data),
  
  syncMops: (mopsId) => 
    api.post(`/api/jira/sync-mops/${mopsId}`),
}
