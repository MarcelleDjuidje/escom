'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatXAF, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'
import { api } from '@/lib/api'

export default function AdminDevis() {
  const downloadPdf = async (id: number, num: string) => {
    const res = await api.get(`/devis/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `Devis-${num}.pdf`; a.click()
  }
  return (
    <DashboardLayout role="admin">
      <div className="mb-6"><h1 className="text-2xl font-bold">Tous les devis</h1></div>
      <DataTable
        endpoint="/devis"
        columns={[
          { key: 'numero_devis', label: 'N°', render: (d) => <span className="font-mono">{d.numero_devis}</span> },
          { key: 'client', label: 'Client', render: (d) => d.client?.nom_complet || '-' },
          { key: 'date_creation', label: 'Date', render: (d) => formatDate(d.date_creation) },
          { key: 'total_ttc', label: 'TTC', render: (d) => formatXAF(d.total_ttc) },
          { key: 'statut', label: 'Statut', render: (d) => <StatusBadge statut={d.statut} /> },
          { key: '_actions', label: '', render: (d) => (
            <button onClick={() => downloadPdf(d.id_devis, d.numero_devis)} className="text-escom-blue-600 hover:underline inline-flex items-center gap-1"><Download size={14} /> PDF</button>
          )},
        ]}
      />
    </DashboardLayout>
  )
}
