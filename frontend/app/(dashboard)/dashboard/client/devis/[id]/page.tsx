'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatDate, formatXAF } from '@/lib/utils'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import {
  ArrowLeft, Loader2, Calendar, Clock,
  FileText, User, CheckCircle2, XCircle, Ban,
} from 'lucide-react'

const STATUT_MAP: Record<string, { label: string; color: string }> = {
  en_attente_reponse: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  chiffre: { label: 'Devis reçu', color: 'bg-blue-100 text-blue-800' },
  accepte: { label: 'Accepté', color: 'bg-green-100 text-green-800' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-800' },
  annule: { label: 'Annulé', color: 'bg-gray-100 text-gray-600' },
  expire: { label: 'Expiré', color: 'bg-orange-100 text-orange-700' },
}

export default function ClientDetailDevisPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [devis, setDevis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const charger = async () => {
    try {
      const res = await api.get(`/devis/${params.id}`)
      setDevis(res.data)
    } catch {
      toast.error('Devis introuvable')
      router.push('/dashboard/client/devis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const accepter = async () => {
    try {
      await api.post(`/devis/${params.id}/accepter`)
      toast.success('Devis accepté !')
      charger()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const refuser = async () => {
    try {
      await api.post(`/devis/${params.id}/refuser`)
      toast.success('Devis refusé.')
      charger()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="client">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!devis) return null

  const statut = STATUT_MAP[devis.statut] || STATUT_MAP.en_attente_reponse

  return (
    <DashboardLayout role="client">
      <Link
        href="/dashboard/client/devis"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux devis
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* En-tête */}
          <div className="card-escom p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-blue-600">{devis.numero_devis}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statut.color}`}>
                    {statut.label}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{devis.titre}</h1>
                <p className="mt-0.5 text-xs text-gray-400 capitalize">
                  {devis.type_service?.replace(/_/g, ' ')} &bull; {formatDate(devis.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Description du besoin */}
          <div className="card-escom p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <FileText className="h-4 w-4 text-gray-400" /> Mon besoin
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{devis.description_besoin}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Budget indicatif</p>
                <p className="font-semibold text-gray-700">{devis.budget_indicatif ? formatXAF(devis.budget_indicatif) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Délai souhaité</p>
                <p className="font-semibold text-gray-700">
                  {devis.delai_souhaite ? formatDate(devis.delai_souhaite) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Proposition reçue */}
          {devis.prix_propose_ttc && (
            <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-escom-gradient px-6 py-3">
                <h2 className="font-semibold text-white">Proposition commerciale ESCOM</h2>
                {devis.valide_jusqu_au && (
                  <span className="text-xs text-blue-100">
                    Valable jusqu'au {formatDate(devis.valide_jusqu_au)}
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500">HT : <b className="text-gray-800">{formatXAF(devis.prix_propose_ht)}</b></p>
                    <p className="text-gray-500">TVA {devis.taux_tva}% incluse</p>
                    {devis.delai_propose_jours && (
                      <p className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3.5 w-3.5" /> Délai : <b className="text-gray-800">{devis.delai_propose_jours} jours</b>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600">Total TTC</p>
                    <p className="text-2xl font-bold text-blue-700">{formatXAF(devis.prix_propose_ttc)}</p>
                  </div>
                </div>
                {devis.commentaire_admin && (
                  <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500">Message de l'équipe</p>
                    <p className="mt-1 text-sm text-gray-600">{devis.commentaire_admin}</p>
                  </div>
                )}

                {devis.statut === 'chiffre' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={accepter}
                      className="btn-primary text-sm flex-1 flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> Accepter le devis
                    </button>
                    <button onClick={refuser}
                      className="btn-outline text-sm flex-1 flex items-center justify-center gap-1 !text-red-600 !border-red-200">
                      <XCircle size={14} /> Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          <div className="card-escom p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Statut</h3>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statut.color}`}>
              {statut.label}
            </span>
            {devis.statut === 'accepte' && (
              <p className="mt-3 text-xs text-green-600">
                Un panier a été créé. Vous pouvez procéder au paiement depuis vos commandes.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
