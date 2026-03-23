import { useState } from 'react'
import { Settings as SettingsIcon, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useJiraConfig } from '../hooks/useJiraConfig'
import { jiraApi } from '../api/jira'

const Settings = () => {
  const { config, saveConfig } = useJiraConfig()
  const [formData, setFormData] = useState({
    domain: config.domain || '',
    email: config.email || '',
    apiToken: config.apiToken || '',
    sourceProject: config.sourceProject || '',
    targetProject: config.targetProject || ''
  })
  const [showToken, setShowToken] = useState(false)
  const [testStatus, setTestStatus] = useState(null)
  const [testMessage, setTestMessage] = useState('')
  const [userInfo, setUserInfo] = useState(null)

  const handleSave = async () => {
    try {
      await saveConfig(formData)
      alert('Configuration saved successfully!')
    } catch (error) {
      alert(`Failed to save: ${error.message}`)
    }
  }

  const testConnection = async () => {
    if (!formData.domain || !formData.email || !formData.apiToken) {
      setTestStatus('error')
      setTestMessage('Please fill in domain, email, and API token')
      return
    }

    setTestStatus('loading')
    setTestMessage('Testing connection...')

    try {
      let domain = formData.domain.trim()
      domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      
      const auth = btoa(`${formData.email}:${formData.apiToken}`)
      
      const data = await jiraApi.proxy(domain, '/rest/api/3/myself', 'GET', auth)

      if (data.accountId) {
        setUserInfo(data)
        setTestStatus('success')
        setTestMessage(`Connected as ${data.displayName}`)
        const updatedConfig = { ...formData, domain }
        setFormData(updatedConfig)
        await saveConfig(updatedConfig)
      } else {
        setTestStatus('error')
        setTestMessage(data.message || data.error || 'Connection failed')
        setUserInfo(null)
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage(`Connection failed: ${error.message}`)
      setUserInfo(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure Jira integration and application preferences</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0052CC">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Jira Integration</h3>
            <p className="text-sm text-gray-500">Connect to your Atlassian account to sync tickets</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Jira Domain</label>
            <input 
              type="text" 
              placeholder="yourcompany.atlassian.net" 
              value={formData.domain} 
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })} 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            />
            <p className="text-xs text-gray-400 mt-1.5">Just the domain, no https://</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
            <input 
              type="email" 
              placeholder="you@company.com" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">API Token</label>
            <div className="relative">
              <input 
                type={showToken ? 'text' : 'password'} 
                placeholder="Your Jira API token" 
                value={formData.apiToken} 
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })} 
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
              <button 
                type="button" 
                onClick={() => setShowToken(!showToken)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Get your token from{' '}
              <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                Atlassian Account Settings
              </a>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={testConnection} 
              disabled={testStatus === 'loading'} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testStatus === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Test Connection
            </button>

            {testStatus && testStatus !== 'loading' && (
              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${testStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {testStatus === 'success' ? <CheckCircle size={16} className="text-green-600 flex-shrink-0" /> : <XCircle size={16} className="text-red-600 flex-shrink-0" />}
                <span>{testMessage}</span>
              </div>
            )}

            {userInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  {userInfo.avatarUrls?.['32x32'] && <img src={userInfo.avatarUrls['32x32']} alt="" className="w-8 h-8 rounded-lg" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{userInfo.displayName}</div>
                    <div className="text-xs text-gray-500">{userInfo.emailAddress}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {testStatus === 'success' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Project Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">Configure which Jira projects to sync with</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Source Project (ENCAM)</label>
              <input 
                type="text" 
                placeholder="e.g., ENCAM" 
                value={formData.sourceProject} 
                onChange={(e) => setFormData({ ...formData, sourceProject: e.target.value })} 
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
              <p className="text-xs text-gray-400 mt-1.5">Project key to import campaign tickets from</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Target Project (MOPS)</label>
              <input 
                type="text" 
                placeholder="e.g., MOPS" 
                value={formData.targetProject} 
                onChange={(e) => setFormData({ ...formData, targetProject: e.target.value })} 
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
              <p className="text-xs text-gray-400 mt-1.5">Project key to create MOPS tickets in</p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button 
              onClick={handleSave} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <CheckCircle size={15} />
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
