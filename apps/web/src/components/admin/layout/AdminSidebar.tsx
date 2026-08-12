import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { getAuth, signOut } from 'firebase/auth'
import {
  LayoutDashboard,
  BookOpen,
  Webhook,
  Users,
  LogOut,
  Upload,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Books', url: '/admin/books', icon: Upload },
  { title: 'Purchases', url: '/admin/purchases', icon: BookOpen },
  { title: 'Webhooks', url: '/admin/webhooks', icon: Webhook },
  { title: 'Users', url: '/admin/users', icon: Users },
]

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()

  const handleLogout = async () => {
    const auth = getAuth()
    try {
      await signOut(auth)
      navigate({ to: '/login' })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <BookOpen className="h-5 w-5" />
          <span className="font-semibold">Ebook Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="cursor-pointer"
                    >
                      <Link to={item.url} className="flex items-center gap-2 w-full">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}