'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Circle, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function EmployeTaches() {
  const [taches, setTaches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/taches').then(r => setTaches(r.data || [])).finally(() => setLoading(false)) }, [])

  const toggle = async (t: any) => {
    const newStatut = t.statut === 'terminee' ? 'en_cours' : 'terminee'
    await api.patch(`/taches/${t.id_tache}`, { statut: newStatut })
    setTaches(taches.map(x => x.id_tache === t.id_tache ? { ...x, statut: newStatut } : x))
    toast.success('Mis à jour')
  }

  return (
    <DashboardLayout role="employe">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes tâches</h1>
        <p className="text-escom-neutral-500 text-sm">Toutes les tâches qui vous sont assignées</p>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600 mx-auto" /> : (
        <div className="card-escom divide-y">
          {taches.length === 0 ? (
            <div className="p-12 text-center text-escom-neutral-500">Aucune tâche</div>
          ) : taches.map(t => (
            <div key={t.id_tache} className="p-4 flex items-start gap-3 hover:bg-escom-neutral-50">
              <button onClick={() => toggle(t)} className="mt-1">
                {t.statut === 'terminee' ? <CheckCircle2 className="text-green-600" /> : <Circle className="text-escom-neutral-400" />}
              </button>
              <div className="flex-1">
                <p className={`font-medium ${t.statut === 'terminee' ? 'line-through text-escom-neutral-400' : ''}`}>{t.titre}</p>
                {t.description && <p className="text-sm text-escom-neutral-600 mt-1">{t.description}</p>}
                <div className="flex gap-3 mt-2 text-xs text-escom-neutral-500">
                  {t.date_echeance && <span className="flex items-center gap-1"><Clock size={11} />{formatDate(t.date_echeance)}</span>}
                  <span className="capitalize">Priorité: {t.priorite}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
