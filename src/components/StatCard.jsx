const StatCard = ({ icon: Icon, label, value, color = 'blue', trend }) => {
  return (
    <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 bg-${color}-50 rounded-lg`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="font-medium text-gray-600 mb-1 text-sm">{label}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default StatCard
