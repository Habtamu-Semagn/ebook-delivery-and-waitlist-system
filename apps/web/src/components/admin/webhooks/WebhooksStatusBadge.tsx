interface WebhooksStatusBadgeProps {
  status: 'pending' | 'processed' | 'failed'
}

export function WebhooksStatusBadge({ status }: WebhooksStatusBadgeProps) {
  const styles = {
    processed: 'bg-green-100 text-green-900 border border-green-300 font-semibold',
    failed: 'bg-red-100 text-red-900 border border-red-300 font-semibold',
    pending: 'bg-yellow-100 text-yellow-900 border border-yellow-300 font-semibold',
  }

  const labels = {
    processed: 'Processed',
    failed: 'Failed',
    pending: 'Pending',
  }

  return (
    <span className={`px-3 py-1 rounded text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
