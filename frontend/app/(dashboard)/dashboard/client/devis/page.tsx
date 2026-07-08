'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, FileText, Clock, CheckCircle2, XCircle, Ban, Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { api } from '@/lib/api'
import { formatDate, formatXAF } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

const STATUT_MAP: Record<string, { label: string; color: string }> = {
  en_attente_reponse: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  chiffre: { label: 'Devis reçu', color: 'bg-blue-100 text-blue-800' },
  accepte: { label: 'Accepté', color: 'bg-green-100 text-green-800' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-800' },
  annule: { label: 'Annulé', color: 'bg-gray-100 text-gray-600' },
  expire: { label: 'Expiré', color: 'bg-orange-100 text-orange-700' },
}

export default function ClientDevisPage() {
  const [devis, setDevis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/devis')
      .then(res => setDevis(res.data?.data || res.data || []))
      .catch(() => toast.error('Erreur lors du chargement des devis'))
      .finally(() => setLoading(false))
  }, [])

  const accepter = async (id: number) => {
    try {
      await api.post(`/devis/${id}/accepter`)
      setDevis(prev => prev.map(d => d.id_demande_devis === id ? { ...d, statut: 'accepte' } : d))
      toast.success('Devis accepté ! Un panier a été créé.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const refuser = async (id: number) => {
    try {
      await api.post(`/devis/${id}/refuser`)
      setDevis(prev => prev.map(d => d.id_demande_devis === id ? { ...d, statut: 'refuse' } : d))
      toast.success('Devis refusé.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const annuler = async (id: number) => {
    try {
      await api.post(`/devis/${id}/annuler`)
      setDevis(prev => prev.map(d => d.id_demande_devis === id ? { ...d, statut: 'annule' } : d))
      toast.success('Demande annulée.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <DashboardLayout role="client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes Devis</h1>
        <p className="text-escom-neutral-500 text-sm">Suivez vos demandes de devis et propositions commerciales</p>
      </div>

      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600 mx-auto" />
      ) : devis.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-escom-neutral-300" />
          <p>Aucun devis pour le moment.</p>
          <p className="text-xs mt-1">Vos demandes de devis apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devis.map((d: any) => {
            const statut = STATUT_MAP[d.statut] || STATUT_MAP.en_attente_reponse
            return (
              <motion.div
                key={d.id_demande_devis}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-escom p-5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg">{d.titre}</p>
                    <p className="text-xs text-escom-neutral-500">
                      {d.numero_devis} &bull; {formatDate(d.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statut.color}`}>
                    {statut.label}
                  </span>
                </div>

                <p className="text-sm text-escom-neutral-700 line-clamp-2 mb-3">{d.description_besoin}</p>

                <div className="flex flex-wrap gap-3 text-xs text-escom-neutral-500">
                  {d.type_service && <span className="capitalize">{d.type_service.replace(/_/g, ' ')}</span>}
                  {d.budget_indicatif && <span>Budget: {formatXAF(d.budget_indicatif)}</span>}
                  {d.delai_souhaite && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {formatDate(d.delai_souhaite)}
                    </span>
                  )}
                </div>

                {/* Proposition chiffrée */}
                {d.prix_propose_ttc && d.statut !== 'en_attente_reponse' && (
                  <div className="mt-3 p-3 bg-escom-gold-50 rounded border border-escom-gold-200">
                    <p className="text-xs text-escom-gold-800 font-semibold uppercase">Proposition ESCOM</p>
                    {d.commentaire_admin && (
                      <p className="text-sm mt-1 text-escom-neutral-700">{d.commentaire_admin}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-escom-neutral-500">
                        <span>HT: {formatXAF(d.prix_propose_ht)}</span>
                        {d.delai_propose_jours && <span className="ml-3">Délai: {d.delai_propose_jours} jours</span>}
                      </div>
                      <p className="text-lg font-bold text-escom-gold-700">{formatXAF(d.prix_propose_ttc)}</p>
                    </div>
                    {d.valide_jusqu_au && (
                      <p className="text-[11px] text-escom-neutral-400 mt-1">
                        Valable jusqu'au {formatDate(d.valide_jusqu_au)}
                      </p>
                    )}

                    {d.statut === 'chiffre' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => accepter(d.id_demande_devis)}
                          className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={14} /> Accepter
                        </button>
                        <button
                          onClick={() => refuser(d.id_demande_devis)}
                          className="btn-outline text-sm flex-1 flex items-center justify-center gap-1 !text-red-600 !border-red-200"
                        >
                          <XCircle size={14} /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Annuler si en attente */}
                {(d.statut === 'en_attente_reponse') && (
                  <div className="mt-3">
                    <button
                      onClick={() => annuler(d.id_demande_devis)}
                      className="btn-outline text-xs flex items-center gap-1 !text-gray-500"
                    >
                      <Ban size={12} /> Annuler la demande
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
