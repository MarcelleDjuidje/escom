'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatXAF, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const STATUTS = ['en_attente', 'confirmee', 'en_production', 'livree', 'annulee']

export default function AdminCommandes() {
  const router = useRouter()
  const [filter, setFilter] = useState('')

  const updateStatut = async (id: number, statut: string) => {
    try {
      await api.patch(`/commandes/${id}`, { statut })
      toast.success('Statut mis à jour')
      window.location.reload()
    } catch {
      toast.error('Erreur')
    }
  }

  const ouvrirDetail = (commande: any) => {
    router.push(`/dashboard/admin/commandes/${commande.id_commande}`)
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Toutes les commandes</h1>
          <p className="text-xs text-escom-neutral-500 mt-1">
            💡 Cliquez sur une ligne pour voir le détail complet de la commande
          </p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-escom max-w-xs">
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <DataTable
        endpoint="/admin/commandes"
        filters={filter ? { statut: filter } : {}}
        onRowClick={ouvrirDetail}
        columns={[
          {
            key: 'numero_commande',
            label: 'N°',
            render: (c) => (
              <span className="font-mono font-semibold text-escom-blue-600">
                {c.numero_commande}
              </span>
            )
          },
          { key: 'client', label: 'Client', render: (c) => c.client?.nom_complet || '-' },
          { key: 'date_commande', label: 'Date', render: (c) => formatDate(c.date_commande) },
          { key: 'total_ttc', label: 'TTC', render: (c) => <span className="font-bold">{formatXAF(c.total_ttc)}</span> },
          { key: 'montant_paye', label: 'Payé', render: (c) => formatXAF(c.montant_paye) },
          { key: 'statut', label: 'Statut', render: (c) => <StatusBadge statut={c.statut} /> },
          {
            key: '_actions',
            label: 'Actions',
            render: (c) => (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <select
                  defaultValue={c.statut}
                  onChange={e => updateStatut(c.id_commande, e.target.value)}
                  className="text-xs border rounded px-2 py-1">
                  {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <button
                  onClick={() => ouvrirDetail(c)}
                  className="text-escom-blue-600 hover:bg-escom-blue-50 p-1.5 rounded-lg transition"
                  title="Voir le détail">
                  <Eye size={16} />
                </button>
              </div>
            )
          },
        ]}
      />
    </DashboardLayout>
  )
}