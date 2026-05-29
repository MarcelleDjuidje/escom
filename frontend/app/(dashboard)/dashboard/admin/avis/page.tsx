'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Star, Search, Check, X as XIcon, Trash, MessageSquare, Send, Calendar } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'valide', label: 'Validé', color: 'bg-green-100 text-green-700' },
  { value: 'rejete', label: 'Rejeté', color: 'bg-red-100 text-red-700' },
]

export default function AdminAvis() {
  const [avisList, setAvisList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterNote, setFilterNote] = useState('')
  const [reponseModal, setReponseModal] = useState<any>(null)
  const [reponseText, setReponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoading(true)
    api.get('/admin/avis')
      .then((r: any) => setAvisList(r.data?.data || r.data || []))
      .catch(() => setAvisList([]))
      .finally(() => setLoading(false))
  }

  const valider = async (avis: any) => {
    try {
      await api.post(`/admin/avis/${avis.id_avis}/valider`)
      toast.success('Avis validé — il est maintenant public')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    }
  }

  const rejeter = async (avis: any) => {
    if (!confirm(`Rejeter cet avis de ${getClientName(avis)} ? Il ne sera pas affiché publiquement.`)) return
    try {
      await api.post(`/admin/avis/${avis.id_avis}/rejeter`)
      toast.success('Avis rejeté')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    }
  }

  const supprimer = async (avis: any) => {
    if (!confirm(`Supprimer définitivement cet avis ? Cette action est irréversible.`)) return
    try {
      await api.delete(`/admin/avis/${avis.id_avis}`)
      toast.success('Avis supprimé')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    }
  }

  const openReponseModal = (avis: any) => {
    setReponseModal(avis)
    setReponseText(avis.reponse_admin || '')
  }

  const envoyerReponse = async () => {
    if (!reponseText.trim()) {
      toast.error('La réponse ne peut pas être vide')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/avis/${reponseModal.id_avis}/repondre`, {
        reponse: reponseText.trim(),
      })
      toast.success('Réponse enregistrée')
      setReponseModal(null)
      setReponseText('')
      fetchData()
    } catch (e: any) {
      console.error('Erreur réponse:', e.response?.data)
      const errors = e.response?.data?.errors
      if (errors) {
        const messages = Object.entries(errors).map(([f, m]: any) => `${f}: ${m[0]}`).join('\n')
        toast.error(messages)
      } else {
        toast.error(e.response?.data?.message || 'Erreur')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getClientName = (avis: any): string => {
    return avis.client?.nom_complet || avis.client?.raison_sociale || 'Client'
  }

  const filteredAvis = useMemo(() => {
    return avisList.filter((a: any) => {
      if (filterStatut && a.statut !== filterStatut) return false
      if (filterNote && Number(a.note) !== Number(filterNote)) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return String(a.commentaire || '').toLowerCase().includes(q) ||
             String(getClientName(a)).toLowerCase().includes(q) ||
             String(a.reponse_admin || '').toLowerCase().includes(q)
    })
  }, [avisList, search, filterStatut, filterNote])

  const getStatutBadge = (statut: string) => STATUTS.find(s => s.value === statut) || STATUTS[0]

  const stats = useMemo(() => {
    const total = avisList.length
    const enAttente = avisList.filter(a => a.statut === 'en_attente').length
    const moyenne = total > 0
      ? (avisList.reduce((sum, a) => sum + Number(a.note || 0), 0) / total).toFixed(1)
      : '0'
    return { total, enAttente, moyenne }
  }, [avisList])

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Avis clients</h1>
        <p className="text-escom-neutral-500 text-sm">Modérez et répondez aux retours de vos clients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-escom p-4">
          <p className="text-xs text-escom-neutral-500 uppercase">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="card-escom p-4 bg-yellow-50 border-yellow-200">
          <p className="text-xs text-yellow-700 uppercase">À modérer</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.enAttente}</p>
        </div>
        <div className="card-escom p-4 bg-escom-gold-50 border-escom-gold-200">
          <p className="text-xs text-escom-gold-700 uppercase">Note moyenne</p>
          <p className="text-2xl font-bold text-escom-gold-700 flex items-center gap-1">
            {stats.moyenne} <Star className="fill-escom-gold-500 text-escom-gold-500" size={18} />
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
          <input type="search" placeholder="Rechercher dans les avis..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-escom pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input-escom !py-2 !text-sm">
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterNote} onChange={e => setFilterNote(e.target.value)} className="input-escom !py-2 !text-sm">
            <option value="">Toutes notes</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-escom-blue-600" /></div>
      ) : filteredAvis.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          {search || filterStatut || filterNote ? 'Aucun résultat' : 'Aucun avis pour le moment'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAvis.map((avis: any) => {
            const badge = getStatutBadge(avis.statut)
            const isEnAttente = avis.statut === 'en_attente'
            const aReponse = !!avis.reponse_admin

            return (
              <motion.div key={avis.id_avis}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card-escom p-5">

                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-escom-blue-100 text-escom-blue-700 flex items-center justify-center font-bold shrink-0">
                      {getClientName(avis).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{getClientName(avis)}</p>
                      <p className="text-xs text-escom-neutral-500 flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(avis.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={16}
                      className={n <= Number(avis.note)
                        ? 'fill-escom-gold-500 text-escom-gold-500'
                        : 'text-escom-neutral-300'} />
                  ))}
                  <span className="ml-1 text-sm font-semibold">{avis.note}/5</span>
                </div>

                {avis.commentaire && (
                  <p className="text-sm text-escom-neutral-700 italic">"{avis.commentaire}"</p>
                )}

                {aReponse && (
                  <div className="mt-3 p-3 bg-escom-blue-50 border-l-4 border-l-escom-blue-500 rounded">
                    <p className="text-xs font-semibold text-escom-blue-700 mb-1 flex items-center gap-1">
                      <MessageSquare size={12} /> Votre réponse
                    </p>
                    <p className="text-sm text-escom-neutral-700">{avis.reponse_admin}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                  {isEnAttente && (
                    <>
                      <button onClick={() => valider(avis)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200">
                        <Check size={14} /> Valider
                      </button>
                      <button onClick={() => rejeter(avis)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200">
                        <XIcon size={14} /> Rejeter
                      </button>
                    </>
                  )}
                  <button onClick={() => openReponseModal(avis)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold bg-escom-blue-100 text-escom-blue-700 hover:bg-escom-blue-200">
                    <MessageSquare size={14} /> {aReponse ? 'Modifier la réponse' : 'Répondre'}
                  </button>
                  <button onClick={() => supprimer(avis)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 ml-auto">
                    <Trash size={14} /> Supprimer
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal réponse */}
      <AnimatePresence>
        {reponseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setReponseModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full"
              onClick={e => e.stopPropagation()}>

              <div className="p-5 border-b flex items-center justify-between bg-escom-gradient text-white rounded-t-2xl">
                <h3 className="font-bold">Répondre à l'avis</h3>
                <button onClick={() => setReponseModal(null)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                  <XIcon size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-3 bg-escom-neutral-50 rounded-lg">
                  <p className="text-xs font-semibold text-escom-neutral-500 uppercase mb-1">
                    {getClientName(reponseModal)} a écrit :
                  </p>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={12}
                        className={n <= Number(reponseModal.note)
                          ? 'fill-escom-gold-500 text-escom-gold-500'
                          : 'text-escom-neutral-300'} />
                    ))}
                  </div>
                  <p className="text-sm italic">"{reponseModal.commentaire}"</p>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">Votre réponse publique</label>
                  <textarea value={reponseText}
                    onChange={e => setReponseText(e.target.value)}
                    rows={6}
                    placeholder="Merci pour votre retour !..."
                    className="input-escom" />
                  <p className="text-[10px] text-escom-neutral-500 mt-1">
                    {reponseText.length}/2000 caractères
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button onClick={() => setReponseModal(null)} className="btn-outline">Annuler</button>
                  <button onClick={envoyerReponse} disabled={submitting || !reponseText.trim()} className="btn-primary">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Envoyer la réponse
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}