import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BookOpen, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { createOrder, fetchBookById } from '../../lib/api'

export const Route = createFileRoute('/books/$bookId')({
  component: BookDetailPage,
})

interface BookDetail {
  id: string
  title: string
  author: string
  description: string
  category: string
  price: number
  rating?: number
}

const covers = [
  'linear-gradient(135deg, #1e3a5f, #0f2040)',
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #1a0a2e, #2d1b69)',
  'linear-gradient(135deg, #134e4a, #064e3b)',
  'linear-gradient(135deg, #3b1f1f, #5c2a2a)',
]

function BookDetailPage() {
  const { bookId } = Route.useSearch() as { bookId?: string } & Record<string, any>
  const { bookId: bookIdParam } = Route.useParams() as { bookId: string }
  const id = bookId || bookIdParam
  
  const { user, loading: authLoading, getToken } = useAuth()
  const [book, setBook] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true)
        const data = await fetchBookById(id)
        setBook(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch book')
        setBook(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchBook()
  }, [id])

  const handleBuy = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    setIsCheckingOut(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Failed to get auth token')
      const data = await createOrder(id, token)
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else {
        console.error('No session URL returned:', data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      console.error('Checkout failed:', message)
      setError(`Checkout failed: ${message}`)
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div style={{ color: '#94A3B8' }}>Loading book details...</div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#020617' }}>
        <div className="max-w-md w-full text-center">
          <AlertCircle size={48} color="#94A3B8" className="mx-auto mb-4" />
          <h2 className="text-2xl font-medium text-white mb-3">Book not found</h2>
          <p style={{ color: '#94A3B8' }} className="mb-6">
            {error || 'The book you are looking for does not exist.'}
          </p>
          <Button variant="primary" onClick={() => (window.location.href = '/')}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  const coverIndex = book?.title ? book.title.charCodeAt(0) % covers.length : 0
  const initials = book?.title
    ? book.title
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'N/A'

  // Generate image URL from Supabase storage if image_url exists
  const imageUrl = book?.image_url 
    ? `http://localhost:54321/storage/v1/object/public/book-images/${book.image_url}`
    : null

  return (
    <main style={{ background: '#020617', minHeight: '100vh' }}>
      {/* Header with back button */}
      <div className="px-6 py-6 sticky top-0 z-40" style={{ background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: '#94A3B8',
              background: '#1E293B',
              border: '1px solid #334155',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1E293B'
              e.currentTarget.style.color = '#94A3B8'
            }}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-2 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <div
                style={{
                  background: imageUrl ? 'transparent' : covers[coverIndex],
                  borderRadius: '16px',
                  aspectRatio: '3/4',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 20px 60px rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  overflow: 'hidden',
                }}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={book.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    <BookOpen size={48} color="rgba(255,255,255,0.3)" />
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '32px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                      }}
                    >
                      {initials}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="md:col-span-2">
              {/* Category Badge */}
              <div className="mb-6">
                <span
                  className="text-xs px-3 py-1.5 rounded-full font-medium inline-block"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {book.author} category
                </span>
              </div>

              {/* Title & Author */}
              <h1 className="text-4xl font-medium text-white mb-2">{book.title}</h1>
              <p className="text-lg mb-8" style={{ color: '#94A3B8' }}>
                by <span style={{ color: '#10B981' }}>{book.author}</span>
              </p>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} style={{ color: '#FBBF24' }}>
                      ★
                    </span>
                  ))}
                </div>
                <span style={{ color: '#94A3B8' }} className="text-sm">
                  {book.rating || 4.8} / 5.0 (128 reviews)
                </span>
              </div>

              {/* Price */}
              <div
                className="p-6 rounded-lg mb-8"
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                }}
              >
                <p style={{ color: '#94A3B8' }} className="text-sm mb-2">
                  Price
                </p>
                <p className="text-3xl font-medium text-white">
                  ₹{(book.price / 100).toFixed(2)}
                </p>
              </div>

              {/* Description */}
              <div className="mb-10">
                <h3 className="text-lg font-medium text-white mb-4">About this book</h3>
                <p style={{ color: '#CBD5E1', lineHeight: '1.8' }}>
                  {book.description}
                </p>
              </div>

              {/* Features */}
              <div
                className="p-6 rounded-lg mb-10"
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p style={{ color: '#94A3B8' }} className="text-sm mb-1">
                      Format
                    </p>
                    <p className="text-white font-medium">PDF eBook</p>
                  </div>
                  <div>
                    <p style={{ color: '#94A3B8' }} className="text-sm mb-1">
                      Access
                    </p>
                    <p className="text-white font-medium">Lifetime</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isCheckingOut}
                  onClick={handleBuy}
                >
                  {isCheckingOut ? 'Processing...' : 'Buy Now'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => (window.location.href = '/')}
                >
                  Continue Shopping
                </Button>
              </div>

              {error && (
                <div
                  className="mt-4 p-4 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5',
                  }}
                >
                  {error}
                </div>
              )}

              {!user && (
                <p style={{ color: '#94A3B8' }} className="text-sm text-center mt-4">
                  <a href="/login" style={{ color: '#10B981' }} className="hover:underline">
                    Sign in
                  </a>{' '}
                  to purchase this book
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
