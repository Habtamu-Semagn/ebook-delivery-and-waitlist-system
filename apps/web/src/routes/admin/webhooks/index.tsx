import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RetryWebhookButton } from '#/components/admin/webhooks/RetryWebhookButton'
import { WebhooksStatusBadge } from '#/components/admin/webhooks/WebhooksStatusBadge'

export const Route = createFileRoute('/admin/webhooks/')({
  component: AdminWebhooks,
})

interface WebhookEvent {
  id: string
  event_id: string
  status: 'pending' | 'processed' | 'failed'
  payload: Record<string, any>
  created_at: string
}

function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const token = await getAuthToken()
      const response = await fetch('/api/admin/webhooks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch webhooks')
      const data = await response.json()
      setWebhooks(data)
    } catch (error) {
      console.error('Error fetching webhooks:', error)
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

  const handleRetry = (webhookId: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === webhookId ? { ...w, status: 'pending' as const } : w
    ))
    fetchWebhooks()
  }

  if (loading) {
    return <div className="p-6">Loading webhooks...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-2">
        <h1 className="text-4xl font-bold text-gray-900">Webhook Events</h1>
        <p className="text-gray-600 mt-1">Monitor and manage webhook events</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Event ID</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Payload</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {webhooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-3" style={{ fontSize: '48px' }}>◉</div>
                    <p className="text-gray-600 font-medium mb-1">No webhook events</p>
                    <p className="text-gray-500 text-sm">Webhook events will appear here when they're received</p>
                  </div>
                </td>
              </tr>
            ) : (
              webhooks.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{webhook.event_id}</td>
                  <td className="px-6 py-4 text-sm">
                    <WebhooksStatusBadge status={webhook.status} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <code className="bg-gray-100 text-gray-900 px-3 py-2 rounded text-xs font-mono break-words max-w-xs block">
                      {JSON.stringify(webhook.payload, null, 2).substring(0, 80)}...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(webhook.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    {webhook.status === 'failed' ? (
                      <RetryWebhookButton webhookId={webhook.id} onRetry={handleRetry} />
                    ) : (
                      <span className="text-gray-700 text-xs font-medium">—</span>
                    )}
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
