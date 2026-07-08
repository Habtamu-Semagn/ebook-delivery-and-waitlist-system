import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CheckCircle, Download, BookOpen } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/success')({
  component: SuccessPage,
})

function SuccessPage() {
  const { user, loading } = useAuth()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSessionId(params.get('session_id'))
  }, [])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: '#94A3B8' }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div
        style={{
          background: '#1E293B',
          border: '1px solid #334155',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,.35)',
          maxWidth: '480px',
          width: '100%',
        }}
        className="p-10 text-center"
      >
        {/* Success icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            background: 'rgba(16,185,129,0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <CheckCircle size={36} color="#10B981" />
        </div>

        <h1 className="text-3xl font-medium text-white mb-3">
          Purchase confirmed!
        </h1>
        <p className="mb-8" style={{ color: '#94A3B8' }}>
          Your payment was successful. Check your email for the download link,
          or access your purchases below.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/purchases')}
          >
            <BookOpen size={16} style={{ marginRight: '8px' }} />
            Go to My Purchases
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/')}
          >
            Browse more books
          </Button>
        </div>

        {sessionId && (
          <p className="text-xs mt-6" style={{ color: '#475569' }}>
            Order ID: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  )
}