'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { api } from '@/lib/api'
import { formatDate, formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

export default function EmployeDemandes() {
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [respondTo, setRespondTo] = useState<any>(null)
  const [response, setResponse] = useState({ reponse_escom: '', prix_propose: '' })

  useEffect(() => { fetchData() }, [])
  const fetchData = () => {
    setLoading(true)
    api.get('/demandes-campagne').then(r => setDemandes(r.data?.data || r.data || [])).finally(() => setLoading(false))
  }

  const submitResponse = async () => {
    try {
      await api.post(`/demandes-campagne/${respondTo.id_demande}/respond`, {
        reponse_escom: response.reponse_escom,
        prix_propose: Number(response.prix_propose),
      })
      toast.success('Réponse envoyée')
      setRespondTo(null); setResponse({ reponse_escom: '', prix_propose: '' })
      fetchData()
    } catch { toast.error('Erreur') }
  }

  return (
    <DashboardLayout role="employe">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Demandes de campagne</h1>
        <p className="text-escom-neutral-500 text-sm">Répondez aux demandes des clients</p>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600 mx-auto" /> : (
        <div className="grid gap-4">
          {demandes.length === 0 ? (
            <div className="card-escom p-12 text-center text-escom-neutral-500">Aucune demande</div>
          ) : demandes.map(d => (
            <div key={d.id_demande} className="card-escom p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{d.objectif_principal}</p>
                  <p className="text-xs text-escom-neutral-500">{d.numero_demande} • {d.client?.nom_complet} • {formatDate(d.date_demande)}</p>
                </div>
                <StatusBadge statut={d.statut} />
              </div>
              <p className="text-sm text-escom-neutral-700 mb-3">{d.description_projet}</p>
              <div className="flex gap-3 text-xs text-escom-neutral-500">
                {d.budget_indicatif && <span>💰 {formatXAF(d.budget_indicatif)}</span>}
                {d.duree_souhaitee && <span>⏱ {d.duree_souhaitee}</span>}
              </div>
              {d.statut === 'en_attente' && (
                <button onClick={() => setRespondTo(d)} className="btn-primary mt-3 text-sm">Répondre</button>
              )}
            </div>
          ))}
        </div>
      )}

      {respondTo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRespondTo(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Répondre à la demande</h2>
            <p className="text-sm text-escom-neutral-500 mb-4">{respondTo.objectif_principal}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Votre réponse</label>
                <textarea rows={4} value={response.reponse_escom} onChange={e => setResponse({...response, reponse_escom: e.target.value})} className="input-escom" />
              </div>
              <div>
                <label className="text-sm font-semibold">Prix proposé (XAF)</label>
                <input type="number" value={response.prix_propose} onChange={e => setResponse({...response, prix_propose: e.target.value})} className="input-escom" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRespondTo(null)} className="btn-outline">Annuler</button>
              <button onClick={submitResponse} className="btn-primary">Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
