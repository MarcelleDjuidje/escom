'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Loader2, ArrowLeft, User, Package, Truck, Calendar, DollarSign,
  CheckCircle2, Clock, AlertCircle, ListTodo, Paperclip, MessageSquare,
  History, Edit, X, Save, UserCheck, Ban, FileText, ChevronRight, Lock, Unlock,
  Upload, Download
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { UploadLivrableModal } from '@/components/dashboard/upload-livrable-modal'
import { cn, formatXAF, relativeTime, STATUT_LABELS } from '@/lib/utils'
import { toast } from 'sonner'

type ViewerRole = 'admin' | 'employe'

interface CommandeDetailProps {
  commandeId: number
  viewerRole: ViewerRole
}

const STATUT_COLORS: Record<string, string> = {
  confirmee: 'bg-blue-100 text-blue-700 border-blue-300',
  en_production: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  prete: 'bg-amber-100 text-amber-700 border-amber-300',
  livree: 'bg-green-100 text-green-700 border-green-300',
  annulee: 'bg-red-100 text-red-700 border-red-300',
}

const STATUT_FR: Record<string, string> = {
  confirmee: 'Confirmée',
  en_production: 'En production',
  prete: 'Prête',
  livree: 'Livrée',
  annulee: 'Annulée',
}

