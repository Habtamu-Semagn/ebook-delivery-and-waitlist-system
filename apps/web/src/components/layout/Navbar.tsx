import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav
      style={{
        background: 'rgba(2,6,23,.75)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}
      className="sticky top-0 z-50 px-6"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16">

        <a href="/" className="text-xl font-medium text-white no-underline">
          book<span style={{ color: '#10B981' }}>shelf</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Home', href: '#hero' },
            { label: 'Categories', href: '#categories' },
            { label: 'Books', href: '#featured' },
            { label: 'About', href: '#about' },
            { label: 'Contact', href: '#newsletter' }
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm no-underline transition-colors duration-200"
              style={{ color: '#94A3B8', scrollBehavior: 'smooth' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              onClick={(e) => {
                e.preventDefault()
                const element = document.querySelector(link.href)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <a
                href="/purchases"
                className="text-sm no-underline"
                style={{ color: '#10B981' }}
              >
                My Purchases
              </a>
              <Button variant="secondary" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (window.location.href = '/login')}
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = '/login')}
              >
                Get started
              </Button>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}