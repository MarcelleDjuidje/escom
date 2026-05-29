'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, AlertCircle, Calendar, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { formatXAF, formatDate } from '@/lib/utils'
import { PaymentModal } from './payment-modal'

export function PendingPaymentsWidget() {
  const [tranches, setTranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trancheToPay, setTrancheToPay] = useState<any>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoading(true)
    api.get('/mes-tranches-en-attente')
      .then((r: any) => setTranches(r.data || []))
      .catch(() => setTranches([]))
      .finally(() => setLoading(false))
  }

  if (loading) {
    return (
      <div className="card-escom p-5">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-escom-blue-600" />
        </div>
      </div>
    )
  }

  if (tranches.length === 0) {
    return (
      <div className="card-escom p-5 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-semibold text-green-900">Tous vos paiements sont à jour 🎉</p>
            <p className="text-xs text-green-700">Aucune tranche en attente de paiement.</p>
          </div>
        </div>
      </div>
    )
  }

  const totalDu = tranches.reduce((sum, t) => sum + Number(t.montant_du_ttc || 0), 0)
  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-escom p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <CreditCard className="text-escom-blue-600" size={20} />
            <div>
              <h2 className="font-semibold">Paiements en attente</h2>
              <p className="text-xs text-escom-neutral-500">{tranches.length} tranche(s) à régler</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-escom-neutral-500 uppercase">Total dû</p>
            <p className="text-xl font-bold text-escom-blue-700">{formatXAF(totalDu)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {tranches.slice(0, 5).map((t: any) => {
            const isLate = t.date_echeance_prevue < today
            const isToday = t.date_echeance_prevue === today

            return (
              <motion.div key={t.id_tranche}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border-l-4 flex items-center justify-between gap-3 ${
                  isLate ? 'bg-red-50 border-l-red-500' :
                  isToday ? 'bg-orange-50 border-l-orange-500' :
                  'bg-escom-neutral-50 border-l-escom-blue-500'
                }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-escom-neutral-500">
                    {t.plan?.commande?.numero_commande || 'Commande'}
                  </p>
                  <p className="font-bold text-sm truncate">
                    Tranche {t.numero_tranche} — {t.libelle}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={12} className="text-escom-neutral-400" />
                    <p className={`text-xs ${isLate ? 'text-red-600 font-semibold' : 'text-escom-neutral-600'}`}>
                      Échéance : {formatDate(t.date_echeance_prevue)}
                      {isLate && ' (en retard)'}
                      {isToday && ' (aujourd\'hui)'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-escom-blue-700 mb-1">{formatXAF(t.montant_du_ttc)}</p>
                  <button onClick={() => setTrancheToPay(t)}
                    className="btn-primary !py-1 !px-2 !text-xs">
                    💰 Payer
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {tranches.length > 5 && (
          <button onClick={() => window.location.href = '/dashboard/client/commandes'}
            className="mt-4 w-full text-sm text-escom-blue-600 hover:bg-escom-blue-50 py-2 rounded-lg flex items-center justify-center gap-1">
            Voir toutes les tranches ({tranches.length}) <ChevronRight size={14} />
          </button>
        )}
      </motion.div>

      <PaymentModal
        isOpen={!!trancheToPay}
        onClose={() => setTrancheToPay(null)}
        onSuccess={() => { fetchData() }}
        tranche={trancheToPay}
        numeroCommande={trancheToPay?.plan?.commande?.numero_commande}
      />
    </>
  )
}