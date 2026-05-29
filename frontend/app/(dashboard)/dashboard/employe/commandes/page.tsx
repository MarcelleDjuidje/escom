'use client'

import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatXAF, formatDate } from '@/lib/utils'

export default function EmployeCommandes() {
  const router = useRouter()

  const ouvrirDetail = (commande: any) => {
    router.push(`/dashboard/employe/commandes/${commande.id_commande}`)
  }

  return (
    <DashboardLayout role="employe">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Commandes clients</h1>
        <p className="text-xs text-escom-neutral-500 mt-1">
          💡 Cliquez sur une ligne pour voir le détail complet de la commande
        </p>
      </div>

      <DataTable
        endpoint="/commandes"
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
          { key: 'total_ttc', label: 'Total', render: (c) => <span className="font-bold">{formatXAF(c.total_ttc)}</span> },
          { key: 'statut', label: 'Statut', render: (c) => <StatusBadge statut={c.statut} /> },
          {
            key: '_actions',
            label: 'Actions',
            render: (c) => (
              <button
                onClick={(e) => { e.stopPropagation(); ouvrirDetail(c) }}
                className="text-escom-blue-600 hover:bg-escom-blue-50 p-1.5 rounded-lg transition inline-flex items-center gap-1 text-xs font-semibold"
                title="Voir le détail">
                <Eye size={14} /> Voir
              </button>
            )
          },
        ]}
      />
    </DashboardLayout>
  )
}