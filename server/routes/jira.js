import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { upsertCampaign, upsertMopsTicket, getMopsTicketById, getConfig } from '../db.js'

const router = express.Router()

// Proxy endpoint for Jira API calls
router.post('/proxy', async (req, res) => {
  const { domain, endpoint, method = 'GET', auth, body } = req.body

  if (!domain || !endpoint || !auth) {
    return res.status(400).json({ error: 'Missing required fields: domain, endpoint, auth' })
  }

  try {
    const url = `https://${domain}${endpoint}`
    
    const fetchOptions = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, fetchOptions)
    const data = await response.json().catch(() => ({}))

    res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error.message, error.cause || '')
    res.status(500).json({ error: `Proxy fetch failed: ${error.message}` })
  }
})

// Import ENCAM tickets from Jira
router.post('/import-encam', async (req, res) => {
  try {
    const jiraConfig = getConfig('jiraConfig')
    if (!jiraConfig || !jiraConfig.domain || !jiraConfig.sourceProject) {
      return res.status(400).json({ error: 'Jira not configured' })
    }

    const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64')
    const jql = `project = ${jiraConfig.sourceProject} AND status != Done ORDER BY created DESC`
    
    const response = await fetch(`https://${jiraConfig.domain}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql,
        maxResults: 100,
        fields: ['summary', 'status', 'priority', 'assignee', 'created', 'duedate', 'description', 'reporter']
      })
    })

    const data = await response.json()

    if (data.issues) {
      const imported = []
      
      for (const issue of data.issues) {
        const campaign = {
          id: uuidv4(),
          jiraKey: issue.key,
          jiraId: issue.id,
          title: `${issue.key}: ${issue.fields.summary}`,
          description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
          raisedBy: issue.fields.reporter?.displayName || 'Unknown',
          raisedDate: issue.fields.created?.split('T')[0] || new Date().toISOString().split('T')[0],
          priority: issue.fields.priority?.name?.toLowerCase() === 'highest' ? 'critical' 
            : issue.fields.priority?.name?.toLowerCase() === 'high' ? 'high'
            : issue.fields.priority?.name?.toLowerCase() === 'low' ? 'low' 
            : 'medium',
          status: 'pending_scoping',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        upsertCampaign(campaign)
        imported.push(campaign)
      }
      
      res.json({ success: true, imported: imported.length, campaigns: imported })
    } else {
      res.status(400).json({ error: data.errorMessages?.join(', ') || 'Failed to fetch tickets' })
    }
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create MOPS ticket in Jira
router.post('/create-mops', async (req, res) => {
  try {
    const { campaignId, summary, description, assigneeId, startDate, dueDate, storyPoints, effortBreakdown } = req.body
    
    const jiraConfig = getConfig('jiraConfig')
    if (!jiraConfig || !jiraConfig.domain || !jiraConfig.targetProject) {
      return res.status(400).json({ error: 'Jira target project not configured' })
    }

    const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64')
    
    // Build description with effort breakdown
    let fullDescription = description || ''
    if (effortBreakdown) {
      fullDescription += '\n\n**Effort Breakdown:**\n'
      if (effortBreakdown.emailHrs) fullDescription += `- Email: ${effortBreakdown.emailHrs}h\n`
      if (effortBreakdown.landingPageHrs) fullDescription += `- Landing Page: ${effortBreakdown.landingPageHrs}h\n`
      if (effortBreakdown.audienceHrs) fullDescription += `- Audience/Segmentation: ${effortBreakdown.audienceHrs}h\n`
      if (effortBreakdown.journeyHrs) fullDescription += `- Journey/Automation: ${effortBreakdown.journeyHrs}h\n`
      if (effortBreakdown.otherHrs && effortBreakdown.otherLabel) {
        fullDescription += `- ${effortBreakdown.otherLabel}: ${effortBreakdown.otherHrs}h\n`
      }
      fullDescription += `\n**Total Estimated Hours:** ${effortBreakdown.totalHrs}h`
    }

    const issueData = {
      fields: {
        project: { key: jiraConfig.targetProject },
        summary,
        description: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: fullDescription
            }]
          }]
        },
        issuetype: { name: 'Task' }
      }
    }

    // Add assignee if provided
    if (assigneeId) {
      issueData.fields.assignee = { accountId: assigneeId }
    }

    // Add due date if provided
    if (dueDate) {
      issueData.fields.duedate = dueDate
    }

    // Add story points if configured
    if (storyPoints) {
      issueData.fields.customfield_10016 = storyPoints
    }

    const response = await fetch(`https://${jiraConfig.domain}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issueData)
    })

    const data = await response.json()

    if (data.key) {
      // Save MOPS ticket locally
      const mopsTicket = {
        id: uuidv4(),
        campaignId,
        jiraKey: data.key,
        jiraId: data.id,
        summary,
        description: fullDescription,
        assigneeId,
        startDate,
        dueDate,
        storyPoints,
        jiraStatus: 'To Do',
        createdAt: new Date().toISOString()
      }
      
      upsertMopsTicket(mopsTicket)
      
      res.json({ success: true, mopsTicket, jiraUrl: `https://${jiraConfig.domain}/browse/${data.key}` })
    } else {
      res.status(400).json({ error: data.errorMessages?.join(', ') || JSON.stringify(data.errors) || 'Failed to create ticket' })
    }
  } catch (error) {
    console.error('MOPS creation error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync MOPS ticket status from Jira
router.post('/sync-mops/:mopsId', async (req, res) => {
  try {
    const { mopsId } = req.params
    const mopsTicket = getMopsTicketById(mopsId)
    
    if (!mopsTicket || !mopsTicket.jiraKey) {
      return res.status(404).json({ error: 'MOPS ticket not found or not linked to Jira' })
    }

    const jiraConfig = getConfig('jiraConfig')
    if (!jiraConfig || !jiraConfig.domain) {
      return res.status(400).json({ error: 'Jira not configured' })
    }

    const auth = Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64')
    
    const response = await fetch(`https://${jiraConfig.domain}/rest/api/3/issue/${mopsTicket.jiraKey}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (data.fields) {
      const updatedTicket = {
        ...mopsTicket,
        jiraStatus: data.fields.status?.name || mopsTicket.jiraStatus,
        lastSyncedAt: new Date().toISOString()
      }
      
      upsertMopsTicket(updatedTicket)
      
      res.json({ success: true, ticket: updatedTicket })
    } else {
      res.status(400).json({ error: 'Failed to fetch ticket from Jira' })
    }
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
