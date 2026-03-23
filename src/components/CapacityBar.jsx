import { AlertTriangle } from 'lucide-react'

const CapacityBar = ({ allocated, capacity, showLabel = true }) => {
  const isOverloaded = allocated > capacity
  const utilizationPct = Math.min((allocated / capacity) * 100, 100)
  
  const getColor = () => {
    if (isOverloaded) return 'bg-red-500'
    if (utilizationPct >= 80) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-600">Capacity</span>
          <span className={`text-xs font-medium ${isOverloaded ? 'text-red-600' : 'text-gray-900'}`}>
            {allocated}h / {capacity}h
            {isOverloaded && <AlertTriangle size={12} className="inline ml-1" />}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${getColor()}`}
          style={{ width: `${utilizationPct}%` }}
        />
      </div>
    </div>
  )
}

export default CapacityBar
