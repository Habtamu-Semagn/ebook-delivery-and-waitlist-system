import { useState } from 'react'
import { RotateCw } from 'lucide-react'

interface RetryWebhookButtonProps {
  webhookId: string
  onRetry: (webhookId: string) => void
}

export function RetryWebhookButton({ webhookId, onRetry }: RetryWebhookButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)
    try {
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      const token = await auth.currentUser?.getIdToken()

      const response = await fetch(`/api/admin/webhooks/${webhookId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to retry webhook')

      onRetry(webhookId)
    } catch (error) {
      console.error('Error retrying webhook:', error)
      alert('Failed to retry webhook')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RotateCw className="h-4 w-4" />
      {loading ? 'Retrying...' : 'Retry'}
    </button>
  )
}
