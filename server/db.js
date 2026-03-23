import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use persistent volume path on Railway, fallback to project root for local dev
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..')
const dbPath = path.join(dataDir, 'coh.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    color TEXT,
    weeklyCapacityHrs REAL DEFAULT 40,
    isActive INTEGER DEFAULT 1,
    jiraAccountId TEXT
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    jiraKey TEXT UNIQUE,
    jiraId TEXT,
    title TEXT NOT NULL,
    description TEXT,
    raisedBy TEXT,
    raisedDate TEXT,
    complexity TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending_scoping',
    assignedTo TEXT,
    estimatedStartDate TEXT,
    estimatedEndDate TEXT,
    actualEndDate TEXT,
    slaDate TEXT,
    deviationDays INTEGER,
    deviationRootCause TEXT,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY (assignedTo) REFERENCES resources(id)
  );

  CREATE TABLE IF NOT EXISTS effort_breakdowns (
    id TEXT PRIMARY KEY,
    campaignId TEXT NOT NULL,
    emailHrs REAL DEFAULT 0,
    landingPageHrs REAL DEFAULT 0,
    audienceHrs REAL DEFAULT 0,
    journeyHrs REAL DEFAULT 0,
    otherLabel TEXT,
    otherHrs REAL DEFAULT 0,
    totalHrs REAL DEFAULT 0,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS mops_tickets (
    id TEXT PRIMARY KEY,
    campaignId TEXT NOT NULL,
    jiraKey TEXT,
    jiraId TEXT,
    summary TEXT NOT NULL,
    description TEXT,
    assigneeId TEXT,
    startDate TEXT,
    dueDate TEXT,
    storyPoints REAL,
    jiraStatus TEXT DEFAULT 'To Do',
    lastSyncedAt TEXT,
    createdAt TEXT,
    FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES resources(id)
  );

  CREATE TABLE IF NOT EXISTS capacity_allocations (
    id TEXT PRIMARY KEY,
    resourceId TEXT NOT NULL,
    weekStartDate TEXT NOT NULL,
    allocatedHrs REAL DEFAULT 0,
    FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE(resourceId, weekStartDate)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    entityType TEXT,
    entityId TEXT,
    action TEXT,
    performedBy TEXT,
    timestamp TEXT,
    previousValue TEXT,
    newValue TEXT
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`)

// Resources CRUD
export const getResources = () => {
  return db.prepare('SELECT * FROM resources WHERE isActive = 1').all()
}

export const getAllResources = () => {
  return db.prepare('SELECT * FROM resources').all()
}

export const getResourceById = (id) => {
  return db.prepare('SELECT * FROM resources WHERE id = ?').get(id)
}

export const upsertResource = (resource) => {
  const stmt = db.prepare(`
    INSERT INTO resources (id, name, role, color, weeklyCapacityHrs, isActive, jiraAccountId)
    VALUES (@id, @name, @role, @color, @weeklyCapacityHrs, @isActive, @jiraAccountId)
    ON CONFLICT(id) DO UPDATE SET
      name=@name, role=@role, color=@color, weeklyCapacityHrs=@weeklyCapacityHrs,
      isActive=@isActive, jiraAccountId=@jiraAccountId
  `)
  stmt.run({
    id: resource.id,
    name: resource.name,
    role: resource.role || null,
    color: resource.color || '#3b82f6',
    weeklyCapacityHrs: resource.weeklyCapacityHrs ?? 40,
    isActive: resource.isActive ?? 1,
    jiraAccountId: resource.jiraAccountId || null
  })
}

export const deleteResource = (id) => {
  db.prepare('UPDATE resources SET isActive = 0 WHERE id = ?').run(id)
}

// Campaigns CRUD
export const getCampaigns = () => {
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY createdAt DESC').all()
  const efforts = db.prepare('SELECT * FROM effort_breakdowns').all()
  const mopsTickets = db.prepare('SELECT * FROM mops_tickets').all()
  
  return campaigns.map(c => ({
    ...c,
    effort: efforts.find(e => e.campaignId === c.id) || null,
    mopsTickets: mopsTickets.filter(m => m.campaignId === c.id)
  }))
}

export const getCampaignById = (id) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id)
  if (!campaign) return null
  
  const effort = db.prepare('SELECT * FROM effort_breakdowns WHERE campaignId = ?').get(id)
  const mopsTickets = db.prepare('SELECT * FROM mops_tickets WHERE campaignId = ?').all(id)
  
  return { ...campaign, effort, mopsTickets }
}

export const upsertCampaign = (campaign) => {
  const stmt = db.prepare(`
    INSERT INTO campaigns (
      id, jiraKey, jiraId, title, description, raisedBy, raisedDate,
      complexity, priority, status, assignedTo, estimatedStartDate, estimatedEndDate,
      actualEndDate, slaDate, deviationDays, deviationRootCause, notes, createdAt, updatedAt
    )
    VALUES (
      @id, @jiraKey, @jiraId, @title, @description, @raisedBy, @raisedDate,
      @complexity, @priority, @status, @assignedTo, @estimatedStartDate, @estimatedEndDate,
      @actualEndDate, @slaDate, @deviationDays, @deviationRootCause, @notes, @createdAt, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      jiraKey=@jiraKey, jiraId=@jiraId, title=@title, description=@description,
      raisedBy=@raisedBy, raisedDate=@raisedDate, complexity=@complexity, priority=@priority,
      status=@status, assignedTo=@assignedTo, estimatedStartDate=@estimatedStartDate,
      estimatedEndDate=@estimatedEndDate, actualEndDate=@actualEndDate, slaDate=@slaDate,
      deviationDays=@deviationDays, deviationRootCause=@deviationRootCause, notes=@notes, updatedAt=@updatedAt
  `)
  stmt.run({
    id: campaign.id,
    jiraKey: campaign.jiraKey || null,
    jiraId: campaign.jiraId || null,
    title: campaign.title,
    description: campaign.description || null,
    raisedBy: campaign.raisedBy || null,
    raisedDate: campaign.raisedDate || null,
    complexity: campaign.complexity || null,
    priority: campaign.priority || 'medium',
    status: campaign.status || 'pending_scoping',
    assignedTo: campaign.assignedTo || null,
    estimatedStartDate: campaign.estimatedStartDate || null,
    estimatedEndDate: campaign.estimatedEndDate || null,
    actualEndDate: campaign.actualEndDate || null,
    slaDate: campaign.slaDate || null,
    deviationDays: campaign.deviationDays || null,
    deviationRootCause: campaign.deviationRootCause || null,
    notes: campaign.notes || null,
    createdAt: campaign.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  
  // Upsert effort breakdown if provided
  if (campaign.effort) {
    upsertEffortBreakdown(campaign.id, campaign.effort)
  }
}

export const deleteCampaign = (id) => {
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(id)
}

// Effort Breakdowns
export const upsertEffortBreakdown = (campaignId, effort) => {
  const stmt = db.prepare(`
    INSERT INTO effort_breakdowns (
      id, campaignId, emailHrs, landingPageHrs, audienceHrs, journeyHrs, otherLabel, otherHrs, totalHrs
    )
    VALUES (@id, @campaignId, @emailHrs, @landingPageHrs, @audienceHrs, @journeyHrs, @otherLabel, @otherHrs, @totalHrs)
    ON CONFLICT(id) DO UPDATE SET
      emailHrs=@emailHrs, landingPageHrs=@landingPageHrs, audienceHrs=@audienceHrs,
      journeyHrs=@journeyHrs, otherLabel=@otherLabel, otherHrs=@otherHrs, totalHrs=@totalHrs
  `)
  
  const totalHrs = (effort.emailHrs || 0) + (effort.landingPageHrs || 0) + 
                   (effort.audienceHrs || 0) + (effort.journeyHrs || 0) + (effort.otherHrs || 0)
  
  stmt.run({
    id: effort.id,
    campaignId,
    emailHrs: effort.emailHrs || 0,
    landingPageHrs: effort.landingPageHrs || 0,
    audienceHrs: effort.audienceHrs || 0,
    journeyHrs: effort.journeyHrs || 0,
    otherLabel: effort.otherLabel || null,
    otherHrs: effort.otherHrs || 0,
    totalHrs
  })
}

// MOPS Tickets CRUD
export const getMopsTickets = () => {
  return db.prepare('SELECT * FROM mops_tickets ORDER BY createdAt DESC').all()
}

export const getMopsTicketById = (id) => {
  return db.prepare('SELECT * FROM mops_tickets WHERE id = ?').get(id)
}

export const upsertMopsTicket = (ticket) => {
  const stmt = db.prepare(`
    INSERT INTO mops_tickets (
      id, campaignId, jiraKey, jiraId, summary, description, assigneeId,
      startDate, dueDate, storyPoints, jiraStatus, lastSyncedAt, createdAt
    )
    VALUES (
      @id, @campaignId, @jiraKey, @jiraId, @summary, @description, @assigneeId,
      @startDate, @dueDate, @storyPoints, @jiraStatus, @lastSyncedAt, @createdAt
    )
    ON CONFLICT(id) DO UPDATE SET
      jiraKey=@jiraKey, jiraId=@jiraId, summary=@summary, description=@description,
      assigneeId=@assigneeId, startDate=@startDate, dueDate=@dueDate, storyPoints=@storyPoints,
      jiraStatus=@jiraStatus, lastSyncedAt=@lastSyncedAt
  `)
  stmt.run({
    id: ticket.id,
    campaignId: ticket.campaignId,
    jiraKey: ticket.jiraKey || null,
    jiraId: ticket.jiraId || null,
    summary: ticket.summary,
    description: ticket.description || null,
    assigneeId: ticket.assigneeId || null,
    startDate: ticket.startDate || null,
    dueDate: ticket.dueDate || null,
    storyPoints: ticket.storyPoints || null,
    jiraStatus: ticket.jiraStatus || 'To Do',
    lastSyncedAt: ticket.lastSyncedAt || null,
    createdAt: ticket.createdAt || new Date().toISOString()
  })
}

export const deleteMopsTicket = (id) => {
  db.prepare('DELETE FROM mops_tickets WHERE id = ?').run(id)
}

// Capacity Allocations
export const getCapacityAllocations = (resourceId = null, weekStartDate = null) => {
  if (resourceId && weekStartDate) {
    return db.prepare('SELECT * FROM capacity_allocations WHERE resourceId = ? AND weekStartDate = ?')
      .get(resourceId, weekStartDate)
  } else if (resourceId) {
    return db.prepare('SELECT * FROM capacity_allocations WHERE resourceId = ?').all(resourceId)
  } else if (weekStartDate) {
    return db.prepare('SELECT * FROM capacity_allocations WHERE weekStartDate = ?').all(weekStartDate)
  }
  return db.prepare('SELECT * FROM capacity_allocations').all()
}

export const upsertCapacityAllocation = (allocation) => {
  const stmt = db.prepare(`
    INSERT INTO capacity_allocations (id, resourceId, weekStartDate, allocatedHrs)
    VALUES (@id, @resourceId, @weekStartDate, @allocatedHrs)
    ON CONFLICT(resourceId, weekStartDate) DO UPDATE SET allocatedHrs=@allocatedHrs
  `)
  stmt.run({
    id: allocation.id,
    resourceId: allocation.resourceId,
    weekStartDate: allocation.weekStartDate,
    allocatedHrs: allocation.allocatedHrs || 0
  })
}

// Audit Log
export const addAuditLog = (log) => {
  const stmt = db.prepare(`
    INSERT INTO audit_log (id, entityType, entityId, action, performedBy, timestamp, previousValue, newValue)
    VALUES (@id, @entityType, @entityId, @action, @performedBy, @timestamp, @previousValue, @newValue)
  `)
  stmt.run({
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    performedBy: log.performedBy || 'system',
    timestamp: new Date().toISOString(),
    previousValue: log.previousValue ? JSON.stringify(log.previousValue) : null,
    newValue: log.newValue ? JSON.stringify(log.newValue) : null
  })
}

export const getAuditLogs = (entityType = null, entityId = null) => {
  if (entityType && entityId) {
    return db.prepare('SELECT * FROM audit_log WHERE entityType = ? AND entityId = ? ORDER BY timestamp DESC')
      .all(entityType, entityId)
  } else if (entityType) {
    return db.prepare('SELECT * FROM audit_log WHERE entityType = ? ORDER BY timestamp DESC').all(entityType)
  }
  return db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100').all()
}

// Config
export const getConfig = (key) => {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

export const setConfig = (key, value) => {
  db.prepare(`
    INSERT INTO config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?
  `).run(key, JSON.stringify(value), JSON.stringify(value))
}

export default db
