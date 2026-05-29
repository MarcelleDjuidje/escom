'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn, relativeTime } from '@/lib/utils'
import {
  DemandeDevis, STATUT_CONFIG, StatutDevis,
  labelTypeService, iconTypeService, formatXAF,
} from '@/lib/devis-helpers'
import { ChiffrerDevisModal } from '@/components/dashboard/chiffrer-devis-modal'
import {
  ArrowLeft, Loader2, Calculator, Calendar, Clock,
  FileText, History, User, Mail, Phone, Wallet,
} from 'lucide-react'2.com

export default function AdminDetailDevisPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [devis, setDevis] = useState<DemandeDevis | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  const charger = async () => {
    try {
      const res = await api.get(`/devis/${params.id}`)
      setDevis(res.data)
    } catch {
      toast.error('Devis introuvable')
      router.push('/dashboard/admin/devis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }
  if (!devis) return null

  const config = STATUT_CONFIG[devis.statut as StatutDevis] ?? STATUT_CONFIG.en_attente_reponse
  const peutChiffrer = devis.statut === 'en_attente_reponse' || devis.statut === 'chiffre'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/dashboard/admin/devis"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux devis
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-4 lg:col-span-2">
          {/* En-tête */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                {iconTypeService(devis.type_service)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-600">{devis.numero_devis}</span>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', config.badgeClass)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
                    {config.label}
                  </span>
                </div>
                <h1 className="mt-1 text-xl font-bold text-gray-900">{devis.titre}</h1>
                <p className="mt-0.5 text-xs text-gray-400">
                  {labelTypeService(devis.type_service)} · Demandé {relativeTime(devis.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Besoin */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <FileText className="h-4 w-4 text-gray-400" /> Besoin exprimé
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{devis.description_besoin}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Budget indicatif client</p>
                <p className="font-semibold text-gray-700">{formatXAF(devis.budget_indicatif)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Délai souhaité</p>
                <p className="font-semibold text-gray-700">
                  {devis.delai_souhaite ? new Date(devis.delai_souhaite).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Proposition actuelle */}
          {devis.prix_propose_ttc && (
            <div className="overflow-hidden rounded-2xl border-2 border-blue-100 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-3">
                <h2 className="font-semibold text-white">💼 Proposition envoyée</h2>
                {devis.valide_jusqu_au && (
                  <span className="text-xs text-blue-100">
                    Valable jusqu'au {new Date(devis.valide_jusqu_au).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-500">HT : <b className="text-gray-800">{formatXAF(devis.prix_propose_ht)}</b></p>
                    <p className="text-gray-500">TVA {devis.taux_tva}% incluse</p>
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" /> Délai : <b className="text-gray-800">{devis.delai_propose_jours} jours</b>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600">Total TTC</p>
                    <p className="text-2xl font-bold text-blue-700">{formatXAF(devis.prix_propose_ttc)}</p>
                  </div>
                </div>
                {devis.commentaire_admin && (
                  <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500">Message au client</p>
                    <p className="mt-1 text-sm text-gray-600">{devis.commentaire_admin}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historique */}
          {devis.historique && devis.historique.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                <History className="h-4 w-4 text-gray-400" /> Historique
              </h2>
              <div className="space-y-4">
                {devis.historique.map((h, i) => (
                  <div key={h.id_historique} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      {i < devis.historique!.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium capitalize text-gray-700">{h.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400">{h.acteur_nom} · {relativeTime(h.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          {/* Action chiffrer */}
          {peutChiffrer && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <button
                onClick={() => setModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:shadow-xl active:scale-95"
              >
                <Calculator className="h-4 w-4" />
                {devis.statut === 'chiffre' ? 'Re-chiffrer' : 'Chiffrer ce devis'}
              </button>
              {devis.statut === 'chiffre' && (
                <p className="mt-2 text-center text-xs text-gray-400">
                  Le client n'a pas encore répondu. Vous pouvez ajuster votre offre.
                </p>
              )}
            </div>
          )}

          {/* Infos client */}
          {devis.client && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <User className="h-4 w-4 text-gray-400" /> Client
              </h3>
              <p className="font-medium text-gray-800">
                {devis.client.nom_complet ?? devis.client.raison_sociale ?? 'Client'}
              </p>
              {devis.client.email && (
                <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5" /> {devis.client.email}
                </p>
              )}
              {devis.client.telephone && (
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5" /> {devis.client.telephone}
                </p>
              )}
            </div>
          )}

          {/* Statut paiement si accepté */}
          {devis.statut === 'accepte' && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-emerald-700">
                <Wallet className="h-4 w-4" />
                <p className="text-sm font-semibold">Devis accepté</p>
              </div>
              <p className="mt-1 text-xs text-emerald-600">
                Un panier a été créé (#{devis.id_panier_cree}). En attente de paiement client.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modale chiffrage */}
      <ChiffrerDevisModal
        open={modal}
        devis={devis}
        onClose={() => setModal(false)}
        onChiffre={charger}
      />
    </div>
  )
}