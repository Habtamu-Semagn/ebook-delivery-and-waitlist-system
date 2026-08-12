import { BookOpen } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { createOrder } from '../../lib/api'
import type { Book } from '../../lib/types'

interface BookCardProps {
  book: Book
  badge?: 'bestseller' | 'new' | 'sale'
}

const covers = [
  'linear-gradient(135deg, #1e3a5f, #0f2040)',
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #1a0a2e, #2d1b69)',
  'linear-gradient(135deg, #134e4a, #064e3b)',
  'linear-gradient(135deg, #3b1f1f, #5c2a2a)',
]

export function BookCard({ book, badge }: BookCardProps) {
  const { user, getToken } = useAuth()

  const handleBuy = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    const token = await getToken()
    if (!token) return
    const data = await createOrder(book.id, token)
    if (data.sessionUrl) {
      window.location.href = data.sessionUrl
    }
  }

  const coverIndex = book.title.charCodeAt(0) % covers.length
  const initials = book.title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  // Generate image URL from Supabase storage if image_url exists
  const imageUrl = book.image_url 
    ? `http://localhost:54321/storage/v1/object/public/book-images/${book.image_url}`
    : null

  return (
    <div>
      <Link to="/books/$bookId" params={{ bookId: book.id }} style={{ textDecoration: 'none' }}>
        <div
          style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,.35)',
            transition: 'all 0.25s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)'
            e.currentTarget.style.boxShadow = '0 15px 45px rgba(16,185,129,.2)'
            e.currentTarget.style.borderColor = '#10B981'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,.35)'
            e.currentTarget.style.borderColor = '#334155'
          }}
        >
          {/* Cover */}
          <div
            style={{
              background: imageUrl ? 'transparent' : covers[coverIndex],
              height: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              gap: '8px',
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
                    fontSize: '22px',
                    fontWeight: '600',
                    letterSpacing: '2px',
                  }}
                >
                  {initials}
                </span>
              </>
            )}

            {badge && (
              <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                <Badge variant={badge}>
                  {badge === 'bestseller' ? 'Bestseller' : badge === 'new' ? 'New' : 'Sale'}
                </Badge>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-5">
            <div
              className="font-medium text-sm mb-1 truncate"
              style={{ color: '#FFFFFF' }}
            >
              {book.title}
            </div>
            <div className="text-xs mb-4" style={{ color: '#94A3B8' }}>
              {book.author}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-base" style={{ color: '#10B981' }}>
                ${(book.price / 100).toFixed(2)}
              </span>
              <span className="text-xs" style={{ color: '#FBBF24' }}>
                ★★★★★
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div style={{ padding: '0 20px 20px 20px', marginTop: '-14px' }}>
        <Button variant="primary" size="sm" fullWidth onClick={handleBuy}>
          Buy now
        </Button>
      </div>
    </div>
  )
}