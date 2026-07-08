'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Loader2, Pencil, Trash, Search, Palette, Printer, Megaphone, Target, User } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

const TABS = [
  {
    id: 'conception', label: 'Conception', icon: Palette,
    endpoint: '/public/services/conception',
    adminEndpoint: '/admin/services/conception',
    idKey: 'id_service_conception',
    priceKey: 'prix_unitaire_ht',
    typeField: 'type_conception',
    typeOptions: ['logo','charte_graphique','flyer','carte_visite','brochure','affiche','depliant','banderole','autre'],
  },
  {
    id: 'impression', label: 'Impression', icon: Printer,
    endpoint: '/public/services/impression',
    adminEndpoint: '/admin/services/impression',
    idKey: 'id_service_impression',
    priceKey: 'prix_unitaire_ht',
    typeField: 'type_support',
    typeOptions: ['flyer','affiche','banderole','macaron','roll_up','kakemono','carte_visite','bache','enveloppe','tshirt','autre'],
  },
  {
    id: 'social', label: 'Social Media', icon: Megaphone,
    endpoint: '/public/services/social',
    adminEndpoint: '/admin/services/social',
    idKey: 'id_service_social',
    priceKey: 'prix_ht',
    typeField: 'type_prestation',
    typeOptions: ['post_simple','story','reel','gestion_compte','publicite_sponsorisee','audit','strategie_editoriale'],
  },
  {
    id: 'campagne', label: 'Campagnes', icon: Target,
    endpoint: '/public/services/campagnes',
    adminEndpoint: '/admin/services/campagnes',
    idKey: 'id_campagne',
    priceKey: 'prix_indicatif_min',
    typeField: 'type_campagne',
    typeOptions: ['social_ads','affichage','radio_tv','evenementiel','influence','email_marketing','seo_sea','autre'],
  },
]

