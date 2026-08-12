import { useState } from 'react'
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
      id="hero"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0a1628 50%, #0d1f2d 100%)',
      }}
      className="px-6 py-24"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center">
        {/* Left */}
        <div>
          <h1
            className="text-5xl font-medium leading-tight mb-6 uppercase tracking-widest font-bold"
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

           <img
        src="/book_transparent.png"
        alt="Transparent book"
        className='md:block hidden w-full h-auto'
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      />
</div>
    </section>
  )
}