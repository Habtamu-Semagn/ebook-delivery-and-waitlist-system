const API_URL = 'http://localhost:3002'

export async function fetchBooks() {
  const res = await fetch(`${API_URL}/books`)
  if (!res.ok) throw new Error('Failed to fetch books')
  return res.json()
}

export async function fetchBookById(bookId: string) {
  const res = await fetch(`${API_URL}/books/${bookId}`)
  if (!res.ok) throw new Error('Failed to fetch book')
  return res.json()
}

export async function fetchPurchases(token: string) {
  const res = await fetch(`${API_URL}/purchases`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch purchases')
  return res.json()
}

export async function createOrder(bookId: string, token: string) {
  const res = await fetch(`${API_URL}/orders/${bookId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to create order')
  }
  return data
}

export async function getDownloadUrl(bookId: string, token: string) {
  const res = await fetch(`${API_URL}/books/${bookId}/download`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to get download URL')
  return res.json()
}

export async function joinWaitlist(email: string) {
  const res = await fetch(`${API_URL}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to join waitlist')
  return res.json()
}

export async function syncUser(token: string) {
  const res = await fetch(`${API_URL}/users/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to sync user')
  return res.json()
}