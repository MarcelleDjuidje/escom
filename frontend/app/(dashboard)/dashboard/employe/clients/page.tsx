'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { formatDate } from '@/lib/utils'

export default function EmployeClients() {
  return (
    <DashboardLayout role="employe">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes clients</h1>
      </div>
      <DataTable
        endpoint="/clients"
        columns={[
          { key: 'nom_complet', label: 'Nom', render: (c) => <span className="font-semibold">{c.nom_complet}</span> },
          { key: 'email', label: 'Email' },
          { key: 'telephone', label: 'Téléphone' },
          { key: 'type_client', label: 'Type', render: (c) => <span className="capitalize">{c.type_client}</span> },
          { key: 'created_at', label: 'Inscrit le', render: (c) => formatDate(c.created_at) },
        ]}
      />
    </DashboardLayout>
  )
}
