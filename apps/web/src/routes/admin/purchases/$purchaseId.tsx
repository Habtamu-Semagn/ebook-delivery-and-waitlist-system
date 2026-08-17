import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/purchases/$purchaseId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/purchases/$purchaseId"!</div>
}
