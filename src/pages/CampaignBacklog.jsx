import { useState } from 'react'
import { FolderKanban, Search, RefreshCw, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import { jiraApi } from '../api/jira'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import SlaIndicator from '../components/SlaIndicator'
import { CAMPAIGN_STATUSES, PRIORITIES, MOPS_STATUSES } from '../lib/constants'

const CampaignBacklog = () => {
  const { campaigns, loading, refresh } = useCampaigns()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [expandedCampaigns, setExpandedCampaigns] = useState(new Set())
  const [syncing, setSyncing] = useState(false)

  const toggleExpand = (campaignId) => {
    const newExpanded = new Set(expandedCampaigns)
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId)
    } else {
      newExpanded.add(campaignId)
    }
    setExpandedCampaigns(newExpanded)
  }

  const syncAllMops = async () => {
    setSyncing(true)
    try {
      const allMopsTickets = campaigns.flatMap(c => c.mopsTickets || [])
      for (const ticket of allMopsTickets) {
        if (ticket.jiraKey) {
          try {
            await jiraApi.syncMops(ticket.id)
          } catch (err) {
            console.error(`Failed to sync ${ticket.jiraKey}:`, err)
          }
        }
      }
      await refresh()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || campaign.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading campaigns...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campaign Backlog</h1>
        <p className="text-gray-500 mt-1">All campaigns with status, SLA tracking, and MOPS tickets</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        >
          <option value="all">All Statuses</option>
          {CAMPAIGN_STATUSES.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)} 
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        >
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
        </select>
        <button
          onClick={syncAllMops}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          Sync MOPS
        </button>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="space-y-4">
          {filteredCampaigns.map(campaign => {
            const isExpanded = expandedCampaigns.has(campaign.id)
            const hasMops = campaign.mopsTickets && campaign.mopsTickets.length > 0
            
            return (
              <div key={campaign.id} className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {campaign.jiraKey && (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                            {campaign.jiraKey}
                          </span>
                        )}
                        <StatusBadge status={campaign.status} statuses={CAMPAIGN_STATUSES} />
                        <PriorityBadge priority={campaign.priority} />
                        {campaign.slaDate && <SlaIndicator slaDate={campaign.slaDate} status="on_track" />}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{campaign.title}</h3>
                      {campaign.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{campaign.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Raised by: {campaign.raisedBy || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(campaign.raisedDate || campaign.createdAt).toLocaleDateString()}</span>
                        {hasMops && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => toggleExpand(campaign.id)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {campaign.mopsTickets.length} MOPS ticket{campaign.mopsTickets.length > 1 ? 's' : ''}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && hasMops && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-2">
                      {campaign.mopsTickets.map(ticket => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {ticket.jiraKey && (
                                <a
                                  href={`https://yourcompany.atlassian.net/browse/${ticket.jiraKey}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-mono bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-medium hover:bg-blue-100 flex items-center gap-1"
                                >
                                  {ticket.jiraKey}
                                  <ExternalLink size={10} />
                                </a>
                              )}
                              <StatusBadge status={ticket.jiraStatus} statuses={MOPS_STATUSES} />
                            </div>
                            <div className="text-sm text-gray-900">{ticket.summary}</div>
                            {ticket.storyPoints && (
                              <div className="text-xs text-gray-500 mt-1">{ticket.storyPoints}h estimated</div>
                            )}
                          </div>
                          {ticket.lastSyncedAt && (
                            <div className="text-xs text-gray-400 ml-4">
                              Synced {new Date(ticket.lastSyncedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-4">
            <FolderKanban className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No campaigns found</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Import campaigns from Jira to get started'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CampaignBacklog
