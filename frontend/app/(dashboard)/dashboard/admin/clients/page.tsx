'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, Pencil, Trash, Search, Building2, User, Mail, Phone, MapPin } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const STATUTS = [
  { value: 'prospect', label: 'Prospect', color: 'bg-blue-100 text-blue-700' },
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-700' },
  { value: 'archive', label: 'Archivé', color: 'bg-gray-100 text-gray-600' },
]

const VILLES = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Limbé', 'Kribi', 'Edéa', 'Autre']

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [form, setForm] = useState<any>({
    type_client: 'particulier',
    nom_complet: '',
    raison_sociale: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: 'Douala',
    secteur_activite: '',
    statut: 'prospect',
    password: '',
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    setLoading(true)
    api.get('/admin/clients')
      .then((r: any) => setClients(r.data?.data || r.data || []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }

  const openNewForm = () => {
    setEditing(null)
    setForm({
      type_client: 'particulier',
      nom_complet: '', raison_sociale: '', email: '', telephone: '',
      adresse: '', ville: 'Douala', secteur_activite: '',
      statut: 'prospect', password: '',
    })
    setShowForm(true)
  }

  const openEditForm = (cli: any) => {
    setEditing(cli)
    setForm({
      type_client: cli.type_client || 'particulier',
      nom_complet: cli.nom_complet || '',
      raison_sociale: cli.raison_sociale || '',
      email: cli.email || '',
      telephone: cli.telephone || '',
      adresse: cli.adresse || '',
      ville: cli.ville || 'Douala',
      secteur_activite: cli.secteur_activite || '',
      statut: cli.statut || 'prospect',
      password: '',
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
      // Si particulier : pas besoin de raison_sociale ni secteur
      if (payload.type_client === 'particulier') {
        payload.raison_sociale = null
        payload.secteur_activite = null
      }

      if (editing) {
        await api.patch(`/admin/clients/${editing.id_client}`, payload)
        toast.success('Client modifié avec succès')
      } else {
        await api.post('/admin/clients', payload)
        toast.success('Client créé avec succès')
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

  const handleArchive = async (cli: any) => {
    if (!confirm(`Archiver le client "${cli.nom_complet}" ? Son historique sera conservé mais il sera masqué des listes actives.`)) return
    try {
      await api.delete(`/admin/clients/${cli.id_client}`)
      toast.success('Client archivé')
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'archivage')
    }
  }

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      if (filterType && c.type_client !== filterType) return false
      if (filterStatut && c.statut !== filterStatut) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return String(c.nom_complet || '').toLowerCase().includes(q) ||
             String(c.raison_sociale || '').toLowerCase().includes(q) ||
             String(c.email || '').toLowerCase().includes(q) ||
             String(c.telephone || '').toLowerCase().includes(q) ||
             String(c.ville || '').toLowerCase().includes(q)
    })
  }, [clients, search, filterType, filterStatut])

  const getStatutBadge = (statut: string) => STATUTS.find(s => s.value === statut) || STATUTS[0]

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-escom-neutral-500 text-sm">
          {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Toolbar : recherche + filtres + bouton */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
          <input type="search" placeholder="Rechercher (nom, email, ville...)"
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-escom pl-10" />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-escom !py-2 !text-sm">
            <option value="">Tous types</option>
            <option value="particulier">Particuliers</option>
            <option value="entreprise">Entreprises</option>
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="input-escom !py-2 !text-sm">
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={openNewForm} className="btn-primary">
            <Plus size={16} /> Nouveau client
          </button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card-escom p-5 mb-6">
          <h3 className="font-semibold text-lg mb-4 pb-3 border-b">
            {editing ? '✏️ Modifier le client' : '➕ Nouveau client'}
          </h3>

          {/* Choix du type */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button type="button" onClick={() => setForm({...form, type_client: 'particulier'})}
              className={`p-3 rounded-lg border-2 text-left transition ${
                form.type_client === 'particulier'
                  ? 'border-escom-blue-600 bg-escom-blue-50'
                  : 'border-escom-neutral-200 hover:border-escom-neutral-300'
              }`}>
              <div className="flex items-center gap-2">
                <User size={18} className="text-escom-blue-600" />
                <div>
                  <p className="font-semibold text-sm">Particulier</p>
                  <p className="text-xs text-escom-neutral-500">Personne physique</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setForm({...form, type_client: 'entreprise'})}
              className={`p-3 rounded-lg border-2 text-left transition ${
                form.type_client === 'entreprise'
                  ? 'border-escom-blue-600 bg-escom-blue-50'
                  : 'border-escom-neutral-200 hover:border-escom-neutral-300'
              }`}>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-escom-blue-600" />
                <div>
                  <p className="font-semibold text-sm">Entreprise</p>
                  <p className="text-xs text-escom-neutral-500">Personne morale</p>
                </div>
              </div>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">
                {form.type_client === 'entreprise' ? 'Personne de contact *' : 'Nom complet *'}
              </label>
              <input value={form.nom_complet}
                onChange={e => setForm({...form, nom_complet: e.target.value})}
                className="input-escom" />
            </div>

            {form.type_client === 'entreprise' && (
              <div>
                <label className="text-xs font-semibold block mb-1">Raison sociale *</label>
                <input value={form.raison_sociale}
                  onChange={e => setForm({...form, raison_sociale: e.target.value})}
                  placeholder="Ex: La Boulangerie Akwa SARL"
                  className="input-escom" />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold block mb-1">Email *</label>
              <input type="email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="input-escom" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Téléphone *</label>
              <input value={form.telephone}
                onChange={e => setForm({...form, telephone: e.target.value})}
                placeholder="+237 6XX XX XX XX"
                className="input-escom" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Ville</label>
              <select value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
                className="input-escom">
                {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Statut</label>
              <select value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}
                className="input-escom">
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {form.type_client === 'entreprise' && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold block mb-1">Secteur d'activité</label>
                <input value={form.secteur_activite}
                  onChange={e => setForm({...form, secteur_activite: e.target.value})}
                  placeholder="Ex: Restauration, Mode, Tech..."
                  className="input-escom" />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-xs font-semibold block mb-1">Adresse</label>
              <textarea value={form.adresse}
                onChange={e => setForm({...form, adresse: e.target.value})}
                rows={2}
                placeholder="Quartier, rue, immeuble..."
                className="input-escom" />
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
          </div>

          <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-outline">
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
      ) : filteredClients.length === 0 ? (
        <div className="card-escom p-12 text-center text-escom-neutral-500">
          {search || filterType || filterStatut
            ? 'Aucun résultat pour ces critères'
            : 'Aucun client enregistré'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((cli: any) => {
            const badge = getStatutBadge(cli.statut)
            const isEntreprise = cli.type_client === 'entreprise'
            const initiale = (cli.nom_complet || '?').charAt(0).toUpperCase()
            return (
              <motion.div key={cli.id_client}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card-escom p-5 flex flex-col">

                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    isEntreprise
                      ? 'bg-escom-gold-100 text-escom-gold-700'
                      : 'bg-escom-blue-100 text-escom-blue-700'
                  }`}>
                    {isEntreprise ? <Building2 size={20} /> : initiale}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <h3 className="font-bold truncate">
                  {isEntreprise && cli.raison_sociale ? cli.raison_sociale : cli.nom_complet}
                </h3>
                {isEntreprise && cli.raison_sociale && (
                  <p className="text-xs text-escom-neutral-500 truncate">Contact : {cli.nom_complet}</p>
                )}

                <div className="space-y-1 mt-2 text-xs text-escom-neutral-600">
                  {cli.email && (
                    <div className="flex items-center gap-1 truncate">
                      <Mail size={11} /> <span className="truncate">{cli.email}</span>
                    </div>
                  )}
                  {cli.telephone && (
                    <div className="flex items-center gap-1">
                      <Phone size={11} /> {cli.telephone}
                    </div>
                  )}
                  {cli.ville && (
                    <div className="flex items-center gap-1">
                      <MapPin size={11} /> {cli.ville}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    isEntreprise
                      ? 'bg-escom-gold-100 text-escom-gold-700'
                      : 'bg-escom-blue-100 text-escom-blue-700'
                  }`}>
                    {isEntreprise ? '🏢 Entreprise' : '👤 Particulier'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => openEditForm(cli)}
                      className="text-escom-blue-600 hover:bg-escom-blue-50 p-1.5 rounded" title="Modifier">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleArchive(cli)}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Archiver">
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