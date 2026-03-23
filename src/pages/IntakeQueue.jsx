import { useState } from 'react'
import { Inbox, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useJiraConfig } from '../hooks/useJiraConfig'
import { useCampaigns } from '../hooks/useCampaigns'
import { jiraApi } from '../api/jira'
import PriorityBadge from '../components/PriorityBadge'
import ScopingPanel from './ScopingPanel'

const IntakeQueue = () => {
  const { isConnected } = useJiraConfig()
  const { campaigns, refresh } = useCampaigns()
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const pendingCampaigns = campaigns.filter(c => c.status === 'pending_scoping')

  if (selectedCampaign) {
    return (
      <ScopingPanel
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
        onComplete={() => {
          setSelectedCampaign(null)
          refresh()
        }}
      />
    )
  }

  const handleImport = async () => {
    setImporting(true)
    setImportStatus(null)
    
    try {
      const result = await jiraApi.importEncam()
      setImportStatus({ type: 'success', message: `Successfully imported ${result.imported} campaign(s)` })
      await refresh()
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message })
    } finally {
      setImporting(false)
    }
  }

  if (!isConnected) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Intake Queue</h1>
          <p className="text-gray-500 mt-1">Import ENCAM tickets from Jira</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="p-3 bg-amber-100 rounded-lg w-fit mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <p className="font-semibold text-amber-900">Jira Not Connected</p>
          <p className="text-sm text-amber-700 mt-1">Please configure Jira integration in Settings to import campaigns</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intake Queue</h1>
          <p className="text-gray-500 mt-1">Import and review ENCAM campaign tickets from Jira</p>
        </div>
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Import from Jira
        </button>
      </div>

      {importStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          importStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{importStatus.message}</span>
        </div>
      )}

      {pendingCampaigns.length > 0 ? (
        <div className="space-y-4">
          {pendingCampaigns.map(campaign => (
            <div key={campaign.id} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {campaign.jiraKey && (
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                        {campaign.jiraKey}
                      </span>
                    )}
                    <PriorityBadge priority={campaign.priority} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{campaign.title}</h3>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Raised by: {campaign.raisedBy || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(campaign.raisedDate || campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCampaign(campaign)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Scope Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-4">
            <Inbox className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No pending campaigns</p>
          <p className="text-sm text-gray-500 mt-1">Import tickets from Jira to get started</p>
        </div>
      )}
    </div>
  )
}

export default IntakeQueue
