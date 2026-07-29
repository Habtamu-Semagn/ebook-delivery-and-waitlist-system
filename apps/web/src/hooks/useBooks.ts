import { useState, useEffect } from 'react'
import { fetchBooks } from '../lib/api'

export interface Book {
  id: string
  title: string
  description: string
  price: number
  author: string
  is_active: boolean
}

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { books, loading, error }
}