'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ShoppingCart, TrendingUp, Briefcase, Loader2, AlertCircle } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatXAF, formatDate, STATUT_LABELS } from '@/lib/utils'

const COLORS = ['#1d4ed8', '#d4af37', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2']

// Valeurs par défaut si l'API renvoie null/erreur
const DEFAULT_STATS = {
  ca_encaisse: 0,
  ca_previsionnel: 0,
  commandes_total: 0,
  clients_actifs: 0,
  projets_actifs: 0,
  projets_en_retard: 0,
  employes_total: 0,
  commandes_par_statut: {},
  ca_par_mois: [],
  commandes_recentes: [],
  projets_a_echeance: [],
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r: any) => {
        // Fusionne la réponse avec les valeurs par défaut pour éviter les nulls
        setStats({ ...DEFAULT_STATS, ...(r.data || {}) })
      })
      .catch((e: any) => {
        console.error('Erreur dashboard stats:', e.response?.data)
        setError('Impossible de charger les statistiques. Affichage des valeurs par défaut.')
        setStats(DEFAULT_STATS)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  // Sécurité : si on n'a vraiment rien, on utilise les valeurs par défaut
  const s = stats || DEFAULT_STATS

  const statusData = Object.entries(s.commandes_par_statut || {}).map(([k, v]) => ({
    name: STATUT_LABELS[k]?.label || k,
    value: Number(v),
  }))
  const caData = (s.ca_par_mois || []).map((m: any) => ({ mois: m.mois, ca: Number(m.ca) }))

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {error && (
          <div className="card-escom p-3 bg-yellow-50 border-yellow-200 flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp} label="CA encaissé" value={formatXAF(s.ca_encaisse || 0)} color="green" />
          <StatCard icon={TrendingUp} label="CA prévisionnel" value={formatXAF(s.ca_previsionnel || 0)} color="blue" />
          <StatCard icon={ShoppingCart} label="Commandes" value={s.commandes_total || 0} color="indigo" />
          <StatCard icon={Users} label="Clients actifs" value={s.clients_actifs || 0} color="gold" />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4">
          <StatCard icon={Briefcase} label="Projets actifs" value={s.projets_actifs || 0} color="blue" />
          <StatCard icon={AlertCircle} label="Projets en retard" value={s.projets_en_retard || 0} color="red" />
          <StatCard icon={Users} label="Employés actifs" value={s.employes_total || 0} color="gold" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-escom p-6">
            <h2 className="font-semibold text-lg mb-4">Chiffre d'affaires mensuel</h2>
            {caData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={caData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any) => formatXAF(v)} />
                  <Line type="monotone" dataKey="ca" stroke="#1d4ed8" strokeWidth={3} dot={{ fill: '#d4af37', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-sm text-escom-neutral-500 py-12">Pas encore de données</p>}
          </div>

          <div className="card-escom p-6">
            <h2 className="font-semibold text-lg mb-4">Commandes par statut</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-sm text-escom-neutral-500 py-12">Pas encore de données</p>}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-escom p-6">
            <h2 className="font-semibold text-lg mb-4">Commandes récentes</h2>
            <div className="space-y-2">
              {(s.commandes_recentes || []).slice(0, 6).map((c: any) => (
                <div key={c.id_commande} className="flex justify-between items-center p-3 hover:bg-escom-neutral-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{c.numero_commande}</p>
                    <p className="text-xs text-escom-neutral-500">
                      {c.client?.nom_complet || c.client?.nom || 'Client'} • {formatDate(c.date_commande)}
                    </p>
                  </div>
                  <p className="font-bold text-escom-blue-700">{formatXAF(c.total_ttc)}</p>
                </div>
              ))}
              {(s.commandes_recentes || []).length === 0 && (
                <p className="text-sm text-escom-neutral-500 py-4 text-center">Aucune commande récente</p>
              )}
            </div>
          </div>

          <div className="card-escom p-6">
            <h2 className="font-semibold text-lg mb-4">Projets à échéance</h2>
            <div className="space-y-2">
              {(s.projets_a_echeance || []).map((p: any) => (
                <div key={p.id_projet} className="flex justify-between items-center p-3 hover:bg-escom-neutral-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{p.titre}</p>
                    <p className="text-xs text-escom-neutral-500">Échéance : {formatDate(p.date_echeance)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${STATUT_LABELS[p.statut]?.color || 'bg-gray-100'}`}>
                    {STATUT_LABELS[p.statut]?.label || p.statut}
                  </span>
                </div>
              ))}
              {(s.projets_a_echeance || []).length === 0 && (
                <p className="text-sm text-escom-neutral-500 py-4 text-center">Aucun projet à échéance</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
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
      <p className="font-bold text-xl mt-1">{value}</p>
    </div>
  )
}