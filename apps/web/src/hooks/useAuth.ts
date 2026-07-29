import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const getToken = async () => {
    if (!user) return null
    return user.getIdToken()
  }

  const signOut = () => auth.signOut()

  return { user, loading, getToken, signOut }
}