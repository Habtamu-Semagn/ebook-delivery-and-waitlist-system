import {
  Code2,
  Brain,
  TrendingUp,
  DollarSign,
  Sprout,
  Palette,
  GraduationCap,
  BookOpen,
} from 'lucide-react'

const categories = [
  { icon: Code2, name: 'Programming', slug: 'programming', count: '1,240' },
  { icon: Brain, name: 'Artificial Intelligence', slug: 'ai', count: '830' },
  { icon: TrendingUp, name: 'Business', slug: 'business', count: '720' },
  { icon: DollarSign, name: 'Finance', slug: 'finance', count: '540' },
  { icon: Sprout, name: 'Self Development', slug: 'self-development', count: '910' },
  { icon: Palette, name: 'Design', slug: 'design', count: '450' },
  { icon: GraduationCap, name: 'Education', slug: 'education', count: '680' },
  { icon: BookOpen, name: 'Fiction', slug: 'fiction', count: '1,100' },
  { icon: BookOpen, name: 'Other', slug: 'other', count: '320' },
]

export function Categories() {
  return (
    <section
      id="categories"
      style={{ background: '#0F172A' }}
      className="px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-4xl font-medium mb-4"
            style={{ color: '#FFFFFF' }}
          >
            Browse by category
          </h2>
          <p style={{ color: '#94A3B8' }}>
            Discover books across every discipline you care about
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <a
                key={cat.name}
                href={`/books/category/${cat.slug}`}
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '20px',
                  boxShadow: '0 10px 40px rgba(0,0,0,.35)',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  display: 'block',
                  textDecoration: 'none',
                }}
                className="p-6"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(16,185,129,.18)'
                  e.currentTarget.style.borderColor = '#10B981'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,.35)'
                  e.currentTarget.style.borderColor = '#334155'
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
                    marginBottom: '0.75rem',
                  }}
                >
                  <Icon size={22} color="#10B981" />
                </div>
                <div className="font-medium text-sm mb-1" style={{ color: '#FFFFFF' }}>
                  {cat.name}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>
                  {cat.count} books
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}