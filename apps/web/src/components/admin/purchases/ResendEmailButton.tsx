import { useState } from 'react'
import { RotateCw } from 'lucide-react'

interface ResendEmailButtonProps {
  purchaseId: string
}

export function ResendEmailButton({ purchaseId }: ResendEmailButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      const token = await auth.currentUser?.getIdToken()

      const response = await fetch(`/api/purchases/${purchaseId}/resend-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Failed to resend email')

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error resending email:', error)
      alert('Failed to resend email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm transition-colors ${
        success
          ? 'bg-green-600 text-white'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <RotateCw className="h-4 w-4" />
      {loading ? 'Sending...' : success ? 'Sent!' : 'Resend'}
    </button>
  )
}
