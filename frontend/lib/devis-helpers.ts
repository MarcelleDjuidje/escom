// =============================================================
// Types & helpers partagés pour le module Devis
// =============================================================

export interface DemandeDevis {
  id_demande_devis: number
  numero_devis: string
  id_client: number
  id_employe_responsable: number | null
  type_service: string
  id_service_origine: number | null
  table_service_origine: string | null
  titre: string
  description_besoin: string
  budget_indicatif: string | null
  delai_souhaite: string | null
  fichiers_joints: string[] | null
  statut: StatutDevis
  prix_propose_ht: string | null
  taux_tva: string
  prix_propose_ttc: string | null
  delai_propose_jours: number | null
  commentaire_admin: string | null
  conditions_particulieres: string | null
  id_commande_creee: number | null
  id_panier_cree: number | null
  valide_jusqu_au: string | null
  date_chiffrage: string | null
  date_acceptation: string | null
  date_refus: string | null
  raison_refus: string | null
  created_at: string
  updated_at: string
  client?: {
    id_client: number
    nom_complet: string | null
    raison_sociale: string | null
    email: string | null
    telephone: string | null
  }
  employe_responsable?: {
    id_employe: number
    nom_complet: string | null
  }
  historique?: HistoriqueDevis[]
}

export interface HistoriqueDevis {
  id_historique: number
  id_demande_devis: number
  action: string
  ancien_statut: string | null
  nouveau_statut: string | null
  acteur_type: string
  acteur_id: number | null
  acteur_nom: string | null
  details: Record<string, any> | null
  created_at: string
}

export type StatutDevis =
  | 'en_attente_reponse'
  | 'chiffre'
  | 'accepte'
  | 'refuse'
  | 'annule'
  | 'expire'

// Configuration visuelle de chaque statut (couleurs Tailwind)
export const STATUT_CONFIG: Record<StatutDevis, {
  label: string
  badgeClass: string
  dotClass: string
  description: string
}> = {
  en_attente_reponse: {
    label: 'En attente de réponse',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dotClass: 'bg-amber-500',
    description: 'Votre demande a été transmise. Notre équipe va la chiffrer rapidement.',
  },
  chiffre: {
    label: 'Devis reçu',
    badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dotClass: 'bg-blue-600',
    description: "Nous avons chiffré votre demande. Vous pouvez l'accepter ou la refuser.",
  },
  accepte: {
    label: 'Accepté',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dotClass: 'bg-emerald-600',
    description: 'Vous avez accepté ce devis. Un panier a été créé pour le paiement.',
  },
  refuse: {
    label: 'Refusé',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    dotClass: 'bg-rose-500',
    description: 'Vous avez refusé ce devis.',
  },
  annule: {
    label: 'Annulé',
    badgeClass: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
    dotClass: 'bg-gray-400',
    description: 'Cette demande a été annulée.',
  },
  expire: {
    label: 'Expiré',
    badgeClass: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    dotClass: 'bg-gray-400',
    description: 'La validité de ce devis (30 jours) est dépassée.',
  },
}

// Types de service proposés à la demande
export const TYPE_SERVICE_OPTIONS = [
  { value: 'conception',   label: 'Conception graphique',      icon: '🎨' },
  { value: 'impression',   label: 'Impression / Supports',     icon: '📦' },
  { value: 'social_media', label: 'Réseaux sociaux',           icon: '📱' },
  { value: 'campagne',     label: 'Campagne marketing',        icon: '📊' },
  { value: 'web',          label: 'Site web / Digital',        icon: '🌐' },
  { value: 'autre',        label: 'Autre besoin',              icon: '✨' },
] as const

export function labelTypeService(value: string): string {
  return TYPE_SERVICE_OPTIONS.find((t) => t.value === value)?.label ?? value
}

export function iconTypeService(value: string): string {
  return TYPE_SERVICE_OPTIONS.find((t) => t.value === value)?.icon ?? '✨'
}

// Formatage monétaire XAF (ex: 595000 -> "595 000 XAF")
export function formatXAF(montant: string | number | null | undefined): string {
  if (montant === null || montant === undefined || montant === '') return '—'
  const n = typeof montant === 'string' ? parseFloat(montant) : montant
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XAF'
}

// Nombre de jours restants avant expiration (ou null)
export function joursRestants(valideJusquAu: string | null): number | null {
  if (!valideJusquAu) return null
  const fin = new Date(valideJusquAu)
  const maintenant = new Date()
  const diff = Math.ceil((fin.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}