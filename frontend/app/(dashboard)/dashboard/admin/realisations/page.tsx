'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Trash, Pencil } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, fileUrl } from '@/lib/api'
import { toast } from 'sonner'

const CATS = ['conception','impression','social','marketing','audio']

export default function AdminRealisations() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ titre: '', description: '', categorie: 'conception', secteur_activite: '', est_publique: true })
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => { fetchData() }, [])
  const fetchData = () => {
    setLoading(true)
    api.get('/admin/realisations').then((r: any) => setItems(r.data?.data || r.data || [])).finally(() => setLoading(false))
  }

  const submit = async () => {
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (imageFile) fd.append('image_principale', imageFile)
      if (editing) await api.post(`/admin/realisations/${editing.id_realisation}?_method=PATCH`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      else await api.post('/admin/realisations', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(editing ? 'Modifié' : 'Créé')
      setShowForm(false); setEditing(null); setImageFile(null); fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur') }
  }

  const remove = async (id: number) => {
    if (!confirm('Supprimer cette réalisation ?')) return
    await api.delete(`/admin/realisations/${id}`)
    toast.success('Supprimé'); fetchData()
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Réalisations / Portfolio</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ titre: '', description: '', categorie: 'conception', secteur_activite: '', est_publique: true }) }} className="btn-primary"><Plus size={16} /> Ajouter</button>
      </div>

      {showForm && (
        <div className="card-escom p-5 mb-6 grid md:grid-cols-2 gap-3">
          <input placeholder="Titre *" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} className="input-escom md:col-span-2" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-escom md:col-span-2" rows={3} />
          <select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className="input-escom">
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Secteur d'activité" value={form.secteur_activite} onChange={e => setForm({...form, secteur_activite: e.target.value})} className="input-escom" />
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="input-escom md:col-span-2" />
          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" checked={form.est_publique} onChange={e => setForm({...form, est_publique: e.target.checked})} />
            Publier sur le site public
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button onClick={submit} className="btn-primary">Enregistrer</button>
          </div>
        </div>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(r => (
            <div key={r.id_realisation} className="card-escom overflow-hidden">
              <div className="aspect-square bg-escom-neutral-100 relative">
                <img src={fileUrl(r.image_principale)} alt={r.titre} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = '/assets/images/placeholder.svg' }} />
                {r.statut_publication !== 'publie' && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded">Brouillon</span>}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{r.titre}</p>
                <p className="text-xs text-escom-neutral-500 capitalize">{r.categorie}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setEditing(r); setForm({ titre: r.titre, description: r.description || '', categorie: r.categorie, secteur_activite: r.secteur_activite || '', est_publique: r.statut_publication === 'publie' }); setShowForm(true) }} className="text-escom-blue-600 text-xs"><Pencil size={12} /> Éditer</button>
                  <button onClick={() => remove(r.id_realisation)} className="text-red-600 text-xs"><Trash size={12} /> Suppr.</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
