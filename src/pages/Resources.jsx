import { useState } from 'react'
import { Users, Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { useResources } from '../hooks/useResources'
import { useJiraConfig } from '../hooks/useJiraConfig'
import { RESOURCE_COLORS } from '../lib/constants'
import { v4 as uuidv4 } from 'uuid'
import CapacityBar from '../components/CapacityBar'

const Resources = () => {
  const { resources, createResource, updateResource, deleteResource } = useResources()
  const { config, isConnected } = useJiraConfig()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    color: RESOURCE_COLORS[0],
    weeklyCapacityHrs: 40,
    jiraAccountId: ''
  })
  const [jiraUsers, setJiraUsers] = useState([])

  const handleAdd = async () => {
    if (!formData.name.trim()) return
    
    try {
      await createResource(formData)
      setFormData({
        name: '',
        role: '',
        color: RESOURCE_COLORS[0],
        weeklyCapacityHrs: 40,
        jiraAccountId: ''
      })
      setIsAdding(false)
    } catch (error) {
      alert(`Failed to create resource: ${error.message}`)
    }
  }

  const handleUpdate = async (id) => {
    try {
      await updateResource(id, formData)
      setEditingId(null)
      setFormData({
        name: '',
        role: '',
        color: RESOURCE_COLORS[0],
        weeklyCapacityHrs: 40,
        jiraAccountId: ''
      })
    } catch (error) {
      alert(`Failed to update resource: ${error.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    try {
      await deleteResource(id)
    } catch (error) {
      alert(`Failed to delete resource: ${error.message}`)
    }
  }

  const startEdit = (resource) => {
    setEditingId(resource.id)
    setFormData({
      name: resource.name,
      role: resource.role || '',
      color: resource.color || RESOURCE_COLORS[0],
      weeklyCapacityHrs: resource.weeklyCapacityHrs || 40,
      jiraAccountId: resource.jiraAccountId || ''
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Resources</h1>
          <p className="text-gray-500 mt-1">Manage your team members and track their capacity</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {isAdding && (
        <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Smith"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Role / Title</label>
              <input
                type="text"
                placeholder="e.g. Email Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Weekly Capacity (hours)</label>
              <input
                type="number"
                value={formData.weeklyCapacityHrs}
                onChange={(e) => setFormData({ ...formData, weeklyCapacityHrs: parseFloat(e.target.value) || 40 })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                min="1"
                max="80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Avatar Color</label>
              <div className="flex gap-2 pt-1">
                {RESOURCE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
              <Check size={15} /> Save Member
            </button>
            <button
              onClick={() => { setIsAdding(false); setFormData({ name: '', role: '', color: RESOURCE_COLORS[0], weeklyCapacityHrs: 40, jiraAccountId: '' }) }}
              className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium border border-gray-200 transition-colors"
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {resources.map(resource => (
          <div key={resource.id} className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            {editingId === resource.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Role</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Weekly hrs</label>
                  <input type="number" value={formData.weeklyCapacityHrs} onChange={(e) => setFormData({ ...formData, weeklyCapacityHrs: parseFloat(e.target.value) || 40 })} className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" min="1" max="80" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Color</label>
                  <div className="flex gap-2">
                    {RESOURCE_COLORS.map(color => (
                      <button key={color} onClick={() => setFormData({ ...formData, color })} className={`w-7 h-7 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => handleUpdate(resource.id)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={() => { setEditingId(null); setFormData({ name: '', role: '', color: RESOURCE_COLORS[0], weeklyCapacityHrs: 40, jiraAccountId: '' }) }} className="flex items-center gap-1.5 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium border border-gray-200 transition-colors">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: resource.color }}>
                      {resource.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                      <p className="text-sm text-gray-500">{resource.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(resource)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-50 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(resource.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Weekly Capacity</span>
                    <span className="text-sm font-medium text-gray-900">{resource.weeklyCapacityHrs || 40}h</span>
                  </div>
                  <div className="text-xs text-gray-400">Available for assignment</div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {resources.length === 0 && !isAdding && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg w-fit mx-auto mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No team members yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your first resource to start tracking capacity</p>
        </div>
      )}
    </div>
  )
}

export default Resources
