const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Frontend Engineer',
    quote:
      'The TypeScript book completely changed how I write code. Worth every penny — I refer back to it weekly.',
    rating: 5,
  },
  {
    name: 'Marcus Webb',
    role: 'Startup Founder',
    quote:
      'Instant download, clean PDF, no bloat. Exactly what I needed. The business strategy book paid for itself in a week.',
    rating: 5,
  },
  {
    name: 'Amara Osei',
    role: 'ML Engineer',
    quote:
      'Best curated ebook store I have found. The AI titles are genuinely advanced — not the usual beginner fluff.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section style={{ background: '#020617' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-4xl font-medium mb-4"
            style={{ color: '#FFFFFF' }}
          >
            What readers are saying
          </h2>
          <p style={{ color: '#94A3B8' }}>
            Trusted by thousands of developers, founders, and lifelong learners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0,0,0,.35)',
                transition: 'all 0.25s',
              }}
              className="p-7"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(16,185,129,.18)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,.35)'
              }}
            >
              <div className="text-sm mb-1" style={{ color: '#FBBF24' }}>
                {'★'.repeat(t.rating)}
              </div>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: '#CBD5E1' }}
              >
                "{t.quote}"
              </p>
              <div>
                <div className="font-medium text-sm" style={{ color: '#FFFFFF' }}>
                  {t.name}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>
                  {t.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}