'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { formatXAF, formatDate } from '@/lib/utils'
import { Download, CreditCard } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function AdminFactures() {
  const [paymentFor, setPaymentFor] = useState<any>(null)
  const [paymentForm, setPaymentForm] = useState({ montant: '', mode_paiement: 'mobile_money', reference_paiement: '' })

  const downloadPdf = async (id: number, num: string) => {
    const res = await api.get(`/factures/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `Facture-${num}.pdf`; a.click()
  }

  const recordPayment = async () => {
    try {
      await api.post(`/factures/${paymentFor.id_facture_tranche}/paiements`, {
        ...paymentForm, montant: Number(paymentForm.montant)
      })
      toast.success('Paiement enregistré')
      setPaymentFor(null); setPaymentForm({ montant: '', mode_paiement: 'mobile_money', reference_paiement: '' })
      window.location.reload()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-6"><h1 className="text-2xl font-bold">Toutes les factures</h1></div>
      <DataTable
        endpoint="/factures"
        columns={[
          { key: 'numero_facture', label: 'N°', render: (f) => <span className="font-mono">{f.numero_facture}</span> },
          { key: 'client', label: 'Client', render: (f) => f.client?.nom_complet || '-' },
          { key: 'date_emission', label: 'Émise', render: (f) => formatDate(f.date_emission) },
          { key: 'montant_ttc', label: 'TTC', render: (f) => formatXAF(f.montant_ttc) },
          { key: 'montant_paye', label: 'Payé', render: (f) => formatXAF(f.montant_paye) },
          { key: 'statut_paiement', label: 'Statut', render: (f) => <StatusBadge statut={f.statut_paiement} /> },
          { key: '_actions', label: 'Actions', render: (f) => (
            <div className="flex gap-2">
              <button onClick={() => downloadPdf(f.id_facture_tranche, f.numero_facture)} className="text-escom-blue-600"><Download size={14} /></button>
              {f.statut_paiement !== 'payee' && (
                <button onClick={() => { setPaymentFor(f); setPaymentForm({ ...paymentForm, montant: String(f.montant_ttc - (f.montant_paye || 0)) }) }} className="text-escom-gold-600"><CreditCard size={14} /></button>
              )}
            </div>
          )},
        ]}
      />
      {paymentFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPaymentFor(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Enregistrer un paiement</h2>
            <p className="text-sm text-escom-neutral-500 mb-4">Facture {paymentFor.numero_facture}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Montant (XAF)</label>
                <input type="number" value={paymentForm.montant} onChange={e => setPaymentForm({...paymentForm, montant: e.target.value})} className="input-escom" />
              </div>
              <div>
                <label className="text-sm font-semibold">Mode de paiement</label>
                <select value={paymentForm.mode_paiement} onChange={e => setPaymentForm({...paymentForm, mode_paiement: e.target.value})} className="input-escom">
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement</option>
                  <option value="especes">Espèces</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Référence (optionnel)</label>
                <input value={paymentForm.reference_paiement} onChange={e => setPaymentForm({...paymentForm, reference_paiement: e.target.value})} className="input-escom" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPaymentFor(null)} className="btn-outline">Annuler</button>
              <button onClick={recordPayment} className="btn-primary">Valider</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
