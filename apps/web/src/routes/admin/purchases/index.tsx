import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ResendEmailButton } from '#/components/admin/purchases/ResendEmailButton'

export const Route = createFileRoute('/admin/purchases/')({
  component: AdminPurchases,
})

interface Purchase {
  id: string
  amount: number
  status: string
  created_at: string
  users?: { email: string }
  books?: { title: string }
}

function AdminPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const token = await getAuthToken()
      const response = await fetch('/api/admin/purchases', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch purchases')
      const data = await response.json()
      setPurchases(data)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async () => {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')
    return user.getIdToken()
  }

  if (loading) {
    return <div className="p-6 text-gray-900 font-medium">Loading purchases...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-2">
        <h1 className="text-4xl font-bold text-gray-900">Purchases</h1>
        <p className="text-gray-600 mt-1">Manage customer purchases and resend confirmation emails</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Book</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-3" style={{ fontSize: '48px' }}>📚</div>
                    <p className="text-gray-600 font-medium mb-1">No purchases yet</p>
                    <p className="text-gray-500 text-sm">Purchase data will appear here when customers buy books</p>
                  </div>
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{purchase.users?.email || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{purchase.books?.title || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">${(purchase.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-100 text-green-900 rounded text-xs font-bold border border-green-300">
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(purchase.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <ResendEmailButton purchaseId={purchase.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
