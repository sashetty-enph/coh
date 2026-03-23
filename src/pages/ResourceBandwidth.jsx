import { useState, useEffect } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { capacityApi } from '../api/capacity'
import CapacityBar from '../components/CapacityBar'

const ResourceBandwidth = () => {
  const [capacityData, setCapacityData] = useState([])
  const [loading, setLoading] = useState(true)
  const [weeksAhead, setWeeksAhead] = useState(3)

  const fetchCapacity = async () => {
    setLoading(true)
    try {
      const data = await capacityApi.getCapacity(weeksAhead)
      setCapacityData(data)
    } catch (error) {
      console.error('Failed to fetch capacity:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCapacity()
  }, [weeksAhead])

  const formatWeekDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'overloaded': return 'text-red-600 bg-red-50'
      case 'high': return 'text-yellow-600 bg-yellow-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'available': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading capacity data...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Bandwidth</h1>
          <p className="text-gray-500 mt-1">Team capacity overview for current and upcoming weeks</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={weeksAhead} 
            onChange={(e) => setWeeksAhead(parseInt(e.target.value))} 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value={2}>2 Weeks</option>
            <option value={3}>3 Weeks</option>
            <option value={4}>4 Weeks</option>
          </select>
          <button
            onClick={fetchCapacity}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {capacityData.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  {capacityData[0]?.weeks.map((week, idx) => (
                    <th key={idx} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week {idx === 0 ? '(Current)' : `+${idx}`}
                      <div className="text-xs font-normal text-gray-400 mt-0.5">
                        {formatWeekDate(week.weekStart)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {capacityData.map(resource => (
                  <tr key={resource.resourceId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                          style={{ backgroundColor: resource.color }}
                        >
                          {resource.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{resource.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {resource.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {resource.weeklyCapacityHrs}h/week
                    </td>
                    {resource.weeks.map((week, idx) => (
                      <td key={idx} className="px-6 py-4 whitespace-nowrap">
                        <div className="text-center">
                          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(week.status)}`}>
                            {week.availableHrs}h available
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {week.allocatedHrs}h / {resource.weeklyCapacityHrs}h
                          </div>
                          <div className="w-full mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  week.status === 'overloaded' ? 'bg-red-500' :
                                  week.status === 'high' ? 'bg-yellow-500' :
                                  week.status === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(week.utilizationPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-4">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No capacity data</p>
          <p className="text-sm text-gray-500 mt-1">Add team members to see capacity overview</p>
        </div>
      )}
    </div>
  )
}

export default ResourceBandwidth
