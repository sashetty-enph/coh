import { FolderKanban, Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import { useResources } from '../hooks/useResources'
import StatCard from '../components/StatCard'
import { CAMPAIGN_STATUSES } from '../lib/constants'

const Dashboard = () => {
  const { campaigns, loading: campaignsLoading } = useCampaigns()
  const { resources, loading: resourcesLoading } = useResources()

  if (campaignsLoading || resourcesLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const totalCampaigns = campaigns.length
  const pendingScopingCount = campaigns.filter(c => c.status === 'pending_scoping').length
  const inProgressCount = campaigns.filter(c => c.status === 'in_progress').length
  const completedCount = campaigns.filter(c => c.status === 'completed').length

  const totalMopsTickets = campaigns.reduce((sum, c) => sum + (c.mopsTickets?.length || 0), 0)
  const completedMopsTickets = campaigns.reduce((sum, c) => 
    sum + (c.mopsTickets?.filter(m => m.jiraStatus === 'Done').length || 0), 0)

  const campaignsByStatus = CAMPAIGN_STATUSES.map(status => ({
    ...status,
    count: campaigns.filter(c => c.status === status.value).length
  }))

  const recentCampaigns = campaigns.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of campaign pipeline and team capacity</p>
      </div>

      {pendingScopingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-amber-800 text-sm">Pending Scoping</div>
            <div className="text-sm text-amber-600">{pendingScopingCount} campaign{pendingScopingCount > 1 ? 's' : ''} waiting to be scoped</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FolderKanban}
          label="Total Campaigns"
          value={totalCampaigns}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Team Members"
          value={resources.length}
          color="purple"
        />
        <StatCard
          icon={CheckCircle}
          label="MOPS Tickets"
          value={`${completedMopsTickets}/${totalMopsTickets}`}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={inProgressCount}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
          <div className="space-y-3">
            {campaignsByStatus.map(status => (
              <div key={status.value} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                  <span className="text-sm text-gray-600">{status.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
          {recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {recentCampaigns.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{campaign.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {campaign.raisedBy} • {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                      CAMPAIGN_STATUSES.find(s => s.value === campaign.status)?.color || 'bg-gray-400'
                    }`}>
                      {CAMPAIGN_STATUSES.find(s => s.value === campaign.status)?.label || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No campaigns yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h3>
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(resource => (
              <div key={resource.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: resource.color }}>
                  {resource.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
                  <p className="text-xs text-gray-500">{resource.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No team members yet. Add resources to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
