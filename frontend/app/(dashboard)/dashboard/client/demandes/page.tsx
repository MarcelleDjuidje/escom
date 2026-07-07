'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { api } from '@/lib/api'
import { formatDate, formatXAF } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ClientDemandes() {
  const router = useRouter()
  const [demandes, setDemandes] = useState<any[]>([])
  const [campagnes, setCampagnes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    id_campagne: '', objectif_principal: '', budget_indicatif: '', duree_souhaitee: '',
    cible: '', zone_geographique: 'Cameroun', description_projet: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/demandes-campagne'),
      api.get('/public/services/campagnes'),
    ]).then(([d, c]) => {
      setDemandes(d.data?.data || d.data || [])
      setCampagnes(c.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const changerStatut = async (id: number, statut: string) => {
    try {
      await api.patch(`/demandes-campagne/${id}/statut`, { statut })
      setDemandes(prev => prev.map(d => d.id_demande === id ? { ...d, statut } : d))
      toast.success(statut === 'acceptee' ? 'Devis accepté !' : 'Demande refusée')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/demandes-campagne', { ...form, id_campagne: Number(form.id_campagne), budget_indicatif: form.budget_indicatif ? Number(form.budget_indicatif) : null })
      setDemandes([res.data, ...demandes])
      toast.success('Demande envoyée — un commercial vous répondra sous 24h')
      setShowForm(false)
      setForm({ id_campagne: '', objectif_principal: '', budget_indicatif: '', duree_souhaitee: '', cible: '', zone_geographique: 'Cameroun', description_projet: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi')
    }
    setSubmitting(false)
  }

  return (
    <DashboardLayout role="client">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Demandes de campagne</h1>
          <p className="text-escom-neutral-500 text-sm">Vos requêtes de campagnes marketing 360°</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={16} /> Nouvelle demande</button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          onSubmit={submit} className="card-escom p-6 mb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Type de campagne *</label>
              <select required value={form.id_campagne} onChange={e => setForm({ ...form, id_campagne: e.target.value })} className="input-escom">
                <option value="">Choisir...</option>
                {campagnes.map(c => <option key={c.id_campagne} value={c.id_campagne}>{c.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Budget indicatif (XAF)</label>
              <input type="number" value={form.budget_indicatif} onChange={e => setForm({ ...form, budget_indicatif: e.target.value })} className="input-escom" placeholder="Ex: 500000" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold mb-1 block">Objectif principal *</label>
              <input required value={form.objectif_principal} onChange={e => setForm({ ...form, objectif_principal: e.target.value })} className="input-escom" placeholder="Ex: Lancer ma marque, accroître les ventes..." />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Durée souhaitée</label>
              <input value={form.duree_souhaitee} onChange={e => setForm({ ...form, duree_souhaitee: e.target.value })} className="input-escom" placeholder="Ex: 3 mois" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Zone géographique</label>
              <input value={form.zone_geographique} onChange={e => setForm({ ...form, zone_geographique: e.target.value })} className="input-escom" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold mb-1 block">Cible visée</label>
              <input value={form.cible} onChange={e => setForm({ ...form, cible: e.target.value })} className="input-escom" placeholder="Ex: Femmes 25-45 ans, urbaines" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold mb-1 block">Description du projet *</label>
              <textarea required rows={4} value={form.description_projet} onChange={e => setForm({ ...form, description_projet: e.target.value })} className="input-escom" placeholder="Décrivez votre besoin en détail..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? <Loader2 size={16} className="animate-spin" /> : null}Envoyer</button>
          </div>
        </motion.form>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600 mx-auto" /> : (
        <div className="grid gap-4">
          {demandes.length === 0 ? (
            <div className="card-escom p-12 text-center text-escom-neutral-500">Aucune demande pour le moment.</div>
          ) : demandes.map(d => (
            <div key={d.id_demande} className="card-escom p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{d.objectif_principal}</p>
                  <p className="text-xs text-escom-neutral-500">{d.numero_demande} • {formatDate(d.date_demande)}</p>
                </div>
                <StatusBadge statut={d.statut} />
              </div>
              <p className="text-sm text-escom-neutral-700 line-clamp-2">{d.description_projet}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-escom-neutral-500">
                {d.budget_indicatif && <span>💰 {formatXAF(d.budget_indicatif)}</span>}
                {d.duree_souhaitee && <span>⏱ {d.duree_souhaitee}</span>}
                {d.zone_geographique && <span>📍 {d.zone_geographique}</span>}
              </div>
              {d.prix_propose && (
                <div className="mt-3 p-3 bg-escom-gold-50 rounded border border-escom-gold-200">
                  <p className="text-xs text-escom-gold-800 font-semibold uppercase">Proposition commerciale ESCOM</p>
                  <p className="text-sm mt-1">{d.reponse_escom}</p>
                  <p className="text-lg font-bold text-escom-gold-700 mt-2">{formatXAF(d.prix_propose)}</p>
                  {d.statut === 'devis_envoye' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => changerStatut(d.id_demande, 'acceptee')}
                        className="btn-primary text-sm flex-1 flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} /> Accepter le devis
                      </button>
                      <button
                        onClick={() => changerStatut(d.id_demande, 'refusee')}
                        className="btn-outline text-sm flex-1 flex items-center justify-center gap-1 !text-red-600 !border-red-200">
                        <XCircle size={14} /> Refuser
                      </button>
                    </div>
                  )}
                  {d.statut === 'acceptee' && (
                    <button
                      onClick={() => router.push(`/dashboard/client/commandes/nouveau?type=campagnes&service=${d.id_campagne}&demande=${d.id_demande}&prix=${d.prix_propose}`)}
                      className="btn-primary text-sm w-full mt-3">
                      Commander maintenant
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
