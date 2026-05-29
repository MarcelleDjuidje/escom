'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { Download, Lock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { api, fileUrl } from '@/lib/api'
import { toast } from 'sonner'

export default function ClientLivrables() {
  const download = async (id: number, nom: string) => {
    try {
      const res = await api.get(`/livrables/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = nom; a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Téléchargement non autorisé — solde non payé')
    }
  }
  return (
    <DashboardLayout role="client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mes livrables</h1>
        <p className="text-escom-neutral-500 text-sm">⚠️ Le téléchargement HD se débloque au paiement du solde.</p>
      </div>
      <DataTable
        endpoint="/livrables"
        emptyText="Aucun livrable disponible."
        columns={[
          { key: 'nom_fichier', label: 'Fichier', render: (l) => <span className="font-medium">{l.nom_fichier}</span> },
          { key: 'projet', label: 'Projet', render: (l) => l.projet?.titre || '-' },
          { key: 'version', label: 'Version', render: (l) => `v${l.version}` },
          { key: 'date_depot', label: 'Déposé le', render: (l) => formatDate(l.date_depot) },
          { key: '_actions', label: '', render: (l) => (
            <button onClick={() => download(l.id_livrable, l.nom_fichier)}
              className="text-escom-blue-600 hover:underline text-sm inline-flex items-center gap-1">
              <Download size={14} /> Télécharger
            </button>
          )},
        ]}
      />
    </DashboardLayout>
  )
}
