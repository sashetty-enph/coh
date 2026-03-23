import { getTeamUtilization } from './capacity.js'

// SLA buffer days by complexity
const COMPLEXITY_BUFFERS = {
  simple: 3,
  medium: 5,
  complex: 10
}

// Add days to a date
const addDays = (dateStr, days) => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// Calculate SLA date based on raised date, complexity, and team capacity
export const calculateSlaDate = (raisedDate, complexity, estimatedEndDate = null) => {
  if (!raisedDate || !complexity) return null
  
  const bufferDays = COMPLEXITY_BUFFERS[complexity.toLowerCase()] || 5
  const teamUtilization = getTeamUtilization()
  
  // If team is over 80% utilized, extend buffer proportionally
  let adjustedBuffer = bufferDays
  if (teamUtilization > 80) {
    const utilizationFactor = teamUtilization / 80
    adjustedBuffer = Math.ceil(bufferDays * utilizationFactor)
  }
  
  const complexityBasedDate = addDays(raisedDate, adjustedBuffer)
  
  // SLA is the later of complexity-based date and capacity-based end date
  if (estimatedEndDate) {
    const complexityDate = new Date(complexityBasedDate)
    const capacityDate = new Date(estimatedEndDate)
    return capacityDate > complexityDate ? estimatedEndDate : complexityBasedDate
  }
  
  return complexityBasedDate
}

// Calculate deviation when ticket is completed
export const calculateDeviation = (estimatedEndDate, actualEndDate) => {
  if (!estimatedEndDate || !actualEndDate) return 0
  
  const estimated = new Date(estimatedEndDate)
  const actual = new Date(actualEndDate)
  
  const diffTime = actual - estimated
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// Check if SLA is at risk (within 2 days of breach)
export const isSlaAtRisk = (slaDate, currentDate = null) => {
  if (!slaDate) return false
  
  const sla = new Date(slaDate)
  const now = currentDate ? new Date(currentDate) : new Date()
  
  const diffTime = sla - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays <= 2 && diffDays >= 0
}

// Check if SLA is breached
export const isSlaBreached = (slaDate, currentDate = null) => {
  if (!slaDate) return false
  
  const sla = new Date(slaDate)
  const now = currentDate ? new Date(currentDate) : new Date()
  
  return now > sla
}

// Get SLA status
export const getSlaStatus = (slaDate, currentDate = null) => {
  if (!slaDate) return 'none'
  
  if (isSlaBreached(slaDate, currentDate)) return 'breached'
  if (isSlaAtRisk(slaDate, currentDate)) return 'at_risk'
  return 'on_track'
}
