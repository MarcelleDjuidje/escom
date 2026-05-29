'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, ShoppingCart, AlertCircle, MessageSquare, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatXAF, formatDate, STATUT_LABELS } from '@/lib/utils'

export default function EmployeDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="employe">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" /></div>
      ) : stats && (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Projets actifs" value={stats.projets_actifs} color="blue" />
            <StatCard icon={AlertCircle} label="En retard" value={stats.projets_en_retard} color="red" />
            <StatCard icon={ShoppingCart} label="Commandes" value={stats.commandes_total} color="indigo" />
            <StatCard icon={MessageSquare} label="Demandes attente" value={stats.demandes_en_attente} color="gold" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-escom p-6">
              <h2 className="font-semibold text-lg mb-4">Mes projets en cours</h2>
              <div className="space-y-2">
                {(stats.projets_a_echeance || []).map((p: any) => (
                  <div key={p.id_projet} className="flex justify-between items-center p-3 hover:bg-escom-neutral-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{p.titre}</p>
                      <p className="text-xs text-escom-neutral-500">{formatDate(p.date_echeance)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${STATUT_LABELS[p.statut]?.color}`}>
                      {STATUT_LABELS[p.statut]?.label || p.statut}
                    </span>
                  </div>
                ))}
                {(stats.projets_a_echeance || []).length === 0 && (
                  <p className="text-sm text-escom-neutral-500 py-4 text-center">Aucun projet pour le moment</p>
                )}
              </div>
            </div>

            <div className="card-escom p-6">
              <h2 className="font-semibold text-lg mb-4">Commandes récentes</h2>
              <div className="space-y-2">
                {(stats.commandes_recentes || []).slice(0, 6).map((c: any) => (
                  <div key={c.id_commande} className="flex justify-between items-center p-3 hover:bg-escom-neutral-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{c.numero_commande}</p>
                      <p className="text-xs text-escom-neutral-500">{c.client?.nom_complet}</p>
                    </div>
                    <p className="font-bold text-escom-blue-700 text-sm">{formatXAF(c.total_ttc)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: 'bg-escom-blue-100 text-escom-blue-600',
    indigo: 'bg-indigo-100 text-indigo-700',
    red: 'bg-red-100 text-red-700',
    gold: 'bg-escom-gold-100 text-escom-gold-700',
  }
  return (
    <div className="card-escom p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}><Icon size={20} /></div>
      <p className="text-xs text-escom-neutral-500 uppercase font-semibold">{label}</p>
      <p className="font-bold text-2xl mt-1">{value}</p>
    </div>
  )
}
