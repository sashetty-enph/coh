const StatusBadge = ({ status, statuses }) => {
  const statusInfo = statuses.find(s => s.value === status) || statuses[0]
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${statusInfo.color}`}>
      {statusInfo.label}
    </span>
  )
}

export default StatusBadge
