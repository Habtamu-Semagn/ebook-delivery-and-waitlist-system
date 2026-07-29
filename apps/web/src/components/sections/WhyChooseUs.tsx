import {
  Library,
  Zap,
  ShieldCheck,
  Smartphone,
  BadgeDollarSign,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Library,
    title: 'Huge collection',
    desc: 'Over 10,000 titles across every genre and discipline, updated weekly.',
  },
  {
    icon: Zap,
    title: 'Instant download',
    desc: 'Buy and get your PDF link within seconds. No waiting, no subscriptions.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payments',
    desc: 'Powered by Stripe. Your card details never touch our servers.',
  },
  {
    icon: Smartphone,
    title: 'Read anywhere',
    desc: 'PDF format works on every device — phone, tablet, laptop, or e-reader.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Affordable pricing',
    desc: 'Pay once, own forever. No monthly fees, no paywalls after purchase.',
  },
  {
    icon: Sparkles,
    title: 'Curated selection',
    desc: 'Every book is reviewed before listing. Quality over quantity, always.',
  },
]

export function WhyChooseUs() {
  return (
    <section style={{ background: '#0F172A' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-4xl font-medium mb-4"
            style={{ color: '#FFFFFF' }}
          >
            Why readers love our platform
          </h2>
          <p style={{ color: '#94A3B8' }}>
            Everything you need, nothing you don't
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
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
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    background: 'rgba(16,185,129,0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Icon size={22} color="#10B981" />
                </div>
                <div className="font-medium mb-2" style={{ color: '#FFFFFF' }}>
                  {feature.title}
                </div>
                <div className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
                  {feature.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}