const STATUT_FLOW = ['confirmee', 'en_production', 'prete', 'livree']

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function CommandeDetail({ commandeId, viewerRole }: CommandeDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [commande, setCommande] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'taches' | 'livrables' | 'chat' | 'historique'>('taches')
  const [showStatutModal, setShowStatutModal] = useState(false)
  const [showEmployeModal, setShowEmployeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [employes, setEmployes] = useState<any[]>([])
  const [updating, setUpdating] = useState(false)

  const isAdmin = viewerRole === 'admin'

  useEffect(() => { fetchCommande() }, [commandeId])

  const fetchCommande = () => {
    setLoading(true)
    api.get(`/commandes/${commandeId}`)
      .then((r: any) => setCommande(r.data))
      .catch(() => toast.error('Commande introuvable'))
      .finally(() => setLoading(false))
  }

  const fetchEmployes = () => {
    api.get('/admin/employes').then((r: any) => {
      const list = r.data?.data || r.data || []
      setEmployes(Array.isArray(list) ? list.filter((e: any) => e.actif) : [])
    }).catch(() => setEmployes([]))
  }

  const changerStatut = async (nouveauStatut: string) => {
    setUpdating(true)
    try {
      await api.patch(`/commandes/${commandeId}/statut`, { statut: nouveauStatut })
      toast.success(`Statut changé en "${STATUT_FR[nouveauStatut]}"`)
      setShowStatutModal(false)
      fetchCommande()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally {
      setUpdating(false)
    }
  }

  const annulerCommande = async () => {
    setUpdating(true)
    try {
      await api.patch(`/commandes/${commandeId}/statut`, { statut: 'annulee' })
      toast.success('Commande annulée')
      setShowCancelModal(false)
      fetchCommande()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" />
      </div>
    )
  }

  if (!commande) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto text-red-300 mb-3" />
        <p className="text-escom-neutral-600">Commande introuvable</p>
      </div>
    )
  }

  const client = commande.client || {}
  const employe = commande.employe_responsable || {}
  const plan = commande.plan_paiement || {}
  const tranches = plan?.tranches || []
  const projets = commande.projets || []
  const livrables = projets.flatMap((p: any) => p.livrables || [])
  const taches = projets.flatMap((p: any) => p.taches || [])
  const factures = commande.factures || []

  const totalPaye = Number(commande.montant_paye || 0)
  const totalCmd = Number(commande.total_ttc || 0)
  const reste = Math.max(0, totalCmd - totalPaye)
  const progressPaiement = totalCmd > 0 ? (totalPaye / totalCmd) * 100 : 0

  const peutModifierStatut = isAdmin && commande.statut !== 'annulee' && commande.statut !== 'livree'

  const idxStatut = STATUT_FLOW.indexOf(commande.statut)
  const statutSuivant = idxStatut >= 0 && idxStatut < STATUT_FLOW.length - 1 ? STATUT_FLOW[idxStatut + 1] : null

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{commande.numero_commande}</h1>
              <span className={cn('px-3 py-1 rounded-full text-xs font-bold border', STATUT_COLORS[commande.statut])}>
                {STATUT_FR[commande.statut]}
              </span>
            </div>
            <p className="text-sm text-escom-neutral-500 mt-1">
              Commandée {relativeTime(commande.date_commande)}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {statutSuivant && peutModifierStatut && (
              <button onClick={() => changerStatut(statutSuivant)} disabled={updating}
                className="btn-primary !py-2 !px-4 !text-xs">
                {updating ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                Passer à "{STATUT_FR[statutSuivant]}"
              </button>
            )}
            {peutModifierStatut && (
              <button onClick={() => setShowStatutModal(true)} className="btn-outline !py-2 !px-3 !text-xs">
                <Edit size={14} /> Statut
              </button>
            )}
            <button onClick={() => { fetchEmployes(); setShowEmployeModal(true) }}
              className="btn-outline !py-2 !px-3 !text-xs">
              <UserCheck size={14} /> Responsable
            </button>
            {peutModifierStatut && (
              <button onClick={() => setShowCancelModal(true)}
                className="!py-2 !px-3 !text-xs inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-50">
                <Ban size={14} /> Annuler
              </button>
            )}
          </div>
        )}
      </div>

      {/* CARTES INFOS */}
      <div className={cn('grid gap-4', isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3')}>
        {/* Client */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-escom p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-escom-blue-700 mb-2">
            <User size={14} /> CLIENT
          </div>
          <p className="font-bold">{client.raison_sociale || client.nom_complet}</p>
          {client.raison_sociale && <p className="text-xs text-escom-neutral-500">{client.nom_complet}</p>}
          <p className="text-xs text-escom-neutral-600 mt-1">{client.email}</p>
          {client.telephone && <p className="text-xs text-escom-neutral-600">{client.telephone}</p>}
          <p className="text-[10px] mt-2">
            <span className={cn('px-2 py-0.5 rounded',
              client.type_client === 'entreprise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
              {client.type_client === 'entreprise' ? '🏢 Entreprise' : '👤 Particulier'}
            </span>
          </p>
        </motion.div>

        {/* Paiements (admin only) */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-escom p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 mb-2">
              <DollarSign size={14} /> PAIEMENTS
            </div>
            <p className="text-lg font-bold">{formatXAF(totalPaye)} <span className="text-xs font-normal text-escom-neutral-500">/ {formatXAF(totalCmd)}</span></p>
            <div className="w-full bg-escom-neutral-100 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, progressPaiement)}%` }} />
            </div>
            <p className="text-[11px] text-escom-neutral-600 mt-1">
              {progressPaiement.toFixed(0)}% payé — Reste : <span className="font-semibold">{formatXAF(reste)}</span>
            </p>
          </motion.div>
        )}

        {/* Responsable */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-escom p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-2">
            <UserCheck size={14} /> RESPONSABLE
          </div>
          <p className="font-bold">{employe.prenom} {employe.nom}</p>
          <p className="text-xs text-escom-neutral-500 capitalize">{employe.role?.replace('_', ' ')}</p>
          <p className="text-xs text-escom-neutral-600 mt-1">{employe.email_pro}</p>
        </motion.div>

        {/* Livraison */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={cn('card-escom p-4',
            !isAdmin && commande.livraison_bloquee && 'bg-red-50 border-red-200',
            !isAdmin && !commande.livraison_bloquee && 'bg-green-50 border-green-200')}>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-2">
            <Truck size={14} /> LIVRAISON
          </div>
          <p className="font-bold text-sm">
            {commande.mode_livraison === 'remise_en_main' && 'Retrait en agence'}
            {commande.mode_livraison === 'livraison_physique' && 'Livraison domicile'}
            {commande.mode_livraison === 'envoi_email' && 'Envoi par email'}
          </p>
          {commande.date_livraison_souhaitee && (
            <p className="text-xs text-escom-neutral-600 mt-1 flex items-center gap-1">
              <Calendar size={12} /> {new Date(commande.date_livraison_souhaitee).toLocaleDateString('fr-FR')}
            </p>
          )}
          <div className={cn('mt-3 p-2 rounded-lg flex items-center gap-2',
            commande.livraison_bloquee ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300')}>
            {commande.livraison_bloquee
              ? <Lock size={14} className="text-red-700 shrink-0" />
              : <Unlock size={14} className="text-green-700 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-bold leading-tight',
                commande.livraison_bloquee ? 'text-red-800' : 'text-green-800')}>
                {commande.livraison_bloquee ? 'LIVRAISON BLOQUÉE' : 'LIVRAISON AUTORISÉE'}
              </p>
              <p className={cn('text-[10px] leading-tight mt-0.5',
                commande.livraison_bloquee ? 'text-red-700' : 'text-green-700')}>
                {commande.livraison_bloquee ? 'Le paiement client n\'est pas complet' : 'Vous pouvez livrer le travail'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* NOTES */}
      {commande.notes && (
        <div className="card-escom p-4 bg-escom-gold-50 border-escom-gold-200">
          <p className="text-xs font-semibold text-escom-gold-700 mb-1">📝 NOTES DU CLIENT</p>
          <p className="text-sm whitespace-pre-wrap">{commande.notes}</p>
        </div>
      )}

      {/* ONGLETS */}
      <div className="card-escom overflow-hidden">
        <div className="flex border-b border-escom-neutral-200 overflow-x-auto">
          {[
            { id: 'taches' as const, label: 'Tâches', icon: ListTodo, count: taches.length, visible: true },
            { id: 'livrables' as const, label: 'Livrables', icon: Paperclip, count: livrables.length, visible: true },
            { id: 'chat' as const, label: 'Messages', icon: MessageSquare, count: commande.conversations?.length || 0, visible: true },
            { id: 'historique' as const, label: 'Paiements', icon: DollarSign, count: tranches.length, visible: isAdmin },
          ].filter(t => t.visible).map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('flex items-center gap-2 px-5 py-3 text-sm font-semibold transition border-b-2 whitespace-nowrap',
                  active ? 'border-escom-blue-600 text-escom-blue-700 bg-escom-blue-50'
                    : 'border-transparent text-escom-neutral-600 hover:bg-escom-neutral-50')}>
                <Icon size={14} />
                {t.label}
                {t.count > 0 && (
                  <span className={cn('rounded-full px-1.5 text-[10px] font-bold',
                    active ? 'bg-escom-blue-600 text-white' : 'bg-escom-neutral-200 text-escom-neutral-700')}>
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {tab === 'taches' && <TabTaches taches={taches} projets={projets} onRefresh={fetchCommande} viewerRole={viewerRole} />}
          {tab === 'livrables' && <TabLivrables livrables={livrables} commande={commande} viewerRole={viewerRole} user={user} onRefresh={fetchCommande} />}
          {tab === 'chat' && <TabChat commande={commande} />}
          {tab === 'historique' && isAdmin && <TabHistorique tranches={tranches} factures={factures} />}
        </div>
      </div>

      {/* MODALES */}
      {isAdmin && showStatutModal && (
        <ModalChangerStatut current={commande.statut} onClose={() => setShowStatutModal(false)} onConfirm={changerStatut} loading={updating} />
      )}
      {isAdmin && showEmployeModal && (
        <ModalChangerEmploye current={employe.id_employe} employes={employes}
          onClose={() => setShowEmployeModal(false)}
          onConfirm={async () => {
            toast.info('Fonctionnalité à finaliser côté backend')
            setShowEmployeModal(false)
          }}
          loading={updating} />
      )}
      {isAdmin && showCancelModal && (
        <ModalConfirmation
          title="Annuler cette commande ?"
          message="Cette action est irréversible. La commande sera marquée comme annulée et le client sera notifié."
          confirmLabel="Oui, annuler"
          danger
          onClose={() => setShowCancelModal(false)}
          onConfirm={annulerCommande}
          loading={updating} />
      )}
    </div>
  )
}

// ============================================================
// ONGLET : TÂCHES
// ============================================================
function TabTaches({ taches, projets, onRefresh, viewerRole }: any) {
  const [updating, setUpdating] = useState<number | null>(null)

  const toggleTache = async (tache: any) => {
    setUpdating(tache.id_tache)
    try {
      const nouveauStatut = tache.statut === 'terminee' ? 'en_cours' : 'terminee'
      await api.patch(`/taches/${tache.id_tache}`, { statut: nouveauStatut })
      toast.success(nouveauStatut === 'terminee' ? 'Tâche terminée ✓' : 'Tâche réouverte')
      onRefresh()
    } catch {
      toast.error('Erreur')
    } finally {
      setUpdating(null)
    }
  }

  if (projets.length === 0) {
    return <p className="text-sm text-escom-neutral-500 text-center py-8">Aucun projet associé.</p>
  }
  if (taches.length === 0) {
    return (
      <div className="text-center py-8">
        <ListTodo className="w-12 h-12 mx-auto text-escom-neutral-300 mb-3" />
        <p className="text-sm text-escom-neutral-500">Aucune tâche créée</p>
        <p className="text-xs text-escom-neutral-400 mt-1">Les tâches seront ajoutées par le chef de projet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {taches.map((t: any) => (
        <div key={t.id_tache}
          className={cn('flex items-start gap-3 p-3 rounded-lg border transition',
            t.statut === 'terminee' ? 'bg-green-50 border-green-200' : 'bg-white border-escom-neutral-200 hover:border-escom-blue-300')}>
          <button onClick={() => toggleTache(t)} disabled={updating === t.id_tache}
            className={cn('w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition',
              t.statut === 'terminee' ? 'bg-green-600 border-green-600' : 'border-escom-neutral-300 hover:border-escom-blue-600')}>
            {updating === t.id_tache ? <Loader2 size={10} className="animate-spin text-white" />
              : t.statut === 'terminee' ? <CheckCircle2 size={12} className="text-white" /> : null}
          </button>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', t.statut === 'terminee' && 'line-through text-escom-neutral-500')}>{t.titre}</p>
            {t.description && <p className="text-xs text-escom-neutral-500 mt-0.5">{t.description}</p>}
            <div className="flex items-center gap-3 mt-1 text-[10px] text-escom-neutral-500">
              {t.date_echeance && <span>⏰ {new Date(t.date_echeance).toLocaleDateString('fr-FR')}</span>}
              {t.assigne_a && <span>👤 Assigné</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// ONGLET : LIVRABLES
// ============================================================
function TabLivrables({ livrables, commande, viewerRole, user, onRefresh }: any) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const projet = commande.projets?.[0]
  // Détection robuste basée sur le user RÉEL (pas juste la prop viewerRole)
  const isClient = user && !user.is_staff
  const isAdmin = user && user.is_staff && (user.role === 'admin' || user.role === 'directeur')
  const isEmploye = user && user.is_staff && !isAdmin
  const peutUploader = isAdmin || isEmploye
  const livraisonBloquee = commande.livraison_bloquee

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
  const getFullUrl = (url: string) => url?.startsWith('http') ? url : `${apiBase}${url}`

  const handleDownloadHD = async (livrable: any) => {
    setDownloadingId(livrable.id_livrable)
    try {
      const res = await api.get(`/livrables/${livrable.id_livrable}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = livrable.nom_fichier || `livrable_${livrable.id_livrable}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Téléchargement démarré')
    } catch (e: any) {
      if (e.response?.status === 402) {
        toast.error('Veuillez régler le solde de votre commande pour télécharger le HD')
      } else {
        toast.error('Erreur lors du téléchargement')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {peutUploader && projet && (
        <div className="flex justify-between items-center pb-3 border-b">
          <p className="text-xs text-escom-neutral-500">
            {livrables.length} livrable{livrables.length > 1 ? 's' : ''} téléversé{livrables.length > 1 ? 's' : ''}
          </p>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary !py-2 !px-3 !text-xs">
            <Upload size={14} /> Téléverser
          </button>
        </div>
      )}

      {isClient && livrables.length > 0 && livraisonBloquee && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <Lock size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-amber-800">Téléchargement HD verrouillé</p>
            <p className="text-amber-700 mt-0.5">Pour télécharger les fichiers en haute qualité, veuillez régler le solde de votre commande.</p>
          </div>
        </div>
      )}

      {livrables.length === 0 ? (
        <div className="text-center py-8">
          <Paperclip className="w-12 h-12 mx-auto text-escom-neutral-300 mb-3" />
          <p className="text-sm text-escom-neutral-500">Aucun livrable pour le moment</p>
          <p className="text-xs text-escom-neutral-400 mt-1">
            {peutUploader ? 'Téléversez le premier livrable pour ce projet' : 'Les livrables apparaîtront dès que l\'équipe les téléverse'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {livrables.map((l: any) => {
            const isImage = l.type_fichier?.startsWith('image/')
            const previewUrl = l.fichier_apercu_url ? getFullUrl(l.fichier_apercu_url) : null
            const taille = l.taille_fichier ? formatBytes(l.taille_fichier) : ''
            const isDownloadingThis = downloadingId === l.id_livrable

            return (
              <div key={l.id_livrable} className="border border-escom-neutral-200 rounded-xl overflow-hidden hover:border-escom-blue-300 hover:shadow-md transition">
                <div className="relative bg-escom-neutral-100 aspect-video flex items-center justify-center overflow-hidden">
                  {isImage && previewUrl ? (
                    <img src={previewUrl} alt={l.libelle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto text-escom-blue-400 mb-1" />
                      <p className="text-[10px] text-escom-neutral-500 uppercase">
                        {l.type_fichier?.split('/')[1] || 'fichier'}
                      </p>
                    </div>
                  )}
                  {l.est_version_finale && (
                    <span className="absolute top-2 left-2 bg-escom-gold-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">⭐ FINALE</span>
                  )}
                  {l.version && (
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">v{l.version}</span>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{l.libelle || l.nom_fichier}</p>
                  {l.description && <p className="text-xs text-escom-neutral-500 mt-0.5 line-clamp-2">{l.description}</p>}
                  <div className="flex items-center justify-between mt-2 text-[10px] text-escom-neutral-500">
                    <span>{taille}</span>
                    {l.date_depot && <span>{new Date(l.date_depot).toLocaleDateString('fr-FR')}</span>}
                  </div>

                  <div className="mt-3">
                    {isClient && livraisonBloquee ? (
                      <button disabled className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-escom-neutral-100 text-escom-neutral-400 text-xs font-semibold cursor-not-allowed">
                        <Lock size={12} /> Verrouillé (paiement requis)
                      </button>
                    ) : (
                      <button onClick={() => handleDownloadHD(l)} disabled={isDownloadingThis}
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-escom-blue-600 hover:bg-escom-blue-700 text-white text-xs font-semibold transition">
                        {isDownloadingThis
                          ? <><Loader2 size={12} className="animate-spin" /> Téléchargement...</>
                          : <><Download size={12} /> Télécharger HD</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {projet && (
        <UploadLivrableModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          idProjet={projet.id_projet}
          onUploaded={onRefresh} />
      )}
    </div>
  )
}

// ============================================================
// ONGLET : CHAT
// ============================================================
function TabChat({ commande }: any) {
  return (
    <div className="text-center py-8">
      <MessageSquare className="w-12 h-12 mx-auto text-escom-neutral-300 mb-3" />
      <p className="text-sm text-escom-neutral-600 mb-3">
        {commande.conversations?.length > 0
          ? `${commande.conversations.length} conversation(s) liée(s)`
          : 'Aucune conversation pour le moment'}
      </p>
      <a href="/dashboard/admin/chat" className="btn-primary !py-2 !px-4 !text-xs inline-flex">
        <MessageSquare size={14} /> Ouvrir la messagerie
      </a>
    </div>
  )
}

// ============================================================
// ONGLET : HISTORIQUE PAIEMENTS (admin only)
// ============================================================
function TabHistorique({ tranches, factures }: any) {
  if (tranches.length === 0) {
    return <p className="text-sm text-escom-neutral-500 text-center py-8">Aucun plan de paiement</p>
  }

  return (
    <div className="space-y-3">
      {tranches.map((t: any, idx: number) => (
        <div key={t.id_tranche}
          className={cn('flex items-center gap-3 p-3 rounded-lg border',
            t.statut === 'payee' ? 'bg-green-50 border-green-200' : 'bg-white border-escom-neutral-200')}>
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            t.statut === 'payee' ? 'bg-green-100' : 'bg-escom-neutral-100')}>
            {t.statut === 'payee'
              ? <CheckCircle2 className="w-5 h-5 text-green-600" />
              : <Clock className="w-5 h-5 text-escom-neutral-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Tranche #{t.numero_tranche} — {t.libelle}</p>
            <p className="text-xs text-escom-neutral-500">
              {t.statut === 'payee' && t.date_paiement_effectif
                ? `Payée le ${new Date(t.date_paiement_effectif).toLocaleDateString('fr-FR')}`
                : `Échéance : ${new Date(t.date_echeance_prevue).toLocaleDateString('fr-FR')}`}
              {t.mode_paiement && ` • ${t.mode_paiement.replace('_', ' ')}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">{formatXAF(t.montant_du_ttc)}</p>
            <span className={cn('text-[10px] px-2 py-0.5 rounded',
              t.statut === 'payee' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
              {t.statut === 'payee' ? 'Payée' : 'En attente'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// MODALES
// ============================================================
function ModalChangerStatut({ current, onClose, onConfirm, loading }: any) {
  const [choix, setChoix] = useState(current)
  return (
    <div className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between bg-escom-gradient text-white rounded-t-2xl">
          <h3 className="font-bold">Changer le statut</h3>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {STATUT_FLOW.map(s => (
            <button key={s} onClick={() => setChoix(s)}
              className={cn('w-full text-left p-3 rounded-lg border-2 transition',
                choix === s ? 'border-escom-blue-600 bg-escom-blue-50' : 'border-escom-neutral-200 hover:border-escom-neutral-300')}>
              <p className="font-semibold">{STATUT_FR[s]}</p>
            </button>
          ))}
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onConfirm(choix)} disabled={loading || choix === current} className="btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalChangerEmploye({ current, employes, onClose, onConfirm, loading }: any) {
  const [choix, setChoix] = useState(current)
  return (
    <div className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between bg-escom-gradient text-white rounded-t-2xl">
          <h3 className="font-bold">Changer le responsable</h3>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full"><X size={18} /></button>
        </div>
        <div className="p-5">
          <select value={choix || ''} onChange={e => setChoix(Number(e.target.value))} className="input-escom">
            <option value="">-- Choisir un employé --</option>
            {employes.map((e: any) => (
              <option key={e.id_employe} value={e.id_employe}>{e.prenom} {e.nom} ({e.role})</option>
            ))}
          </select>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={() => onConfirm(choix)} disabled={loading || !choix} className="btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalConfirmation({ title, message, confirmLabel, danger, onClose, onConfirm, loading }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="font-bold text-center mb-2">{title}</h3>
          <p className="text-sm text-escom-neutral-600 text-center">{message}</p>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Annuler</button>
          <button onClick={onConfirm} disabled={loading}
            className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white',
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-escom-blue-600 hover:bg-escom-blue-700')}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}