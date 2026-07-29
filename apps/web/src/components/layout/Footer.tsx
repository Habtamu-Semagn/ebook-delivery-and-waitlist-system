export function Footer() {
  return (
    <footer
      style={{
        background: '#010409',
        borderTop: '1px solid #1E293B',
      }}
      className="px-6 py-12"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xl font-medium text-white">
          book<span style={{ color: '#10B981' }}>shelf</span>
        </div>

        <div className="flex gap-6 flex-wrap justify-center">
          {['About', 'Books', 'Categories', 'Contact', 'Privacy'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm no-underline transition-colors duration-200"
              style={{ color: '#64748B' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              {link}
            </a>
          ))}
        </div>

        <p style={{ color: '#475569' }} className="text-xs">
          © 2026 Bookshelf. All rights reserved.
        </p>
      </div>
    </footer>
  )
}