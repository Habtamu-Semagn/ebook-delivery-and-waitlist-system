import { BookCard } from '../books/BookCard'
import { useBooks } from '../../hooks/useBooks'

export function FeaturedBooks() {
  const { books, loading, error } = useBooks()

  return (
    <section id="featured" className="px-6 py-20" style={{ background: '#020617' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-4xl font-medium mb-4"
            style={{ color: '#FFFFFF' }}
          >
            Popular eBooks
          </h2>
          <p style={{ color: '#94A3B8' }}>
            Handpicked titles readers keep coming back to
          </p>
        </div>

        {loading && (
          <div className="text-center py-20" style={{ color: '#94A3B8' }}>
            Loading books...
          </div>
        )}

        {error && (
          <div className="text-center py-20" style={{ color: '#ef4444' }}>
            Failed to load books.
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="text-center py-20" style={{ color: '#94A3B8' }}>
            No books available yet.
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                badge={index === 0 ? 'bestseller' : index === 1 ? 'new' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}