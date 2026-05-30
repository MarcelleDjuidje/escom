'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, Pencil, Trash, Search, ToggleLeft, ToggleRight, Tag, Calendar } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatDate, formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

const TYPES_SERVICES = [
  { id: 'CONCEPTION', label: 'Conception', endpoint: '/public/services/conception', idKey: 'id_service_conception', priceKey: 'prix_unitaire_ht' },
  { id: 'IMPRESSION', label: 'Impression', endpoint: '/public/services/impression', idKey: 'id_service_impression', priceKey: 'prix_unitaire_ht' },
  { id: 'SOCIAL', label: 'Social Media', endpoint: '/public/services/social', idKey: 'id_service_social', priceKey: 'prix_ht' },
]

const STATUTS = [
  { value: 'planifiee', label: 'Planifiée', color: 'bg-blue-100 text-blue-700' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'expiree', label: 'Expirée', color: 'bg-gray-100 text-gray-600' },
  { value: 'desactivee', label: 'Désactivée', color: 'bg-red-100 text-red-700' },
]

const EMPTY_FORM = {
  type_service: 'CONCEPTION',
  id_service_ref: '',
  libelle_service: '',
  prix_original_ht: '',
  taux_remise_pct: '',
  date_debut: '',
  date_fin: '',
  notes: '',
}

