import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { StatsCard } from '#/components/admin/dashboard/StatsCard'
import { RevenueChart } from '#/components/admin/dashboard/RevenueChart'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

interface DashboardStats {
  totalRevenue: number
  totalPurchases: number
  waitlistCount: number
  recentPurchases: Array<{
    id: string
    created_at: string
    users?: { email: string }
    books?: { title: string; price: number }
  }>
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        })
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getAuthToken = async () => {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')
    return user.getIdToken()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Revenue" 
          value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} 
        />
        <StatsCard 
          title="Total Purchases" 
          value={String(stats?.totalPurchases || 0)} 
        />
        <StatsCard 
          title="Waitlist" 
          value={String(stats?.waitlistCount || 0)} 
        />
        <StatsCard 
          title="Active Users" 
          value={String(stats?.totalPurchases || 0)} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Purchases</h2>
          <div className="space-y-4">
            {(stats?.recentPurchases || []).map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{purchase.books?.title || 'Unknown Book'}</p>
                  <p className="text-xs text-gray-600 mt-1">{purchase.users?.email || 'Unknown User'}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 ml-4">${((purchase.books?.price || 0) / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}