import { STATUT_LABELS } from '@/lib/utils'

export function StatusBadge({ statut }: { statut: string }) {
  const s = STATUT_LABELS[statut] || { label: statut, color: 'bg-gray-100 text-gray-700' }
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${s.color}`}>{s.label}</span>
}
