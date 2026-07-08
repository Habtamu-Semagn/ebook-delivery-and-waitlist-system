import { useState } from 'react'
import { BookOpen, Download, Star } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { joinWaitlist } from '../../lib/api'

export function Hero() {
  const { user } = useAuth()
  const [email, setEmail] = useState<string>('')
  const [waitlistMessage, setWaitlistMessage] = useState<string>('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setWaitlistLoading(true)
    try {
      const data = await joinWaitlist(email)
      setWaitlistMessage(data.message)
    } catch {
      setWaitlistMessage('Something went wrong. Please try again.')
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0a1628 50%, #0d1f2d 100%)',
      }}
      className="px-6 py-24"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10B981',
            }}
          >
            ✦ New releases every week
          </div>

          <h1
            className="text-5xl font-medium leading-tight mb-6"
            style={{ color: '#FFFFFF', letterSpacing: '-1px' }}
          >
            Discover your next favorite{' '}
            <span style={{ color: '#10B981' }}>eBook</span>
          </h1>

          <p className="text-lg mb-8" style={{ color: '#CBD5E1' }}>
            Thousands of titles across tech, business, design, and more.
            Buy once, download instantly, read anywhere.
          </p>

          <div className="flex gap-4 flex-wrap mb-10">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                document
                  .getElementById('featured')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Explore books
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                document
                  .getElementById('categories')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Browse categories
            </Button>
          </div>

          <div
            className="flex gap-10 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { num: '10,000+', label: 'Books available' },
              { num: '500+', label: 'Authors' },
              { num: '50+', label: 'Categories' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-medium" style={{ color: '#fff' }}>
                  {stat.num}
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Book card with glow */}
        <div className="relative">
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '340px',
              height: '340px',
              background:
                'radial-gradient(circle, rgba(16,185,129,.25), transparent 70%)',
              filter: 'blur(80px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,.35)',
              position: 'relative',
              zIndex: 1,
            }}
            className="p-8"
          >
            {/* Book cover */}
            <div
              style={{
                background: 'linear-gradient(135deg, #134e4a, #064e3b)',
                borderRadius: '14px',
                overflow: 'hidden',
                position: 'relative',
              }}
              className="p-8 text-center mb-6"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <BookOpen size={52} color="rgba(255,255,255,0.4)" />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '28px',
                    fontWeight: '700',
                    letterSpacing: '3px',
                  }}
                >
                  MT
                </span>
              </div>
              <div className="text-xl font-medium text-white mt-4 mb-1">
                Mastering TypeScript
              </div>
              <div className="text-sm" style={{ color: '#6EE7B7' }}>
                John Doe · Senior Engineer
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-3xl font-medium text-white">$29.99</div>
                <div className="text-xs mt-1 flex items-center gap-1" style={{ color: '#94A3B8' }}>
                  <Download size={12} />
                  Instant PDF download
                </div>
              </div>
              <div className="text-right">
                <div
                  className="px-3 py-1 rounded-md text-xs"
                  style={{
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    color: '#FBBF24',
                  }}
                >
                  Bestseller
                </div>
                <div
                  className="text-xs mt-2 flex items-center justify-end gap-1"
                  style={{ color: '#FBBF24' }}
                >
                  <Star size={11} fill="#FBBF24" />
                  4.9
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() =>
                user
                  ? null
                  : (window.location.href = '/login')
              }
            >
              {user ? 'Buy now — $29.99' : 'Sign in to buy'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}