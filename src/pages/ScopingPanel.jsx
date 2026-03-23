import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Loader2, CheckCircle, AlertTriangle, Users, Calendar, Clock } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { campaignsApi } from '../api/campaigns'
import { capacityApi } from '../api/capacity'
import { jiraApi } from '../api/jira'
import { useResources } from '../hooks/useResources'
import { EFFORT_CATEGORIES, COMPLEXITY_LEVELS } from '../lib/constants'

const ScopingPanel = ({ campaign, onBack, onComplete }) => {
  const { resources } = useResources()
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [formData, setFormData] = useState({
    complexity: campaign.complexity || 'medium',
    emailHrs: 0,
    landingPageHrs: 0,
    audienceHrs: 0,
    journeyHrs: 0,
    otherLabel: '',
    otherHrs: 0,
    assignedTo: campaign.assignedTo || '',
    estimatedStartDate: campaign.estimatedStartDate || new Date().toISOString().split('T')[0],
    estimatedEndDate: campaign.estimatedEndDate || '',
    notes: campaign.notes || ''
  })
  const [capacityWarning, setCapacityWarning] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const totalHrs = (formData.emailHrs || 0) + (formData.landingPageHrs || 0) + 
                   (formData.audienceHrs || 0) + (formData.journeyHrs || 0) + (formData.otherHrs || 0)

  useEffect(() => {
    if (totalHrs > 0) {
      fetchSuggestions()
    }
  }, [totalHrs])

  useEffect(() => {
    if (formData.assignedTo && totalHrs > 0) {
      checkCapacity()
    }
  }, [formData.assignedTo, totalHrs, formData.estimatedStartDate, formData.estimatedEndDate])

  const fetchSuggestions = async () => {
    try {
      const data = await capacityApi.getSuggestions(totalHrs)
      setSuggestions(data.slice(0, 3))
      
      if (data.length > 0 && !formData.assignedTo) {
        const topSuggestion = data[0]
        if (topSuggestion.nextAvailableSlot) {
          const startDate = topSuggestion.nextAvailableSlot.weekStart
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + Math.ceil(totalHrs / 8))
          
          setFormData(prev => ({
            ...prev,
            assignedTo: topSuggestion.resourceId,
            estimatedStartDate: startDate,
            estimatedEndDate: endDate.toISOString().split('T')[0]
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const checkCapacity = async () => {
    if (!formData.assignedTo || !formData.estimatedStartDate || !formData.estimatedEndDate) {
      setCapacityWarning(null)
      return
    }

    try {
      const resource = resources.find(r => r.id === formData.assignedTo)
      if (!resource) return

      const startDate = new Date(formData.estimatedStartDate)
      const endDate = new Date(formData.estimatedEndDate)
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      const durationWeeks = Math.ceil(durationDays / 7)
      
      const weeklyHours = totalHrs / durationWeeks
      const capacity = resource.weeklyCapacityHrs || 40

      if (weeklyHours > capacity) {
        setCapacityWarning({
          type: 'error',
          message: `This assignment requires ${Math.round(weeklyHours)}h/week but ${resource.name} only has ${capacity}h/week capacity`
        })
      } else if (weeklyHours > capacity * 0.8) {
        setCapacityWarning({
          type: 'warning',
          message: `This will use ${Math.round((weeklyHours / capacity) * 100)}% of ${resource.name}'s capacity`
        })
      } else {
        setCapacityWarning(null)
      }
    } catch (error) {
      console.error('Failed to check capacity:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.assignedTo || !formData.estimatedStartDate || !formData.estimatedEndDate) {
      alert('Please assign a resource and set dates')
      return
    }

    setLoading(true)
    try {
      const effortBreakdown = {
        id: uuidv4(),
        emailHrs: formData.emailHrs,
        landingPageHrs: formData.landingPageHrs,
        audienceHrs: formData.audienceHrs,
        journeyHrs: formData.journeyHrs,
        otherLabel: formData.otherLabel,
        otherHrs: formData.otherHrs,
        totalHrs
      }

      await campaignsApi.update(campaign.id, {
        complexity: formData.complexity,
        assignedTo: formData.assignedTo,
        estimatedStartDate: formData.estimatedStartDate,
        estimatedEndDate: formData.estimatedEndDate,
        notes: formData.notes,
        status: 'scoped',
        effort: effortBreakdown
      })

      onComplete()
    } catch (error) {
      alert(`Failed to save: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMops = async () => {
    if (!formData.assignedTo || !formData.estimatedStartDate || !formData.estimatedEndDate) {
      alert('Please complete scoping first')
      return
    }

    setLoading(true)
    try {
      const resource = resources.find(r => r.id === formData.assignedTo)
      
      const effortBreakdown = {
        emailHrs: formData.emailHrs,
        landingPageHrs: formData.landingPageHrs,
        audienceHrs: formData.audienceHrs,
        journeyHrs: formData.journeyHrs,
        otherLabel: formData.otherLabel,
        otherHrs: formData.otherHrs,
        totalHrs
      }

      const result = await jiraApi.createMops({
        campaignId: campaign.id,
        summary: campaign.title,
        description: `Campaign: ${campaign.title}\n\n${formData.notes || ''}`,
        assigneeId: resource?.jiraAccountId || null,
        startDate: formData.estimatedStartDate,
        dueDate: formData.estimatedEndDate,
        storyPoints: totalHrs,
        effortBreakdown
      })

      if (result.success) {
        alert(`MOPS ticket created: ${result.mopsTicket.jiraKey}`)
        
        await campaignsApi.update(campaign.id, {
          status: 'in_progress'
        })
        
        onComplete()
      }
    } catch (error) {
      alert(`Failed to create MOPS ticket: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedResource = resources.find(r => r.id === formData.assignedTo)

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-4"
        >
          <ArrowLeft size={16} />
          Back to Queue
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Scope Campaign</h1>
        <p className="text-gray-500 mt-1">{campaign.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Complexity */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Complexity</h3>
            <div className="grid grid-cols-3 gap-3">
              {COMPLEXITY_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setFormData({ ...formData, complexity: level.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.complexity === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{level.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{level.buffer} day SLA buffer</div>
                </button>
              ))}
            </div>
          </div>

          {/* Effort Breakdown */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Effort Breakdown</h3>
            <div className="space-y-4">
              {EFFORT_CATEGORIES.map(category => (
                <div key={category.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {category.label}
                    <span className="text-gray-400 text-xs ml-2">{category.description}</span>
                  </label>
                  {category.key === 'otherHrs' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g., QA Testing)"
                        value={formData.otherLabel}
                        onChange={(e) => setFormData({ ...formData, otherLabel: e.target.value })}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Hours"
                        value={formData.otherHrs || ''}
                        onChange={(e) => setFormData({ ...formData, otherHrs: parseFloat(e.target.value) || 0 })}
                        className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData[category.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [category.key]: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  )}
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Estimated Hours</span>
                  <span className="text-2xl font-bold text-blue-600">{totalHrs}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional context or requirements..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Resource Assignment */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Assignment</h3>
            
            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Suggested resources:</p>
                <div className="space-y-2">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.resourceId}
                      onClick={() => setFormData({ ...formData, assignedTo: suggestion.resourceId })}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        formData.assignedTo === suggestion.resourceId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: suggestion.color }}
                        >
                          {suggestion.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                          <div className="text-xs text-gray-500">
                            {suggestion.nextAvailableSlot 
                              ? `Available ${suggestion.nextAvailableSlot.weeksFromNow === 0 ? 'now' : `in ${suggestion.nextAvailableSlot.weeksFromNow} week(s)`}`
                              : 'No capacity'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="">Select resource...</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {r.role}</option>
                ))}
              </select>
            </div>

            {selectedResource && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: selectedResource.color }}
                  >
                    {selectedResource.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedResource.name}</div>
                    <div className="text-xs text-gray-500">{selectedResource.role}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Capacity: {selectedResource.weeklyCapacityHrs}h/week
                </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={formData.estimatedStartDate}
                  onChange={(e) => setFormData({ ...formData, estimatedStartDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={formData.estimatedEndDate}
                  onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            {capacityWarning && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                capacityWarning.type === 'error' 
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}>
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{capacityWarning.message}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={loading || totalHrs === 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Scoping
            </button>
            
            <button
              onClick={handleCreateMops}
              disabled={loading || totalHrs === 0 || !formData.assignedTo}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Create MOPS Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScopingPanel
