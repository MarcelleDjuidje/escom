'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Megaphone, Send, X, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { api } from '@/lib/api'
import { formatDate, formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_etude', label: 'En étude' },
  { value: 'devis_envoye', label: 'Devis envoyé' },
  { value: 'acceptee', label: 'Acceptée' },
  { value: 'refusee', label: 'Refusée' },
]

export default function AdminDemandesCampagne() {
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [showReponse, setShowReponse] = useState(false)
  const [reponseForm, setReponseForm] = useState({ contenu: '', prix_propose: '', delai_realisation: '', est_devis_final: true })
  const [submitting, setSubmitting] = useState(false)

  const charger = () => {
    setLoading(true)
    api.get('/demandes-campagne', { params: filtre ? { statut: filtre } : {} })
      .then(res => setDemandes(res.data?.data || res.data || []))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [filtre])

  const ouvrir = async (id: number) => {
    try {
      const res = await api.get(`/demandes-campagne/${id}`)
      setSelected(res.data)
    } catch {
      toast.error('Impossible de charger la demande')
    }
  }

  const repondre = async () => {
    if (!selected) return
    if (!reponseForm.contenu.trim()) return toast.error('Veuillez rédiger une réponse')
    if (!reponseForm.prix_propose) return toast.error('Veuillez indiquer un prix')

    setSubmitting(true)
    try {
      await api.post(`/demandes-campagne/${selected.id_demande}/repondre`, {
        contenu: reponseForm.contenu,
        prix_propose: Number(reponseForm.prix_propose),
        delai_realisation: reponseForm.delai_realisation || null,
        est_devis_final: reponseForm.est_devis_final,
      })
      toast.success('Réponse envoyée au client !')
      setShowReponse(false)
      setSelected(null)
      setReponseForm({ contenu: '', prix_propose: '', delai_realisation: '', est_devis_final: true })
      charger()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi')
    }
    setSubmitting(false)
  }

  const changerStatut = async (id: number, statut: string) => {
    try {
      await api.patch(`/demandes-campagne/${id}/statut`, { statut })
      setDemandes(prev => prev.map(d => d.id_demande === id ? { ...d, statut } : d))
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Demandes de campagne</h1>
          <p className="text-escom-neutral-500 text-sm">Gérez les demandes de devis campagne des clients</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUTS.map(s => (
          <button key={s.value} onClick={() => setFiltre(s.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtre === s.value ? 'bg-escom-blue-600 text-white' : 'bg-escom-neutral-100 hover:bg-escom-neutral-200'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600 mx-auto" />
      ) : demandes.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          <Megaphone className="w-12 h-12 mx-auto mb-3 text-escom-neutral-300" />
          <p>Aucune demande {filtre ? `avec le statut "${filtre}"` : 'pour le moment'}.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {demandes.map((d: any) => (
            <motion.div key={d.id_demande} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card-escom p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{d.objectif_principal}</p>
                  <p className="text-xs text-escom-neutral-500">
                    {d.numero_demande} &bull; {formatDate(d.date_demande)}
                    {d.client && <span> &bull; <strong>{d.client.nom_complet || d.client.raison_sociale}</strong></span>}
                  </p>
                  {d.campagne && <p className="text-xs text-escom-blue-600 mt-1">{d.campagne.titre}</p>}
                </div>
                <StatusBadge statut={d.statut} />
              </div>

              <p className="text-sm text-escom-neutral-700 line-clamp-2">{d.description_projet}</p>

              <div className="flex flex-wrap gap-3 mt-3 text-xs text-escom-neutral-500">
                {d.budget_indicatif && <span>Budget: {formatXAF(d.budget_indicatif)}</span>}
                {d.duree_souhaitee && <span>Durée: {d.duree_souhaitee}</span>}
                {d.zone_geographique && <span>Zone: {d.zone_geographique}</span>}
                {d.cible && <span>Cible: {d.cible}</span>}
              </div>

              {/* Réponse existante */}
              {d.prix_propose && (
                <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-xs text-green-700 font-semibold">Devis envoyé : {formatXAF(d.prix_propose)}</p>
                  {d.reponse_escom && <p className="text-sm mt-1 text-green-800">{d.reponse_escom}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => { ouvrir(d.id_demande); setShowReponse(false) }}
                  className="btn-outline text-xs flex items-center gap-1">
                  <Eye size={12} /> Détails
                </button>
                {(d.statut === 'en_attente' || d.statut === 'en_etude') && (
                  <>
                    {d.statut === 'en_attente' && (
                      <button onClick={() => changerStatut(d.id_demande, 'en_etude')}
                        className="btn-outline text-xs flex items-center gap-1">
                        <Clock size={12} /> Mettre en étude
                      </button>
                    )}
                    <button onClick={() => { ouvrir(d.id_demande); setShowReponse(true) }}
                      className="btn-primary text-xs flex items-center gap-1">
                      <Send size={12} /> Répondre / Chiffrer
                    </button>
                  </>
                )}
                {d.statut === 'devis_envoye' && (
                  <button onClick={() => { ouvrir(d.id_demande); setShowReponse(true) }}
                    className="btn-outline text-xs flex items-center gap-1">
                    <Send size={12} /> Modifier le devis
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL DETAIL + REPONSE */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setSelected(null); setShowReponse(false) }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between bg-escom-gradient text-white px-6 py-4 rounded-t-2xl">
                <div>
                  <p className="text-xs text-blue-200">{selected.numero_demande}</p>
                  <h2 className="text-lg font-bold">{selected.objectif_principal}</h2>
                </div>
                <button onClick={() => { setSelected(null); setShowReponse(false) }}
                  className="p-2 rounded-lg hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Client */}
                {selected.client && (
                  <div className="p-3 bg-escom-neutral-50 rounded-lg">
                    <p className="text-xs text-escom-neutral-500 font-semibold uppercase mb-1">Client</p>
                    <p className="font-semibold">{selected.client.nom_complet || selected.client.raison_sociale}</p>
                    {selected.client.email && <p className="text-xs text-escom-neutral-500">{selected.client.email}</p>}
                    {selected.client.telephone && <p className="text-xs text-escom-neutral-500">{selected.client.telephone}</p>}
                  </div>
                )}

                {/* Campagne */}
                {selected.campagne && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Type de campagne</p>
                    <p className="font-semibold">{selected.campagne.titre}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-xs text-escom-neutral-500 font-semibold uppercase mb-1">Description du projet</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.description_projet}</p>
                </div>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-3">
                  {selected.budget_indicatif && (
                    <div className="p-3 bg-escom-neutral-50 rounded-lg">
                      <p className="text-xs text-escom-neutral-500">Budget indicatif</p>
                      <p className="font-bold">{formatXAF(selected.budget_indicatif)}</p>
                    </div>
                  )}
                  {selected.duree_souhaitee && (
                    <div className="p-3 bg-escom-neutral-50 rounded-lg">
                      <p className="text-xs text-escom-neutral-500">Durée souhaitée</p>
                      <p className="font-bold">{selected.duree_souhaitee}</p>
                    </div>
                  )}
                  {selected.zone_geographique && (
                    <div className="p-3 bg-escom-neutral-50 rounded-lg">
                      <p className="text-xs text-escom-neutral-500">Zone géographique</p>
                      <p className="font-bold">{selected.zone_geographique}</p>
                    </div>
                  )}
                  {selected.cible && (
                    <div className="p-3 bg-escom-neutral-50 rounded-lg">
                      <p className="text-xs text-escom-neutral-500">Cible visée</p>
                      <p className="font-bold">{selected.cible}</p>
                    </div>
                  )}
                </div>

                {/* Réponses précédentes */}
                {selected.reponses && selected.reponses.length > 0 && (
                  <div>
                    <p className="text-xs text-escom-neutral-500 font-semibold uppercase mb-2">Historique des réponses</p>
                    <div className="space-y-2">
                      {selected.reponses.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex justify-between text-xs text-green-700 mb-1">
                            <span className="font-semibold">{r.employe?.nom_complet || 'ESCOM'}</span>
                            <span>{formatDate(r.created_at)}</span>
                          </div>
                          <p className="text-sm">{r.contenu}</p>
                          {r.prix_propose && <p className="text-lg font-bold text-green-700 mt-1">{formatXAF(r.prix_propose)}</p>}
                          {r.delai_realisation && <p className="text-xs text-green-600 mt-1">Délai : {r.delai_realisation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FORMULAIRE REPONSE */}
                {showReponse && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Send size={18} className="text-escom-blue-600" /> Répondre au client
                    </h3>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">Votre réponse / proposition *</label>
                      <textarea rows={4} value={reponseForm.contenu}
                        onChange={e => setReponseForm({ ...reponseForm, contenu: e.target.value })}
                        className="input-escom" placeholder="Décrivez votre proposition, détails de la campagne..." />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Prix proposé (XAF) *</label>
                        <input type="number" value={reponseForm.prix_propose}
                          onChange={e => setReponseForm({ ...reponseForm, prix_propose: e.target.value })}
                          className="input-escom" placeholder="Ex: 500000" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-1 block">Délai de réalisation</label>
                        <input value={reponseForm.delai_realisation}
                          onChange={e => setReponseForm({ ...reponseForm, delai_realisation: e.target.value })}
                          className="input-escom" placeholder="Ex: 2 semaines" />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={reponseForm.est_devis_final}
                        onChange={e => setReponseForm({ ...reponseForm, est_devis_final: e.target.checked })}
                        className="rounded" />
                      <span>C'est un devis final (le client pourra accepter/refuser)</span>
                    </label>

                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowReponse(false)} className="btn-outline">Annuler</button>
                      <button onClick={repondre} disabled={submitting} className="btn-primary">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Envoyer la proposition
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
