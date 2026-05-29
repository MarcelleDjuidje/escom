'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Loader2, ArrowLeft, Calendar, MapPin, CheckCircle2, Clock, CreditCard,
  FileText, Package, AlertCircle, Download, Star, Paperclip, Lock
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { PaymentModal } from '@/components/dashboard/payment-modal'
import { AvisModal } from '@/components/dashboard/avis-modal'
import { api } from '@/lib/api'
import { formatXAF, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function CommandeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const [commande, setCommande] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trancheToPay, setTrancheToPay] = useState<any>(null)
  const [showAvisModal, setShowAvisModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/commandes/${id}`)
      setCommande(res.data)
    } catch (e: any) {
      toast.error('Commande introuvable')
      router.push('/dashboard/client/commandes')
    } finally {
      setLoading(false)
    }
  }

  const downloadFacturePdf = async (factureId: number, num: string) => {
    try {
      const res = await api.get(`/factures/${factureId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Facture-${num}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement')
    }
  }

  const downloadLivrableHD = async (livrable: any) => {
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

  if (loading) {
    return (
      <DashboardLayout role="client">
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" /></div>
      </DashboardLayout>
    )
  }

  if (!commande) return null

  // Extraction des tranches depuis plan_paiement
  const plan = commande.plan_paiement || commande.plans?.[0] || null
  const tranches = plan?.tranches || []
  const totalPaye = tranches.reduce((sum: number, t: any) => sum + Number(t.montant_paye || 0), 0)
  const totalTTC = Number(commande.total_ttc || 0)
  const progression = totalTTC > 0 ? Math.min(100, (totalPaye / totalTTC) * 100) : 0
  const tranchesEnAttente = tranches.filter((t: any) => t.statut !== 'payee')
  const prochaineTranche = tranchesEnAttente[0] || null
  const peutLaisserAvis = commande.statut === 'livree'

  // ===== LIVRABLES =====
  const projets = commande.projets || []
  const livrables = projets.flatMap((p: any) => p.livrables || [])
  const livraisonBloquee = commande.livraison_bloquee == 1 || commande.livraison_bloquee === true

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
  const getFullUrl = (url: string) => url?.startsWith('http') ? url : `${apiBase}${url}`

  return (
    <DashboardLayout role="client">
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Commande {commande.numero_commande}</h1>
          <p className="text-sm text-escom-neutral-500">Émise le {formatDate(commande.date_commande)}</p>
        </div>
        <StatusBadge statut={commande.statut} />
        {peutLaisserAvis && (
          <button onClick={() => setShowAvisModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-escom-gold-500 hover:bg-escom-gold-600 text-white font-semibold text-sm shadow transition">
            <Star size={16} /> Laisser un avis
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* COLONNE PRINCIPALE */}
        <div className="lg:col-span-2 space-y-6">

          {/* Barre de progression */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-escom p-5">
            <div className="flex justify-between items-baseline mb-3">
              <div>
                <h2 className="font-semibold text-lg">Progression du paiement</h2>
                <p className="text-xs text-escom-neutral-500">
                  {formatXAF(totalPaye)} sur {formatXAF(totalTTC)}
                </p>
              </div>
              <p className="text-3xl font-bold text-escom-blue-700">{progression.toFixed(0)}%</p>
            </div>
            <div className="h-3 bg-escom-neutral-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progression}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-escom-blue-500 to-escom-gold-500 rounded-full"
              />
            </div>
            {progression < 100 && prochaineTranche && (
              <div className="mt-4 flex flex-wrap gap-3 items-center justify-between p-3 bg-escom-gold-50 border border-escom-gold-200 rounded-lg">
                <div>
                  <p className="text-sm font-semibold">⏳ Prochain paiement</p>
                  <p className="text-xs text-escom-neutral-600">
                    {prochaineTranche.libelle} — {formatXAF(prochaineTranche.montant_du_ttc)}
                  </p>
                </div>
                <button onClick={() => setTrancheToPay(prochaineTranche)} className="btn-primary">
                  <CreditCard size={16} /> Payer maintenant
                </button>
              </div>
            )}
            {progression >= 100 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={18} />
                <span className="text-green-700 font-semibold">Commande entièrement payée 🎉</span>
              </div>
            )}
          </motion.div>

          {/* ============== VOS LIVRABLES ============== */}
          {livrables.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card-escom p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Paperclip size={18} /> Vos livrables ({livrables.length})
                </h2>
              </div>

              {/* Banner si livraison bloquée */}
              {livraisonBloquee && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <Lock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-800">Téléchargement HD verrouillé</p>
                    <p className="text-amber-700 mt-0.5">
                      Vous pouvez voir les aperçus, mais le téléchargement en haute qualité sera débloqué dès que vous aurez réglé le solde de votre commande.
                    </p>
                  </div>
                </div>
              )}

              {/* Banner si tout est payé */}
              {!livraisonBloquee && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-green-800">Téléchargement HD débloqué</p>
                    <p className="text-green-700 mt-0.5">
                      Votre commande est entièrement payée. Vous pouvez télécharger les fichiers originaux en haute qualité.
                    </p>
                  </div>
                </div>
              )}

              {/* Grille des livrables */}
              <div className="grid sm:grid-cols-2 gap-3">
                {livrables.map((l: any) => {
                  const isImage = l.type_fichier?.startsWith('image/')
                  const previewUrl = l.fichier_apercu_url ? getFullUrl(l.fichier_apercu_url) : null
                  const taille = l.taille_fichier ? formatBytes(l.taille_fichier) : ''
                  const isDownloadingThis = downloadingId === l.id_livrable

                  return (
                    <div key={l.id_livrable}
                      className="border border-escom-neutral-200 rounded-xl overflow-hidden hover:border-escom-blue-300 hover:shadow-md transition">
                      {/* Aperçu */}
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
                          <span className="absolute top-2 left-2 bg-escom-gold-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            ⭐ FINALE
                          </span>
                        )}
                        {l.version && (
                          <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                            v{l.version}
                          </span>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">{l.libelle || l.nom_fichier}</p>
                        {l.description && (
                          <p className="text-xs text-escom-neutral-500 mt-0.5 line-clamp-2">{l.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-[10px] text-escom-neutral-500">
                          <span>{taille}</span>
                          {l.date_depot && (
                            <span>{new Date(l.date_depot).toLocaleDateString('fr-FR')}</span>
                          )}
                        </div>

                        {/* Action principale */}
                        <div className="mt-3">
                          {livraisonBloquee ? (
                            <button disabled
                              className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-escom-neutral-100 text-escom-neutral-400 text-xs font-semibold cursor-not-allowed">
                              <Lock size={12} /> Verrouillé (paiement requis)
                            </button>
                          ) : (
                            <button onClick={() => downloadLivrableHD(l)}
                              disabled={isDownloadingThis}
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
            </motion.div>
          )}

          {/* Liste des tranches */}
          {tranches.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card-escom p-5">
              <h2 className="font-semibold mb-4">Échéancier de paiement</h2>
              <div className="space-y-3">
                {tranches.map((t: any) => {
                  const isPaid = t.statut === 'payee'
                  const isLate = t.statut === 'en_retard'
                  return (
                    <div key={t.id_tranche}
                      className={`p-4 rounded-lg border-l-4 ${
                        isPaid ? 'bg-green-50 border-l-green-500' :
                        isLate ? 'bg-red-50 border-l-red-500' :
                        'bg-escom-neutral-50 border-l-escom-blue-500'
                      }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase text-escom-neutral-500">
                              Tranche {t.numero_tranche}
                            </span>
                            {isPaid && <CheckCircle2 size={14} className="text-green-600" />}
                            {isLate && <AlertCircle size={14} className="text-red-600" />}
                            {!isPaid && !isLate && <Clock size={14} className="text-escom-blue-500" />}
                          </div>
                          <p className="font-bold">{t.libelle}</p>
                          <p className="text-xs text-escom-neutral-500 mt-1">
                            Échéance : {formatDate(t.date_echeance_prevue)}
                          </p>
                          {isPaid && t.date_paiement_effectif && (
                            <p className="text-xs text-green-700 mt-1">
                              ✓ Payée le {formatDate(t.date_paiement_effectif)}
                              {t.mode_paiement && ` — ${t.mode_paiement === 'mobile_money' ? 'Mobile Money' : t.mode_paiement}`}
                            </p>
                          )}
                          {t.reference_transaction && (
                            <p className="text-[10px] text-escom-neutral-400 font-mono mt-1">
                              Réf: {t.reference_transaction}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-escom-blue-700">{formatXAF(t.montant_du_ttc)}</p>
                          {!isPaid && (
                            <button onClick={() => setTrancheToPay(t)}
                              className="btn-primary !py-1.5 !px-3 !text-xs mt-2">
                              <CreditCard size={12} /> Payer
                            </button>
                          )}
                        </div>
                      </div>

                      {t.facture && (
                        <button onClick={() => downloadFacturePdf(t.facture.id_facture_tranche, t.facture.numero_facture)}
                          className="mt-2 text-xs text-escom-blue-600 hover:underline inline-flex items-center gap-1">
                          <Download size={12} /> Télécharger la facture {t.facture.numero_facture}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Lignes de commande */}
          {commande.lignes_commande && commande.lignes_commande.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="card-escom p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Package size={18} /> Détail de la commande</h2>
              <div className="space-y-2">
                {commande.lignes_commande.map((l: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{l.designation || l.libelle_service}</p>
                      <p className="text-xs text-escom-neutral-500">
                        {l.quantite} × {formatXAF(l.prix_unitaire_ht)}
                      </p>
                    </div>
                    <span className="font-bold">{formatXAF(l.montant_ttc || l.quantite * l.prix_unitaire_ht)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* COLONNE LATÉRALE */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-escom p-5 sticky top-24">
            <h2 className="font-semibold mb-4 pb-3 border-b">Informations</h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-escom-neutral-500 uppercase font-semibold">Total TTC</dt>
                <dd className="text-2xl font-bold text-escom-blue-700">{formatXAF(totalTTC)}</dd>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Calendar size={14} className="text-escom-neutral-400" />
                <div>
                  <dt className="text-[10px] uppercase text-escom-neutral-500">Livraison souhaitée</dt>
                  <dd>{formatDate(commande.date_livraison_souhaitee)}</dd>
                </div>
              </div>

              {commande.mode_livraison && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-escom-neutral-400" />
                  <div>
                    <dt className="text-[10px] uppercase text-escom-neutral-500">Mode de livraison</dt>
                    <dd className="capitalize">
                      {commande.mode_livraison === 'remise_en_main' && 'Retrait en agence'}
                      {commande.mode_livraison === 'livraison_physique' && 'Livraison à domicile'}
                      {commande.mode_livraison === 'envoi_email' && 'Envoi par email'}
                    </dd>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t">
                <FileText size={14} className="text-escom-neutral-400" />
                <div>
                  <dt className="text-[10px] uppercase text-escom-neutral-500">Livraison débloquée</dt>
                  <dd className={!livraisonBloquee ? 'text-green-600 font-semibold' : 'text-orange-600 font-semibold'}>
                    {!livraisonBloquee ? '✓ Oui' : '⏳ Solde non payé'}
                  </dd>
                </div>
              </div>
            </dl>

            {commande.notes && (
              <div className="mt-5 pt-4 border-t">
                <p className="text-xs uppercase text-escom-neutral-500 font-semibold mb-2">Vos notes</p>
                <p className="text-sm text-escom-neutral-700 whitespace-pre-wrap">{commande.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={!!trancheToPay}
        onClose={() => setTrancheToPay(null)}
        onSuccess={() => { fetchData(); toast.success('Paiement enregistré !') }}
        tranche={trancheToPay}
        numeroCommande={commande.numero_commande}
      />

      <AvisModal
        isOpen={showAvisModal}
        onClose={() => setShowAvisModal(false)}
        onSuccess={() => toast.success('Avis envoyé — il sera publié après validation')}
        idCommande={commande.id_commande}
        numeroCommande={commande.numero_commande}
      />
    </DashboardLayout>
  )
}