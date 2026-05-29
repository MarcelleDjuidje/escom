import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatXAF(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0)
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XAF'
}

export function formatDate(date: string | Date | null | undefined, withTime = false): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d)
}

export function relativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`
  return formatDate(date)
}

export const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700' },
  accepte: { label: 'Accepté', color: 'bg-green-100 text-green-700' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
  expire: { label: 'Expiré', color: 'bg-orange-100 text-orange-700' },
  en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  confirmee: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  en_production: { label: 'En production', color: 'bg-indigo-100 text-indigo-700' },
  livree: { label: 'Livrée', color: 'bg-green-100 text-green-700' },
  annulee: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
  payee: { label: 'Payée', color: 'bg-green-100 text-green-700' },
  non_payee: { label: 'Non payée', color: 'bg-red-100 text-red-700' },
  partiellement_payee: { label: 'Partielle', color: 'bg-yellow-100 text-yellow-700' },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  revision: { label: 'Révision', color: 'bg-purple-100 text-purple-700' },
  valide: { label: 'Validé', color: 'bg-green-100 text-green-700' },
  livre: { label: 'Livré', color: 'bg-emerald-100 text-emerald-700' },
  rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  prete: { label: 'Prête', color: 'bg-purple-100 text-purple-700' },
  planifiee: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  expiree: { label: 'Expirée', color: 'bg-gray-100 text-gray-600' },
  desactivee: { label: 'Désactivée', color: 'bg-red-100 text-red-700' },
  prospect: { label: 'Prospect', color: 'bg-blue-100 text-blue-700' },
  actif: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  archive: { label: 'Archivé', color: 'bg-gray-100 text-gray-600' },
}