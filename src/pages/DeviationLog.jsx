import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import StatusBadge from '../components/StatusBadge'
import { CAMPAIGN_STATUSES } from '../lib/constants'

const DeviationLog = () => {
  const { campaigns, loading } = useCampaigns()

  const campaignsWithDeviation = campaigns.filter(c => 
    c.deviationDays !== null && c.deviationDays !== undefined && c.actualEndDate
  ).sort((a, b) => Math.abs(b.deviationDays) - Math.abs(a.deviationDays))

  const totalDeviations = campaignsWithDeviation.length
  const delayedCount = campaignsWithDeviation.filter(c => c.deviationDays > 0).length
  const onTimeCount = campaignsWithDeviation.filter(c => c.deviationDays === 0).length
  const earlyCount = campaignsWithDeviation.filter(c => c.deviationDays < 0).length
  const avgDeviation = totalDeviations > 0 
    ? Math.round(campaignsWithDeviation.reduce((sum, c) => sum + c.deviationDays, 0) / totalDeviations * 10) / 10
    : 0

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Deviation Log</h1>
        <p className="text-gray-500 mt-1">Track campaign delays and root causes for continuous improvement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Completed</span>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalDeviations}</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Delayed</span>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{delayedCount}</p>
          <p className="text-xs text-gray-500 mt-1">{totalDeviations > 0 ? Math.round((delayedCount / totalDeviations) * 100) : 0}% of total</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">On Time</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{onTimeCount}</p>
          <p className="text-xs text-gray-500 mt-1">{totalDeviations > 0 ? Math.round((onTimeCount / totalDeviations) * 100) : 0}% of total</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Deviation</span>
            <AlertTriangle className={`h-4 w-4 ${avgDeviation > 0 ? 'text-red-500' : avgDeviation < 0 ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${avgDeviation > 0 ? 'text-red-600' : avgDeviation < 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {avgDeviation > 0 ? '+' : ''}{avgDeviation} days
          </p>
        </div>
      </div>

      {campaignsWithDeviation.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deviation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Root Cause</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignsWithDeviation.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      {campaign.jiraKey && (
                        <div className="text-xs text-gray-500 mt-0.5">{campaign.jiraKey}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={campaign.status} statuses={CAMPAIGN_STATUSES} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {campaign.estimatedEndDate ? new Date(campaign.estimatedEndDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {campaign.actualEndDate ? new Date(campaign.actualEndDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.deviationDays > 0 ? 'bg-red-100 text-red-800' :
                      campaign.deviationDays < 0 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.deviationDays > 0 ? '+' : ''}{campaign.deviationDays} days
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-md">
                      {campaign.deviationRootCause || (
                        <span className="text-gray-400 italic">No root cause provided</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No completed campaigns yet</p>
          <p className="text-sm text-gray-500 mt-1">Deviation tracking will appear here once campaigns are completed</p>
        </div>
      )}
    </div>
  )
}

export default DeviationLog
