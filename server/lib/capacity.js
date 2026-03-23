import { getResources, getMopsTickets, getCapacityAllocations } from '../db.js'

// Get Monday of the week for a given date
export const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

// Add weeks to a date
export const addWeeks = (dateStr, weeks) => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + (weeks * 7))
  return date.toISOString().split('T')[0]
}

// Calculate allocated hours for a resource in a given week
export const calculateAllocatedHours = (resourceId, weekStartDate) => {
  const mopsTickets = getMopsTickets().filter(t => 
    t.assigneeId === resourceId && 
    t.jiraStatus !== 'Done' &&
    t.startDate && t.dueDate
  )
  
  const weekStart = new Date(weekStartDate)
  const weekEnd = new Date(weekStartDate)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  let totalHours = 0
  
  mopsTickets.forEach(ticket => {
    const ticketStart = new Date(ticket.startDate)
    const ticketEnd = new Date(ticket.dueDate)
    
    // Check if ticket overlaps with this week
    if (ticketStart < weekEnd && ticketEnd >= weekStart) {
      // Calculate overlap days
      const overlapStart = ticketStart > weekStart ? ticketStart : weekStart
      const overlapEnd = ticketEnd < weekEnd ? ticketEnd : weekEnd
      const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1
      
      // Calculate total ticket days
      const totalDays = Math.ceil((ticketEnd - ticketStart) / (1000 * 60 * 60 * 24)) + 1
      
      // Distribute hours proportionally
      const hoursPerDay = (ticket.storyPoints || 0) / totalDays
      totalHours += hoursPerDay * overlapDays
    }
  })
  
  return Math.round(totalHours * 10) / 10
}

// Get capacity data for all resources for current week + N upcoming weeks
export const getResourceCapacity = (weeksAhead = 3) => {
  const resources = getResources()
  const today = new Date()
  const currentWeekStart = getWeekStart(today.toISOString())
  
  const capacityData = []
  
  resources.forEach(resource => {
    const resourceCapacity = {
      resourceId: resource.id,
      name: resource.name,
      role: resource.role,
      color: resource.color,
      weeklyCapacityHrs: resource.weeklyCapacityHrs || 40,
      weeks: []
    }
    
    for (let i = 0; i <= weeksAhead; i++) {
      const weekStart = addWeeks(currentWeekStart, i)
      const allocatedHrs = calculateAllocatedHours(resource.id, weekStart)
      const availableHrs = resourceCapacity.weeklyCapacityHrs - allocatedHrs
      const utilizationPct = (allocatedHrs / resourceCapacity.weeklyCapacityHrs) * 100
      
      resourceCapacity.weeks.push({
        weekStart,
        allocatedHrs,
        availableHrs,
        utilizationPct: Math.round(utilizationPct),
        status: utilizationPct >= 100 ? 'overloaded' : 
                utilizationPct >= 80 ? 'high' :
                utilizationPct >= 50 ? 'medium' : 'available'
      })
    }
    
    capacityData.push(resourceCapacity)
  })
  
  return capacityData
}

// Find next available slot for a given resource and hour estimate
export const getNextAvailableSlot = (resourceId, estimatedHours) => {
  const resource = getResources().find(r => r.id === resourceId)
  if (!resource) return null
  
  const today = new Date()
  const currentWeekStart = getWeekStart(today.toISOString())
  
  // Check up to 12 weeks ahead
  for (let i = 0; i < 12; i++) {
    const weekStart = addWeeks(currentWeekStart, i)
    const allocatedHrs = calculateAllocatedHours(resourceId, weekStart)
    const availableHrs = (resource.weeklyCapacityHrs || 40) - allocatedHrs
    
    if (availableHrs >= estimatedHours) {
      return {
        weekStart,
        availableHrs,
        weeksFromNow: i
      }
    }
  }
  
  return null
}

// Get best resource suggestions for a task
export const suggestResources = (estimatedHours, requiredRole = null) => {
  const resources = getResources()
  const today = new Date()
  const currentWeekStart = getWeekStart(today.toISOString())
  
  const suggestions = resources
    .filter(r => !requiredRole || r.role === requiredRole)
    .map(resource => {
      const nextSlot = getNextAvailableSlot(resource.id, estimatedHours)
      const currentWeekAllocated = calculateAllocatedHours(resource.id, currentWeekStart)
      const currentWeekAvailable = (resource.weeklyCapacityHrs || 40) - currentWeekAllocated
      
      return {
        resourceId: resource.id,
        name: resource.name,
        role: resource.role,
        color: resource.color,
        currentWeekAvailable,
        nextAvailableSlot: nextSlot,
        score: nextSlot ? (1000 - (nextSlot.weeksFromNow * 100)) + currentWeekAvailable : 0
      }
    })
    .sort((a, b) => b.score - a.score)
  
  return suggestions
}

// Calculate team utilization percentage
export const getTeamUtilization = () => {
  const resources = getResources()
  const today = new Date()
  const currentWeekStart = getWeekStart(today.toISOString())
  
  let totalCapacity = 0
  let totalAllocated = 0
  
  resources.forEach(resource => {
    const capacity = resource.weeklyCapacityHrs || 40
    const allocated = calculateAllocatedHours(resource.id, currentWeekStart)
    totalCapacity += capacity
    totalAllocated += allocated
  })
  
  return totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0
}
