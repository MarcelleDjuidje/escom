'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatXAF, formatDate } from '@/lib/utils'

export default function ClientCommandes() {
  return (
    <DashboardLayout role="client">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mes commandes</h1>
          <p className="text-escom-neutral-500 text-sm">Suivi de l'ensemble de vos commandes ESCOM</p>
        </div>
        <Link href="/dashboard/client/commandes/nouveau" className="btn-primary">Nouvelle commande</Link>
      </div>

      <DataTable
        endpoint="/commandes"
        searchPlaceholder="N° de commande..."
        emptyText="Vous n'avez pas encore de commande."
        columns={[
          { key: 'numero_commande', label: 'N° Commande', render: (c) => (
          <a href={`/dashboard/client/commandes/${c.id_commande}`} className="font-mono font-semibold text-escom-blue-600 hover:underline">
            {c.numero_commande}
          </a>
          )},
          { key: 'date_commande', label: 'Date', render: (c) => formatDate(c.date_commande) },
          { key: 'date_livraison_souhaitee', label: 'Livraison souhaitée', render: (c) => formatDate(c.date_livraison_souhaitee) },
          { key: 'total_ttc', label: 'Total TTC', render: (c) => <span className="font-bold text-escom-blue-700">{formatXAF(c.total_ttc)}</span> },
          { key: 'montant_paye', label: 'Payé', render: (c) => formatXAF(c.montant_paye) },
          { key: 'statut', label: 'Statut', render: (c) => <StatusBadge statut={c.statut} /> },
        ]}
      />
    </DashboardLayout>
  )
}
