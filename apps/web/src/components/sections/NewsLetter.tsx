import { useState } from 'react'
import { Button } from '../ui/Button'
import { joinWaitlist } from '../../lib/api'

export function Newsletter() {
  const [email, setEmail] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await joinWaitlist(email)
      setMessage(data.message)
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #064E3B, #065F46, #022C22)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="px-6 py-20 text-center"
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '200px',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="max-w-xl mx-auto relative z-10">
        <h2
          className="text-4xl font-medium mb-4"
          style={{ color: '#FFFFFF' }}
        >
          Never miss new releases
        </h2>
        <p className="mb-8 text-base" style={{ color: '#6EE7B7' }}>
          Join thousands of readers who get early access and exclusive discounts.
        </p>

        {message ? (
          <p className="text-lg font-medium" style={{ color: '#FFFFFF' }}>
            {message}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 max-w-md mx-auto mb-6"
          >
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value ?? '')}
              required
              className="flex-1 px-4 py-2 text-sm rounded-lg outline-none"
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')
              }
            />
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Joining...' : 'Subscribe'}
            </Button>
          </form>
        )}

        <div className="flex justify-center gap-8 flex-wrap">
          {['Exclusive discounts', 'Weekly recommendations', 'Early access'].map(
            (perk) => (
              <div
                key={perk}
                className="flex items-center gap-2 text-sm"
                style={{ color: '#6EE7B7' }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    background: '#34D399',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
                {perk}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  )
}