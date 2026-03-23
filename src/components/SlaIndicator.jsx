import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { SLA_STATUS } from '../lib/constants'

const SlaIndicator = ({ slaDate, status = 'none' }) => {
  const statusInfo = SLA_STATUS[status] || SLA_STATUS.none
  
  const getIcon = () => {
    switch (status) {
      case 'on_track':
        return <CheckCircle size={14} />
      case 'at_risk':
        return <Clock size={14} />
      case 'breached':
        return <AlertTriangle size={14} />
      default:
        return null
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No SLA'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${statusInfo.color}`}>
      {getIcon()}
      <span>{formatDate(slaDate)}</span>
    </div>
  )
}

export default SlaIndicator
