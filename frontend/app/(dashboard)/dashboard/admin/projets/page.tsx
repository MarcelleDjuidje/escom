'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Calendar, User } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const COLUMNS = [
  { id: 'planifie', label: 'Planifié', color: 'border-gray-400' },
  { id: 'en_cours', label: 'En cours', color: 'border-escom-blue-500' },
  { id: 'en_pause', label: 'En pause', color: 'border-yellow-500' },
  { id: 'termine', label: 'Terminé', color: 'border-green-500' },
]

export default function AdminProjets() {
  const [projets, setProjets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/projets').then(r => setProjets(r.data?.data || r.data || [])).finally(() => setLoading(false)) }, [])

  return (
    <DashboardLayout role="admin">
      <div className="mb-6"><h1 className="text-2xl font-bold">Tous les projets</h1></div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-escom-blue-600" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.id} className={`bg-escom-neutral-50 rounded-xl p-3 border-t-4 ${col.color}`}>
              <h3 className="font-semibold mb-3 px-2">{col.label} <span className="text-xs text-escom-neutral-500">({projets.filter(p => p.statut === col.id).length})</span></h3>
              <div className="space-y-2 min-h-[200px]">
                {projets.filter(p => p.statut === col.id).map(p => (
                  <motion.div key={p.id_projet} layout className="card-escom p-3">
                    <p className="font-semibold text-sm mb-1 line-clamp-2">{p.titre}</p>
                    <div className="flex items-center gap-1 text-[11px] text-escom-neutral-500"><Calendar size={11} />{formatDate(p.date_echeance)}</div>
                    <div className="flex items-center gap-1 text-[11px] text-escom-neutral-500 mt-1"><User size={11} />{p.client?.nom_complet}</div>
                    <div className="mt-2 h-1 bg-escom-neutral-100 rounded-full"><div className="h-full bg-escom-blue-500 rounded-full" style={{ width: `${p.pourcentage_avancement || 0}%` }} /></div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
