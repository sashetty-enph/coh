import { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import { useResources } from '../hooks/useResources'
import StatusBadge from '../components/StatusBadge'
import { CAMPAIGN_STATUSES } from '../lib/constants'

const CalendarView = () => {
  const { campaigns } = useCampaigns()
  const { resources } = useResources()
  const [viewMode, setViewMode] = useState('month') // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date())

  const activeCampaigns = campaigns.filter(c => 
    c.estimatedStartDate && c.estimatedEndDate && c.status !== 'completed'
  )

  const getWeekDates = (date) => {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const getMonthDates = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const dates = []
    const current = new Date(startDate)
    while (current <= lastDay || dates.length < 35) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const dates = viewMode === 'week' ? getWeekDates(currentDate) : getMonthDates(currentDate)

  const getCampaignsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return activeCampaigns.filter(c => {
      const start = c.estimatedStartDate
      const end = c.estimatedEndDate
      return dateStr >= start && dateStr <= end
    })
  }

  const navigatePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateHeader = () => {
    if (viewMode === 'week') {
      const start = dates[0]
      const end = dates[6]
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
          <p className="text-gray-500 mt-1">Timeline visualization of campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-white">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={navigatePrev}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{formatDateHeader()}</h2>
          <button
            onClick={navigateNext}
            className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {viewMode === 'month' ? (
          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                {day}
              </div>
            ))}
            {dates.map((date, idx) => {
              const campaignsOnDate = getCampaignsForDate(date)
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 border-b border-r border-gray-100 ${
                    !isCurrentMonth(date) ? 'bg-gray-50' : ''
                  } ${isToday(date) ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday(date) ? 'text-blue-600' : 
                    !isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {campaignsOnDate.slice(0, 3).map(campaign => {
                      const resource = resources.find(r => r.id === campaign.assignedTo)
                      return (
                        <div
                          key={campaign.id}
                          className="text-xs p-1.5 rounded truncate"
                          style={{ backgroundColor: resource?.color || '#3b82f6', color: 'white' }}
                          title={campaign.title}
                        >
                          {campaign.title.length > 20 ? campaign.title.substring(0, 20) + '...' : campaign.title}
                        </div>
                      )
                    })}
                    {campaignsOnDate.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1.5">
                        +{campaignsOnDate.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-4 mb-4">
              {dates.map((date, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm font-medium ${
                    isToday(date) ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              {activeCampaigns.map(campaign => {
                const resource = resources.find(r => r.id === campaign.assignedTo)
                const start = new Date(campaign.estimatedStartDate)
                const end = new Date(campaign.estimatedEndDate)
                const weekStart = dates[0]
                const weekEnd = dates[6]
                
                if (end < weekStart || start > weekEnd) return null
                
                return (
                  <div key={campaign.id} className="flex items-center gap-3">
                    <div className="w-48 flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{campaign.title}</div>
                      <div className="text-xs text-gray-500">{resource?.name || 'Unassigned'}</div>
                    </div>
                    <div className="flex-1 relative h-8">
                      <div className="absolute inset-0 grid grid-cols-7 gap-1">
                        {dates.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0]
                          const isInRange = dateStr >= campaign.estimatedStartDate && dateStr <= campaign.estimatedEndDate
                          return (
                            <div key={idx} className="relative">
                              {isInRange && (
                                <div
                                  className="absolute inset-0 rounded"
                                  style={{ backgroundColor: resource?.color || '#3b82f6' }}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="w-24 flex-shrink-0">
                      <StatusBadge status={campaign.status} statuses={CAMPAIGN_STATUSES} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {activeCampaigns.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm mt-6">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No scheduled campaigns</p>
          <p className="text-sm text-gray-500 mt-1">Scope campaigns with dates to see them on the calendar</p>
        </div>
      )}
    </div>
  )
}

export default CalendarView
