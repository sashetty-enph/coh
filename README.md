# Campaign Operations Hub (COH)

A unified platform for campaign intake, resource scheduling, and Jira automation.

## Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS v4
- **Backend:** Express 4 + SQLite (better-sqlite3)
- **Icons:** Lucide React
- **Ports:** Frontend on 5175, API on 3003

## Features Implemented

### Phase 1 - Core Intake & MOPS Creation ✅
- ✅ Jira integration with authentication
- ✅ Settings panel for Jira configuration
- ✅ Resource management (CRUD team members)
- ✅ Campaign intake queue (import ENCAM tickets from Jira)
- ✅ Campaign backlog view with filters
- ✅ Dashboard with KPIs and overview
- ✅ **Scoping Panel** with comprehensive effort breakdown
- ✅ **MOPS ticket creation** via Jira API with auto-linking

### Phase 2 - Capacity & Scheduling ✅
- ✅ Server-side capacity calculation engine
- ✅ Resource bandwidth screen (current + 3 weeks)
- ✅ SLA computation logic with dynamic adjustment
- ✅ Team utilization tracking
- ✅ Auto-assignment suggestions based on capacity
- ✅ Next-available-slot calculations
- ✅ Capacity warnings for overallocation
- ✅ **MOPS status sync** from Jira
- ✅ **Enhanced backlog** with expandable MOPS tickets

### Phase 3 - Operations & Deviation ✅
- ✅ **Deviation tracking** with automatic calculation
- ✅ **Deviation Log** page with reporting and analytics
- ✅ **Calendar/Gantt view** with month and week modes
- ✅ Timeline visualization with resource color-coding

## Quick Start

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev

# Frontend: http://localhost:5175
# API: http://localhost:3003
```

## Project Structure

```
ops-planner/
├── server/
│   ├── index.js              # Express server entry
│   ├── db.js                 # SQLite schema + CRUD
│   ├── lib/
│   │   ├── capacity.js       # Capacity calculations
│   │   └── sla.js            # SLA logic
│   └── routes/
│       ├── resources.js      # Team member API
│       ├── campaigns.js      # Campaign API
│       ├── mops.js           # MOPS ticket API
│       ├── capacity.js       # Capacity API
│       ├── config.js         # Config API
│       └── jira.js           # Jira proxy + import/create
├── src/
│   ├── pages/                # Page components
│   ├── components/           # Reusable UI components
│   ├── hooks/                # React hooks for data
│   ├── api/                  # API client modules
│   └── lib/                  # Constants and utilities
└── coh.db                    # SQLite database
```

## Database Schema

- **resources** - Team members with capacity
- **campaigns** - ENCAM tickets with scoping data
- **effort_breakdowns** - Effort by category per campaign
- **mops_tickets** - MOPS execution tickets
- **capacity_allocations** - Weekly capacity tracking
- **audit_log** - Action history
- **config** - App configuration (Jira creds, etc.)

## API Endpoints

### Resources
- `GET /api/resources` - List all active resources
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Soft delete resource

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### MOPS Tickets
- `GET /api/mops` - List all MOPS tickets
- `POST /api/mops` - Create MOPS ticket
- `PUT /api/mops/:id` - Update MOPS ticket

### Capacity
- `GET /api/capacity?weeksAhead=3` - Get resource capacity
- `GET /api/capacity/next-available?resourceId=X&estimatedHours=Y` - Find next slot
- `GET /api/capacity/suggest?estimatedHours=X&role=Y` - Suggest resources
- `GET /api/capacity/team-utilization` - Team utilization %

### Jira Integration
- `POST /api/jira/proxy` - Proxy Jira API calls
- `POST /api/jira/import-encam` - Import ENCAM tickets
- `POST /api/jira/create-mops` - Create MOPS ticket in Jira
- `POST /api/jira/sync-mops/:id` - Sync MOPS status from Jira

### Config
- `GET /api/config/:key` - Get config value
- `PUT /api/config/:key` - Set config value

## Configuration

1. Navigate to **Settings** page
2. Enter Jira credentials:
   - Domain (e.g., `yourcompany.atlassian.net`)
   - Email address
   - API Token (from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens))
3. Test connection
4. Configure source project (ENCAM) and target project (MOPS)
5. Save configuration

## Usage Flow

1. **Configure Jira** in Settings
2. **Add team members** in Resources page
3. **Import campaigns** from Jira in Intake Queue
4. **View campaigns** in Campaign Backlog
5. **Check capacity** in Resource Bandwidth
6. **Monitor progress** in Dashboard

## Port Configuration

No conflicts with existing apps:
- COH: Frontend 5175, API 3003
- Resource Planner: Frontend 5174, API 3002
- Local AI Chat: Frontend 5173, API 3001

## ✅ Full MVP Complete!

All features from PRD Phases 1-3 are implemented and functional:

1. ✅ **Scoping Panel** - Full effort breakdown with auto-suggestions
2. ✅ **MOPS Creation** - Complete Jira API integration with linking
3. ✅ **Deviation Tracking** - Automatic calculation and reporting
4. ✅ **Calendar View** - Interactive month/week timeline visualization

See `IMPLEMENTATION_COMPLETE.md` for full feature list and usage guide.

## Development

```bash
# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:server

# Build for production
npm run build
```

## Notes

- SQLite database is created automatically on first run
- All Jira credentials stored in `config` table (not in code)
- Capacity calculations run server-side for accuracy
- SLA dates auto-calculated based on complexity + team utilization
