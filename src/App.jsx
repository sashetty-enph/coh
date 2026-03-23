import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import IntakeQueue from './pages/IntakeQueue'
import CampaignBacklog from './pages/CampaignBacklog'
import ResourceBandwidth from './pages/ResourceBandwidth'
import CalendarView from './pages/CalendarView'
import DeviationLog from './pages/DeviationLog'
import Resources from './pages/Resources'
import Settings from './pages/Settings'
import { useJiraConfig } from './hooks/useJiraConfig'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { isConnected } = useJiraConfig()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        jiraConnected={isConnected}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'intake' && <IntakeQueue />}
          {activeTab === 'backlog' && <CampaignBacklog />}
          {activeTab === 'bandwidth' && <ResourceBandwidth />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'deviation' && <DeviationLog />}
          {activeTab === 'resources' && <Resources />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}

export default App
