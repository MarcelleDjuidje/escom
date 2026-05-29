'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, Pencil, Trash, Search, UserCheck, UserX } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const ROLES = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'designer', label: 'Designer' },
  { value: 'chef_projet', label: 'Chef de projet' },
  { value: 'imprimeur', label: 'Imprimeur' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'directeur', label: 'Directeur' },
]

export default function AdminEmployes() {
  const [employes, setEmployes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<any>({
    nom: '', prenom: '', email_pro: '', telephone: '',
    role: 'commercial', password: '', actif: true,
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoading(true)
    api.get('/admin/employes/')
      .then((r: any) => setEmployes(r.data?.data || r.data || []))
      .finally(() => setLoading(false))
  }

  const openNewForm = () => {
    setEditing(null)
    setForm({
      nom: '', prenom: '', email_pro: '', telephone: '',
      role: 'commercial', password: '', actif: true,
    })
    setShowForm(true)
  }

  const openEditForm = (emp: any) => {
    setEditing(emp)
    setForm({
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email_pro: emp.email_pro || '',
      telephone: emp.telephone || '',
      role: emp.role || 'commercial',
      password: '',
      actif: emp.actif !== false && emp.actif !== 0,
    })
    setShowForm(true)
  }

  const submit = async () => {
    try {
      const payload: any = { ...form }
      // En édition : on n'envoie le mot de passe que s'il est rempli
      if (editing && !payload.password) {
        delete payload.password
      }

      if (editing) {
        await api.patch(`/admin/employes//${editing.id_employe}`, payload)
        toast.success('Employé modifié avec succès')
      } else {
        await api.post('/admin/employes/', payload)
        toast.success('Employé créé avec succès')
      }
      setShowForm(false)
      setEditing(null)
      fetchData()
    } catch (e: any) {
      console.error('Erreur:', e.response?.data)
      const errors = e.response?.data?.errors
      if (errors) {
        const messages = Object.entries(errors).map(([f, m]: any) => `${f}: ${m[0]}`).join('\n')
        toast.error(messages)
      } else {
        toast.error(e.response?.data?.message || 'Erreur lors de l\'opération')
      }
    }
  }

  const handleDelete = async (emp: any) => {
    if (!confirm(`Désactiver "${emp.prenom} ${emp.nom}" ? Il ne pourra plus se connecter mais son historique sera conservé.`)) return
    try {
      await api.delete(`/admin/employes//${emp.id_employe}`)
      toast.success('Employé désactivé')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la désactivation')
    }
  }

  const filteredEmployes = employes.filter((e: any) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return String(e.nom || '').toLowerCase().includes(q) ||
           String(e.prenom || '').toLowerCase().includes(q) ||
           String(e.email_pro || '').toLowerCase().includes(q) ||
           String(e.role || '').toLowerCase().includes(q)
  })

  const getRoleLabel = (role: string) => ROLES.find(r => r.value === role)?.label || role

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Employés</h1>
        <p className="text-escom-neutral-500 text-sm">Gérez les comptes de votre équipe</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
          <input type="search" placeholder="Rechercher un employé..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-escom pl-10" />
        </div>
        <button onClick={openNewForm} className="btn-primary">
          <Plus size={16} /> Nouvel employé
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card-escom p-5 mb-6 grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-3 pb-3 border-b">
              {editing ? '✏️ Modifier l\'employé' : '➕ Nouvel employé'}
            </h3>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Prénom *</label>
            <input value={form.prenom}
              onChange={e => setForm({...form, prenom: e.target.value})}
              className="input-escom" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Nom *</label>
            <input value={form.nom}
              onChange={e => setForm({...form, nom: e.target.value})}
              className="input-escom" />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold block mb-1">Email professionnel *</label>
            <input type="email" value={form.email_pro}
              onChange={e => setForm({...form, email_pro: e.target.value})}
              className="input-escom" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Téléphone</label>
            <input value={form.telephone}
              onChange={e => setForm({...form, telephone: e.target.value})}
              placeholder="+237 6XX XX XX XX"
              className="input-escom" />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Rôle *</label>
            <select value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="input-escom">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold block mb-1">
              Mot de passe {editing ? '(laisser vide pour ne pas changer)' : '*'}
            </label>
            <input type="password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder={editing ? 'Inchangé' : 'Minimum 8 caractères'}
              className="input-escom" />
          </div>

          {editing && (
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={form.actif !== false}
                onChange={e => setForm({...form, actif: e.target.checked})} />
              Compte actif
            </label>
          )}

          <div className="md:col-span-2 flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-outline">
              Annuler
            </button>
            <button onClick={submit} className="btn-primary">
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-escom-blue-600" /></div>
      ) : filteredEmployes.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          {search ? `Aucun résultat pour "${search}"` : 'Aucun employé enregistré'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployes.map((emp: any) => {
            const isActive = emp.actif !== false && emp.actif !== 0
            return (
              <motion.div key={emp.id_employe}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card-escom p-5 flex flex-col">

                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-escom-blue-100 text-escom-blue-700 flex items-center justify-center font-bold">
                    {((emp.prenom || '?').charAt(0) + (emp.nom || '').charAt(0)).toUpperCase()}
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                      <UserCheck size={12} /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                      <UserX size={12} /> Inactif
                    </span>
                  )}
                </div>

                <h3 className="font-bold">{emp.prenom} {emp.nom}</h3>
                <p className="text-sm text-escom-neutral-600 truncate">{emp.email_pro}</p>
                {emp.telephone && <p className="text-xs text-escom-neutral-500 mt-1">📞 {emp.telephone}</p>}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    emp.role === 'admin' || emp.role === 'directeur'
                      ? 'bg-escom-gold-100 text-escom-gold-700'
                      : 'bg-escom-blue-100 text-escom-blue-700'
                  }`}>
                    {(emp.role === 'admin' || emp.role === 'directeur') ? '👑 ' : ''}{getRoleLabel(emp.role)}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openEditForm(emp)}
                      className="text-escom-blue-600 hover:bg-escom-blue-50 p-1.5 rounded" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(emp)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Désactiver">
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