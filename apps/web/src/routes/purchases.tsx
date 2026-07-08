import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BookOpen, Download, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { getDownloadUrl, fetchPurchases } from '../lib/api'

export const Route = createFileRoute('/purchases')({
  component: PurchasesPage,
})

interface Purchase {
  id: string
  book_id: string
  status: string
  created_at: string
  books: {
    title: string
    author: string
    price: number
  }
}

function PurchasesPage() {
  const { user, loading, getToken } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  
  useEffect(() => {
    if (!user) return

    const fetchPurchasesData = async () => {
      const token = await getToken()
      if (!token) return
      try {
        const data = await fetchPurchases(token)
        setPurchases(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch purchases:', err)
        setPurchases([])
      } finally {
        setFetchLoading(false)
      }
    }

    fetchPurchasesData()
  }, [user])

  const handleDownload = async (bookId: string) => {
    setDownloadingId(bookId)
    try {
      const token = await getToken()
      if (!token) return
      const data = await getDownloadUrl(bookId, token)
      window.open(data.downloadUrl, '_blank')
    } catch (err) {
      console.error('Failed to get download URL:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading || fetchLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: '#94A3B8' }}
      >
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle size={48} color="#94A3B8" className="mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-white mb-3">
            Sign in to view purchases
          </h2>
          <Button
            variant="primary"
            onClick={() => (window.location.href = '/login')}
          >
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-medium text-white mb-2">My Purchases</h1>
        <p className="mb-10" style={{ color: '#94A3B8' }}>
          All your purchased books in one place.
        </p>
        {purchases.length === 0 ? (
          <div
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
            }}
            className="p-16 text-center"
          >
            <BookOpen size={48} color="#334155" className="mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              No purchases yet
            </h3>
            <p className="mb-6" style={{ color: '#64748B' }}>
              Browse our catalog and find your next great read.
            </p>
            <Button
              variant="primary"
              onClick={() => (window.location.href = '/')}
            >
              Browse books
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(0,0,0,.35)',
                }}
                className="p-6 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      background: 'linear-gradient(135deg, #134e4a, #064e3b)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={24} color="rgba(255,255,255,0.6)" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {purchase.books?.title ?? 'Unknown Book'}
                    </div>
                    <div className="text-sm" style={{ color: '#94A3B8' }}>
                      {purchase.books?.author ?? ''}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#475569' }}>
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      background:
                        purchase.status === 'completed'
                          ? 'rgba(16,185,129,0.1)'
                          : 'rgba(251,191,36,0.1)',
                      color:
                        purchase.status === 'completed' ? '#10B981' : '#FBBF24',
                      border: `1px solid ${purchase.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)'}`,
                    }}
                  >
                    {purchase.status}
                  </span>

                  {purchase.status === 'completed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={downloadingId === purchase.book_id}
                      onClick={() => handleDownload(purchase.book_id)}
                    >
                      <Download size={14} style={{ marginRight: '6px' }} />
                      {downloadingId === purchase.book_id
                        ? 'Loading...'
                        : 'Download'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}