export default function AdminPromotions() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState<any>(EMPTY_FORM)

  useEffect(() => { fetchData() }, [])
  useEffect(() => { fetchServices() }, [form.type_service])

  const fetchData = () => {
    setLoading(true)
    api.get('/admin/promotions')
      .then((r: any) => setItems(r.data?.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  const fetchServices = () => {
    const tab = TYPES_SERVICES.find(t => t.id === form.type_service)
    if (!tab) return
    api.get(tab.endpoint).then((r: any) => setServices(r.data || []))
  }

  const config = TYPES_SERVICES.find(t => t.id === form.type_service) || TYPES_SERVICES[0]

  const onServiceSelected = (id: string) => {
    const svc = services.find((s: any) => String(s[config.idKey]) === id)
    setForm({
      ...form,
      id_service_ref: id,
      libelle_service: svc?.libelle || '',
      prix_original_ht: String(svc?.[config.priceKey] || 0),
    })
  }

  const openNewForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (promo: any) => {
    setEditing(promo)
    setForm({
      type_service: promo.type_service || 'CONCEPTION',
      id_service_ref: String(promo.id_service_ref || ''),
      libelle_service: promo.libelle_service || '',
      prix_original_ht: String(promo.prix_original_ht || ''),
      taux_remise_pct: String(promo.taux_remise_pct || ''),
      date_debut: promo.date_debut ? String(promo.date_debut).split('T')[0] : '',
      date_fin: promo.date_fin ? String(promo.date_fin).split('T')[0] : '',
      notes: promo.notes || '',
    })
    setShowForm(true)
  }

  const submit = async () => {
    try {
      const payload = {
        ...form,
        id_service_ref: Number(form.id_service_ref),
        prix_original_ht: Number(form.prix_original_ht),
        taux_remise_pct: Number(form.taux_remise_pct),
      }

      if (editing) {
        await api.patch(`/admin/promotions/${editing.id_promotion}`, payload)
        toast.success('Promotion modifiée')
      } else {
        await api.post('/admin/promotions', payload)
        toast.success('Promotion créée')
      }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      fetchData()
    } catch (e: any) {
      console.error('Erreur promotion:', e.response?.data)
      const errors = e.response?.data?.errors
      if (errors) {
        const messages = Object.entries(errors).map(([f, m]: any) => `${f}: ${m[0]}`).join('\n')
        toast.error(messages)
      } else {
        toast.error(e.response?.data?.message || 'Erreur')
      }
    }
  }

  const toggleActive = async (promo: any) => {
    try {
      await api.patch(`/admin/promotions/${promo.id_promotion}/toggle`)
      toast.success('Statut mis à jour')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (promo: any) => {
    if (!confirm(`Supprimer définitivement la promotion "${promo.libelle_service}" ?\n\nCette action est irréversible. Si vous voulez juste la mettre en pause, utilisez plutôt le bouton "Désactiver".`)) return
    try {
      await api.delete(`/admin/promotions/${promo.id_promotion}`)
      toast.success('Promotion supprimée')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((p: any) => {
      if (filterStatut && p.statut !== filterStatut) return false
      if (filterType && p.type_service !== filterType) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return String(p.libelle_service || '').toLowerCase().includes(q) ||
             String(p.notes || '').toLowerCase().includes(q) ||
             String(p.type_service || '').toLowerCase().includes(q)
    })
  }, [items, search, filterStatut, filterType])

  const getStatutBadge = (statut: string) => STATUTS.find(s => s.value === statut) || STATUTS[0]
  const getTypeLabel = (type: string) => TYPES_SERVICES.find(t => t.id === type)?.label || type

  // Calcul du prix promo en direct dans le form
  const prixPromo = form.prix_original_ht && form.taux_remise_pct
    ? Number(form.prix_original_ht) * (1 - Number(form.taux_remise_pct) / 100)
    : 0

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <p className="text-escom-neutral-500 text-sm">
          {items.length} promotion{items.length > 1 ? 's' : ''} enregistrée{items.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
          <input type="search" placeholder="Rechercher (libellé, notes...)"
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-escom pl-10" />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-escom !py-2 !text-sm">
            <option value="">Tous types</option>
            {TYPES_SERVICES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input-escom !py-2 !text-sm">
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={openNewForm} className="btn-primary">
            <Plus size={16} /> Nouvelle
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card-escom p-5 mb-6">
          <h3 className="font-semibold text-lg mb-4 pb-3 border-b">
            {editing ? '✏️ Modifier la promotion' : '➕ Nouvelle promotion'}
          </h3>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Type de service *</label>
              <select value={form.type_service}
                onChange={e => setForm({...form, type_service: e.target.value, id_service_ref: '', libelle_service: '', prix_original_ht: ''})}
                className="input-escom" disabled={!!editing}>
                {TYPES_SERVICES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {editing && <p className="text-[10px] text-escom-neutral-500 mt-1">Type non modifiable</p>}
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Service concerné *</label>
              <select value={form.id_service_ref} onChange={e => onServiceSelected(e.target.value)} className="input-escom">
                <option value="">-- Choisir --</option>
                {services.map((s: any) => {
                  const id = s[config.idKey]
                  return <option key={id} value={id}>{s.libelle}</option>
                })}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold block mb-1">Libellé de la promotion *</label>
              <input value={form.libelle_service}
                onChange={e => setForm({...form, libelle_service: e.target.value})}
                placeholder="Ex: Promo de lancement, Black Friday..."
                className="input-escom" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Prix original HT (XAF) *</label>
              <input type="number" value={form.prix_original_ht}
                onChange={e => setForm({...form, prix_original_ht: e.target.value})}
                className="input-escom" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Remise (%) *</label>
              <input type="number" min={1} max={99} value={form.taux_remise_pct}
                onChange={e => setForm({...form, taux_remise_pct: e.target.value})}
                placeholder="Ex: 15"
                className="input-escom" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                <Calendar size={11} className="inline" /> Date début *
              </label>
              <input type="date" value={form.date_debut}
                onChange={e => setForm({...form, date_debut: e.target.value})}
                className="input-escom" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                <Calendar size={11} className="inline" /> Date fin *
              </label>
              <input type="date" value={form.date_fin}
                onChange={e => setForm({...form, date_fin: e.target.value})}
                className="input-escom" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold block mb-1">Notes / Description</label>
              <textarea rows={2} value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Conditions, public ciblé, message marketing..."
                className="input-escom" />
            </div>

            {/* Aperçu du calcul */}
            {prixPromo > 0 && (
              <div className="md:col-span-2 p-3 bg-escom-gold-50 border border-escom-gold-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-escom-gold-700 uppercase font-semibold">Aperçu</p>
                    <p className="text-sm">
                      <span className="line-through text-escom-neutral-500">{formatXAF(Number(form.prix_original_ht))}</span>
                      <span className="ml-2 font-bold text-escom-gold-700 text-lg">{formatXAF(prixPromo)}</span>
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-escom-gold-700">-{form.taux_remise_pct}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM) }} className="btn-outline">
              Annuler
            </button>
            <button onClick={submit} className="btn-primary">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-escom-blue-600" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          {search || filterType || filterStatut
            ? 'Aucun résultat pour ces critères'
            : 'Aucune promotion enregistrée'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredItems.map((p: any) => {
            const badge = getStatutBadge(p.statut)
            const isActive = p.statut === 'active'
            return (
              <motion.div key={p.id_promotion}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card-escom p-5 flex flex-col">

                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="text-escom-gold-600" size={18} />
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-escom-blue-100 text-escom-blue-700">
                      {getTypeLabel(p.type_service)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <h3 className="font-bold mt-1">{p.libelle_service}</h3>

                <div className="flex items-center gap-3 mt-2">
                  <span className="line-through text-escom-neutral-500 text-sm">
                    {formatXAF(p.prix_original_ht)}
                  </span>
                  <span className="font-bold text-escom-gold-700 text-lg">
                    {formatXAF(p.prix_promo_ht)}
                  </span>
                  <span className="ml-auto text-2xl font-bold text-escom-gold-600">
                    -{p.taux_remise_pct}%
                  </span>
                </div>

                <p className="text-xs text-escom-neutral-500 mt-2">
                  📅 Du {formatDate(p.date_debut)} au {formatDate(p.date_fin)}
                </p>

                {p.notes && (
                  <p className="text-xs text-escom-neutral-600 mt-2 italic line-clamp-2">{p.notes}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <button onClick={() => toggleActive(p)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                      isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {isActive ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Inactive</>}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => openEditForm(p)}
                      className="text-escom-blue-600 hover:bg-escom-blue-50 p-1.5 rounded" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Supprimer définitivement">
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}