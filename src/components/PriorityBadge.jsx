import { PRIORITIES } from '../lib/constants'

const PriorityBadge = ({ priority }) => {
  const priorityInfo = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1]
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${priorityInfo.color}`}>
      {priorityInfo.label}
    </span>
  )
}

export default PriorityBadge
