import type { DocumentStatus } from '../types'

const styles: Record<DocumentStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  ready: 'bg-green-500/20 text-green-400 border border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
