'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatXAF, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'
import { api } from '@/lib/api'

export default function ClientFactures() {
  const downloadPdf = async (id: number, num: string) => {
    const res = await api.get(`/factures/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `Facture-${num}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <DashboardLayout role="client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes factures</h1>
        <p className="text-escom-neutral-500 text-sm">Toutes vos factures par tranche</p>
      </div>
      <DataTable
        endpoint="/factures"
        emptyText="Aucune facture pour le moment."
        columns={[
          { key: 'numero_facture', label: 'N° Facture', render: (f) => <span className="font-mono font-semibold">{f.numero_facture}</span> },
          { key: 'date_emission', label: 'Émise le', render: (f) => formatDate(f.date_emission) },
          { key: 'date_echeance', label: 'Échéance', render: (f) => formatDate(f.date_echeance) },
          { key: 'designation_prestation', label: 'Désignation' },
          { key: 'montant_ttc', label: 'TTC', render: (f) => <span className="font-bold text-escom-blue-700">{formatXAF(f.montant_ttc)}</span> },
          { key: 'statut_paiement', label: 'Statut', render: (f) => <StatusBadge statut={f.statut_paiement} /> },
          { key: '_actions', label: '', render: (f) => (
            <button onClick={() => downloadPdf(f.id_facture_tranche, f.numero_facture)} className="text-escom-blue-600 hover:underline text-sm inline-flex items-center gap-1">
              <Download size={14} /> PDF
            </button>
          )},
        ]}
      />
    </DashboardLayout>
  )
}
