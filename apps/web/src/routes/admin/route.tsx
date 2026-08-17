import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AdminSidebar } from '#/components/admin/layout/AdminSidebar'
import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const auth = getAuth()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate({ to: '/login' })
        return
      }

      try {
        const tokenResult = await user.getIdTokenResult(true)
        
        if (tokenResult.claims.admin === true) {
          setIsAdmin(true)
        } else {
          navigate({ to: '/' })
        }
      } catch (error) {
        navigate({ to: '/login' })
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // Show loading state while checking auth
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">
            Admin
          </span>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}