export default function AdminServices() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [search, setSearch] = useState('')
  const [employes, setEmployes] = useState<any[]>([])

  // Charger la liste des employés une seule fois
  useEffect(() => {
    api.get('/admin/employes').then((r: any) => {
      const list = r.data?.data || r.data || []
      setEmployes(list.filter((e: any) => e.actif !== false && e.actif !== 0))
    }).catch(() => setEmployes([]))
  }, [])

  useEffect(() => { fetchData() }, [activeTab])

  const fetchData = () => {
    setLoading(true)
    api.get(activeTab.endpoint)
      .then((r: any) => setItems(r.data || []))
      .finally(() => setLoading(false))
  }

  const openNewForm = () => {
    setEditing(null)
    setForm({
      libelle: '',
      description: '',
      [activeTab.priceKey]: '',
      duree_livraison_jours: '',
      est_actif: true,
      id_categorie: 1,
      id_employe_responsable: '',
      [activeTab.typeField]: activeTab.typeOptions[0],
    })
    setShowForm(true)
  }

  const openEditForm = (item: any) => {
    setEditing(item)
    setForm({ ...item, id_employe_responsable: item.id_employe_responsable || '' })
    setShowForm(true)
  }

  const submit = async () => {
    try {
      const payload: any = {
        ...form,
        [activeTab.priceKey]: Number(form[activeTab.priceKey]) || 0,
        duree_livraison_jours: Number(form.duree_livraison_jours) || 1,
        id_categorie: Number(form.id_categorie) || 1,
        id_employe_responsable: form.id_employe_responsable ? Number(form.id_employe_responsable) : null,
      }
      if (editing) {
        await api.patch(`${activeTab.adminEndpoint}/${editing[activeTab.idKey]}`, payload)
        toast.success('Service modifié')
      } else {
        await api.post(activeTab.adminEndpoint, payload)
        toast.success('Service créé')
      }
      setShowForm(false)
      setEditing(null)
      fetchData()
    } catch (e: any) {
      console.error('Erreur service:', e.response?.data)
      const errors = e.response?.data?.errors
      if (errors) {
        const messages = Object.entries(errors).map(([f, m]: any) => `${f}: ${m[0]}`).join('\n')
        alert('ERREUR:\n\n' + messages)
      } else {
        toast.error(e.response?.data?.message || 'Erreur')
      }
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Supprimer ce service ? Cette action est irréversible.')) return
    try {
      await api.delete(`${activeTab.adminEndpoint}/${id}`)
      toast.success('Service supprimé')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const getEmployeName = (id: number | null | undefined): string => {
    if (!id) return ''
    const emp = employes.find(e => Number(e.id_employe) === Number(id))
    return emp ? `${emp.prenom} ${emp.nom} (${emp.role})` : `Employé #${id}`
  }

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((s: any) =>
      String(s.libelle || s.titre || '').toLowerCase().includes(q) ||
      String(s.description || '').toLowerCase().includes(q) ||
      String(s[activeTab.typeField] || '').toLowerCase().includes(q)
    )
  }, [items, search, activeTab])

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Catalogue de services</h1>
        <p className="text-escom-neutral-500 text-sm">Gérez les services proposés par ESCOM</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t); setSearch('') }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab.id === t.id
                ? 'bg-escom-blue-600 text-white shadow'
                : 'bg-escom-neutral-100 text-escom-neutral-700 hover:bg-escom-neutral-200'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
          <input type="search" placeholder="Rechercher dans les services..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-escom pl-10" />
        </div>
        <button onClick={openNewForm} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-escom p-5 mb-6 grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-3 pb-3 border-b">
              {editing ? '✏️ Modifier le service' : '➕ Nouveau service'}
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold block mb-1">Sous-type *</label>
            <select value={form[activeTab.typeField] || ''}
              onChange={e => setForm({...form, [activeTab.typeField]: e.target.value})}
              className="input-escom">
              {activeTab.typeOptions.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <input placeholder="Libellé / Titre *" value={form.libelle || form.titre || ''}
            onChange={e => setForm({...form, libelle: e.target.value, titre: e.target.value})}
            className="input-escom md:col-span-2" />

          <textarea placeholder="Description" value={form.description || ''}
            onChange={e => setForm({...form, description: e.target.value})}
            className="input-escom md:col-span-2" rows={3} />

          <div>
            <label className="text-xs font-semibold block mb-1">Prix HT (XAF) *</label>
            <input type="number" value={form[activeTab.priceKey] || ''}
              onChange={e => setForm({...form, [activeTab.priceKey]: e.target.value})}
              className="input-escom" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Délai (jours) *</label>
            <input type="number" value={form.duree_livraison_jours || ''}
              onChange={e => setForm({...form, duree_livraison_jours: e.target.value})}
              className="input-escom" />
          </div>

          {/* Dropdown employé responsable */}
          <div className="md:col-span-2 p-3 bg-escom-blue-50 rounded-lg">
            <label className="text-xs font-semibold block mb-1 text-escom-blue-900">
              <User size={11} className="inline" /> Employé responsable
            </label>
            <select value={form.id_employe_responsable || ''}
              onChange={e => setForm({...form, id_employe_responsable: e.target.value})}
              className="input-escom">
              <option value="">-- Non assigné (à choisir manuellement) --</option>
              {employes.map((emp: any) => (
                <option key={emp.id_employe} value={emp.id_employe}>
                  {emp.prenom} {emp.nom} — {emp.role}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-escom-blue-700 mt-1">
              💡 Cet employé sera automatiquement assigné aux commandes pour ce service.
            </p>
          </div>

          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={form.est_actif !== false}
              onChange={e => setForm({...form, est_actif: e.target.checked})} />
            Service actif
          </label>

          <div className="md:col-span-2 flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-outline">Annuler</button>
            <button onClick={submit} className="btn-primary">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-escom-blue-600" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          {search ? `Aucun résultat pour "${search}"` : `Aucun service de type ${activeTab.label}`}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((s: any) => (
            <div key={s[activeTab.idKey]} className="card-escom p-5 flex flex-col">
              {s[activeTab.typeField] && (
                <span className="inline-block self-start bg-escom-blue-100 text-escom-blue-700 text-[10px] font-semibold uppercase px-2 py-0.5 rounded mb-2">
                  {String(s[activeTab.typeField]).replace(/_/g, ' ')}
                </span>
              )}
              <h3 className="font-bold text-lg mb-2">{s.libelle || s.titre}</h3>
              {s.description && <p className="text-sm text-escom-neutral-600 line-clamp-2 mb-3">{s.description}</p>}

              {/* Employé responsable */}
              {s.id_employe_responsable ? (
                <div className="text-xs text-escom-blue-700 bg-escom-blue-50 px-2 py-1 rounded mb-2 inline-flex items-center gap-1 self-start">
                  <User size={10} /> {getEmployeName(s.id_employe_responsable)}
                </div>
              ) : (
                <div className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded mb-2 inline-flex items-center gap-1 self-start">
                  ⚠️ Aucun employé assigné
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t mt-auto">
                <span className="text-xs text-escom-neutral-500">À partir de</span>
                <span className="text-lg font-bold text-escom-blue-700">{formatXAF(s[activeTab.priceKey])}</span>
              </div>
              {s.duree_livraison_jours && (
                <p className="text-xs text-escom-neutral-500 mt-2">⏱ {s.duree_livraison_jours} jours</p>
              )}
              <div className="mt-3 flex justify-between items-center">
                <span className={`text-xs px-2 py-0.5 rounded ${s.est_actif !== false && s.actif !== 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {s.est_actif !== false && s.actif !== 0 ? '✓ Actif' : '✗ Inactif'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEditForm(s)} className="text-escom-blue-600 hover:bg-escom-blue-50 p-1.5 rounded" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(s[activeTab.idKey])} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Supprimer">
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}