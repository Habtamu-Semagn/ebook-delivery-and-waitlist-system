import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '#/components/ui/Button'
import { Book } from '#/lib/types'
import { fetchBooksByCategory } from '#/lib/api'
import { useAuth } from '#/hooks/useAuth'
import { createOrder } from '#/lib/api'

const CATEGORY_NAMES: Record<string, string> = {
  'programming': 'Programming',
  'ai': 'Artificial Intelligence',
  'business': 'Business',
  'finance': 'Finance',
  'self-development': 'Self Development',
  'design': 'Design',
  'education': 'Education',
  'fiction': 'Fiction',
  'other': 'Other',
}

const covers = [
  'linear-gradient(135deg, #1e3a5f, #0f2040)',
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #1a0a2e, #2d1b69)',
  'linear-gradient(135deg, #134e4a, #064e3b)',
  'linear-gradient(135deg, #3b1f1f, #5c2a2a)',
]

function HorizontalBookItem({ book }: { book: Book }) {
  const { user, getToken } = useAuth()
  const [buying, setBuying] = useState(false)

  const handleBuy = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    
    setBuying(true)
    try {
      const token = await getToken()
      if (!token) return
      const data = await createOrder(book.id, token)
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      }
    } catch (error) {
      console.error('Buy error:', error)
    } finally {
      setBuying(false)
    }
  }

  const coverIndex = book.title.charCodeAt(0) % covers.length
  const initials = book.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const imageUrl = book.image_url 
    ? `http://localhost:54321/storage/v1/object/public/book-images/${book.image_url}`
    : null

  return (
    <div
      style={{
        background: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        transition: 'all 0.25s',
        boxShadow: '0 4px 20px rgba(0,0,0,.2)',
      }}
      className="hover:shadow-xl"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#10B981'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#334155'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Image on the left */}
      <div
        style={{
          background: imageUrl ? 'transparent' : covers[coverIndex],
          width: '120px',
          height: '160px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
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
            <BookOpen size={32} color="rgba(255,255,255,0.3)" />
            <span
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '2px',
                marginTop: '8px',
              }}
            >
              {initials}
            </span>
          </>
        )}
      </div>

      {/* Book details in the middle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            color: '#FFFFFF',
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          {book.title}
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '12px' }}>
          by {book.author}
        </p>
        <p
          style={{
            color: '#CBD5E1',
            fontSize: '14px',
            lineHeight: '1.6',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {book.description}
        </p>
        <div style={{ marginTop: '12px' }}>
          <span
            style={{
              color: '#10B981',
              fontSize: '24px',
              fontWeight: '700',
            }}
          >
            ${(book.price / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Buy button on the right */}
      <div style={{ flexShrink: 0 }}>
        <Button
          variant="primary"
          size="lg"
          onClick={handleBuy}
          disabled={buying}
        >
          {buying ? 'Processing...' : 'Buy Now'}
        </Button>
      </div>
    </div>
  )
}

function CategoryPage() {
  const { category } = Route.useParams()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBooks()
  }, [category])

  const loadBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchBooksByCategory(category)
      setBooks(data || [])
    } catch (err) {
      console.error('Error fetching books:', err)
      setError(err instanceof Error ? err.message : 'Failed to load books')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  const categoryTitle = CATEGORY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0a1628 50%, #0d1f2d 100%)',
        }}
        className="px-6 py-16"
      >
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 mb-8 text-sm font-medium"
            style={{ color: '#10B981' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: '#FFFFFF' }}
            >
              {categoryTitle}
            </h1>
            <p style={{ color: '#CBD5E1' }}>
              Discover {books.length} {books.length === 1 ? 'book' : 'books'} in this category
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 py-20" style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p style={{ color: '#94A3B8' }}>Loading books...</p>
              </div>
            </div>
          ) : error ? (
            <div
              className="p-8 rounded-lg text-center"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
              }}
            >
              <p className="mb-4">{error === 'Invalid category' ? 'This category does not exist' : error}</p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Go back home
              </Button>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20">
              <p style={{ color: '#94A3B8' }} className="text-lg mb-4">
                No books uploaded yet in {categoryTitle}
              </p>
              <p style={{ color: '#64748B' }} className="text-sm mb-6">
                Check back soon for new titles in this category, or explore other categories.
              </p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Browse all categories
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {books.map((book) => (
                <HorizontalBookItem key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export const Route = createFileRoute('/books/category/$category')({
  component: CategoryPage,
})
