import { 
  LayoutDashboard, 
  Inbox, 
  FolderKanban, 
  Users, 
  Calendar, 
  Settings,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const Sidebar = ({ activeTab, setActiveTab, jiraConnected }) => {
  const [collapsed, setCollapsed] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'intake', label: 'Intake Queue', icon: Inbox, badge: !jiraConnected },
    { id: 'backlog', label: 'Campaign Backlog', icon: FolderKanban },
    { id: 'bandwidth', label: 'Resource Bandwidth', icon: Activity },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'deviation', label: 'Deviation Log', icon: AlertTriangle },
    { id: 'resources', label: 'Resources', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings, badge: !jiraConnected },
  ]

  return (
    <nav className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} border-gray-200 bg-white shadow-sm flex flex-col`}>
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">COH</h1>
              <p className="text-xs text-gray-500">Campaign Ops Hub</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center w-full rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}`}
              >
                <Icon size={20} className={collapsed ? '' : 'mr-3'} />
                {!collapsed && <span className="text-sm">{tab.label}</span>}
                {tab.badge && !collapsed && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white font-medium">!</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold ${collapsed ? '' : 'shrink-0'}`}>
            PM
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Project Manager</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Sidebar
