export const API_BASE = import.meta.env.DEV ? 'http://localhost:3003' : ''

export const CAMPAIGN_STATUSES = [
  { value: 'pending_scoping', label: 'Pending Scoping', color: 'bg-gray-400' },
  { value: 'scoped', label: 'Scoped', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-orange-500' },
]

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-slate-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
]

export const COMPLEXITY_LEVELS = [
  { value: 'simple', label: 'Simple', buffer: 3 },
  { value: 'medium', label: 'Medium', buffer: 5 },
  { value: 'complex', label: 'Complex', buffer: 10 },
]

export const EFFORT_CATEGORIES = [
  { key: 'emailHrs', label: 'Email', description: 'Email asset creation and configuration' },
  { key: 'landingPageHrs', label: 'Landing Page', description: 'Landing page design and build' },
  { key: 'audienceHrs', label: 'Audience/Segmentation', description: 'Audience list build and segmentation logic' },
  { key: 'journeyHrs', label: 'Journey/Automation', description: 'Marketing automation or journey setup' },
  { key: 'otherHrs', label: 'Other', description: 'Additional effort not covered above' },
]

export const MOPS_STATUSES = [
  { value: 'To Do', label: 'To Do', color: 'bg-gray-400' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'In Review', label: 'In Review', color: 'bg-purple-500' },
  { value: 'Done', label: 'Done', color: 'bg-green-500' },
]

export const SLA_STATUS = {
  on_track: { label: 'On Track', color: 'text-green-600 bg-green-50 border-green-200' },
  at_risk: { label: 'At Risk', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  breached: { label: 'Breached', color: 'text-red-600 bg-red-50 border-red-200' },
  none: { label: 'No SLA', color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

export const RESOURCE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'
]
