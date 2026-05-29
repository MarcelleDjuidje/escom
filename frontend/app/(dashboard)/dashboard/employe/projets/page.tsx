'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Calendar, User } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const COLUMNS: { id: string; label: string; color: string }[] = [
  { id: 'planifie', label: 'Planifié', color: 'border-gray-400' },
  { id: 'en_cours', label: 'En cours', color: 'border-escom-blue-500' },
  { id: 'en_pause', label: 'En pause', color: 'border-yellow-500' },
  { id: 'termine', label: 'Terminé', color: 'border-green-500' },
]

export default function EmployeProjets() {
  const [projets, setProjets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = () => {
    setLoading(true)
    api.get('/projets').then(r => setProjets(r.data?.data || r.data || [])).finally(() => setLoading(false))
  }

  const updateStatus = async (id: number, statut: string) => {
    try {
      await api.patch(`/projets/${id}`, { statut })
      setProjets(p => p.map(x => x.id_projet === id ? { ...x, statut } : x))
      toast.success('Statut mis à jour')
    } catch { toast.error('Erreur') }
  }

  if (loading) return <DashboardLayout role="employe"><div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" /></div></DashboardLayout>

  return (
    <DashboardLayout role="employe">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes projets</h1>
        <p className="text-escom-neutral-500 text-sm">Vue Kanban — cliquez sur un projet pour changer son statut</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col.id} className={`bg-escom-neutral-50 rounded-xl p-3 border-t-4 ${col.color}`}>
            <h3 className="font-semibold mb-3 px-2">{col.label} <span className="text-xs text-escom-neutral-500">({projets.filter(p => p.statut === col.id).length})</span></h3>
            <div className="space-y-2 min-h-[200px]">
              {projets.filter(p => p.statut === col.id).map(p => (
                <motion.div key={p.id_projet} layout
                  className="card-escom p-3 cursor-pointer hover:shadow-md group"
                  onClick={() => {
                    const nextIdx = (COLUMNS.findIndex(c => c.id === p.statut) + 1) % COLUMNS.length
                    updateStatus(p.id_projet, COLUMNS[nextIdx].id)
                  }}
                >
                  <p className="font-semibold text-sm mb-2 line-clamp-2">{p.titre}</p>
                  <div className="flex items-center gap-1 text-[11px] text-escom-neutral-500">
                    <Calendar size={11} /> {formatDate(p.date_echeance)}
                  </div>
                  {p.client && (
                    <div className="flex items-center gap-1 text-[11px] text-escom-neutral-500 mt-1">
                      <User size={11} /> {p.client.nom_complet}
                    </div>
                  )}
                  <div className="mt-2 h-1 bg-escom-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-escom-blue-500" style={{ width: `${p.pourcentage_avancement || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-escom-neutral-400 mt-1 text-right">{p.pourcentage_avancement || 0}%</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
