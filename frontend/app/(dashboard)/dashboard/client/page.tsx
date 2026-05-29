'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, FileText, Package, MessageSquare, TrendingUp, Loader2, ArrowRight } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatXAF, formatDate, STATUT_LABELS } from '@/lib/utils'
import { PendingPaymentsWidget } from '@/components/dashboard/pending-payments-widget'

export default function ClientDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r: any) => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="client">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" /></div>
      ) : stats && (
        <div className="space-y-6">
          {/* Statistiques */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ShoppingCart} label="Commandes" value={stats.commandes_total} color="blue" />
            <StatCard icon={Package} label="En cours" value={stats.commandes_en_cours} color="indigo" />
            <StatCard icon={TrendingUp} label="Total payé" value={formatXAF(stats.montant_total_paye)} color="green" small />
            <StatCard icon={FileText} label="Factures impayées" value={stats.factures_impayees} color="red" />
          </motion.div>

          {/* Widget Paiements en attente — pleine largeur en haut */}
          <PendingPaymentsWidget />

          {/* Grille principale : Commandes récentes + Actions rapides */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Commandes récentes */}
            <div className="card-escom p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Commandes récentes</h2>
                <Link href="/dashboard/client/commandes" className="text-sm text-escom-blue-600 hover:underline inline-flex items-center gap-1">
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {(stats.commandes_recentes || []).length === 0 ? (
                  <p className="text-sm text-escom-neutral-500 py-4 text-center">Aucune commande pour le moment</p>
                ) : stats.commandes_recentes.map((c: any) => (
                  <Link key={c.id_commande} href={`/dashboard/client/commandes/${c.id_commande}`}
                    className="flex justify-between items-center p-3 hover:bg-escom-neutral-50 rounded-lg transition">
                    <div>
                      <p className="font-semibold text-sm">{c.numero_commande}</p>
                      <p className="text-xs text-escom-neutral-500">{formatDate(c.date_commande)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-escom-blue-700 text-sm">{formatXAF(c.total_ttc)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${STATUT_LABELS[c.statut]?.color || 'bg-gray-100'}`}>
                        {STATUT_LABELS[c.statut]?.label || c.statut}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="card-escom p-6">
              <h2 className="font-semibold text-lg mb-4">Actions rapides</h2>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction href="/dashboard/client/commandes/nouveau" icon={Package} label="Commander un service" />
                <QuickAction href="/dashboard/client/demandes" icon={MessageSquare} label="Demande de campagne" />
                <QuickAction href="/dashboard/client/devis" icon={FileText} label="Mes devis" />
                <QuickAction href="/dashboard/client/chat" icon={MessageSquare} label="Contacter l'équipe" />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function StatCard({ icon: Icon, label, value, color, small }: any) {
  const colors: any = {
    blue: 'bg-escom-blue-100 text-escom-blue-600',
    green: 'bg-green-100 text-green-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    red: 'bg-red-100 text-red-700',
    gold: 'bg-escom-gold-100 text-escom-gold-700',
  }
  return (
    <div className="card-escom p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-escom-neutral-500 uppercase font-semibold">{label}</p>
      <p className={`font-bold ${small ? 'text-lg' : 'text-2xl'} mt-1`}>{value}</p>
    </div>
  )
}

function QuickAction({ href, icon: Icon, label }: any) {
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center text-center gap-2 p-4 border border-escom-neutral-200 rounded-lg hover:border-escom-blue-500 hover:bg-escom-blue-50 transition">
      <Icon size={24} className="text-escom-blue-600" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}