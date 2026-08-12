interface StatsCardProps {
  title: string
  value: string
}

export function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <h3 className="text-2xl text-gray-400 font-semibold">{value}</h3>
    </div>
  )
}
