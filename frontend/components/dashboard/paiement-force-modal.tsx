'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Loader2, Smartphone, AlertCircle, CheckCircle2, ShieldCheck, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

interface Tranche {
  libelle: string
  montant_du_ttc: number
  date_echeance_prevue: string
}

interface PaiementForceModalProps {
  open: boolean
  onClose: () => void
  panierPayload: {
    lignes: any[]
    total_ttc: number
    paiement_en_tranches: boolean
    tranches_prevues?: Tranche[]
    mode_livraison: string
    date_livraison_souhaitee: string
    notes?: string | null
  }
}

// Préfixes MoMo Cameroun
const PREFIXES_MTN_2 = ['67', '68']
const PREFIXES_MTN_3 = ['650', '651', '652', '653', '654', '680', '681', '682', '683', '684']
const PREFIXES_ORANGE_2 = ['69']
const PREFIXES_ORANGE_3 = ['640', '641', '642', '643', '655', '656', '657', '658', '659', '685', '686', '687', '688', '689']

function detectOperateur(numero: string): 'MTN' | 'Orange' | null {
  const n = numero.replace(/[^0-9]/g, '').replace(/^237/, '')
  if (n.length < 2) return null
  const p2 = n.substring(0, 2)
  const p3 = n.substring(0, 3)
  if (PREFIXES_MTN_2.includes(p2) || PREFIXES_MTN_3.includes(p3)) return 'MTN'
  if (PREFIXES_ORANGE_2.includes(p2) || PREFIXES_ORANGE_3.includes(p3)) return 'Orange'
  return null
}

// ============================================================
// TRADUCTIONS DES ERREURS DE VALIDATION LARAVEL
// ============================================================
const TRADUCTIONS_ERREURS: Record<string, string> = {
  'validation.after': 'doit être une date future (pas aujourd\'hui)',
  'validation.after_or_equal': 'doit être à partir d\'aujourd\'hui',
  'validation.before': 'doit être une date passée',
  'validation.required': 'est obligatoire',
  'validation.date': 'doit être une date valide',
  'validation.numeric': 'doit être un nombre',
  'validation.integer': 'doit être un nombre entier',
  'validation.min.numeric': 'est trop petit',
  'validation.max.numeric': 'est trop grand',
  'validation.min.string': 'est trop court',
  'validation.max.string': 'est trop long',
  'validation.in': 'a une valeur invalide',
  'validation.string': 'doit être du texte',
  'validation.array': 'doit être une liste',
  'validation.exists': 'n\'existe pas',
  'validation.unique': 'existe déjà',
  'validation.email': 'doit être un email valide',
  'validation.confirmed': 'ne correspond pas à la confirmation',
  'validation.boolean': 'doit être vrai ou faux',
}

const LIBELLES_CHAMPS: Record<string, string> = {
  'date_livraison_souhaitee': 'La date de livraison',
  'mode_livraison': 'Le mode de livraison',
  'total_ttc': 'Le total TTC',
  'lignes': 'Les lignes de commande',
  'numero_telephone': 'Le numéro de téléphone',
  'operateur': 'L\'opérateur',
  'montant': 'Le montant',
  'mode_paiement': 'Le mode de paiement',
  'paiement_en_tranches': 'Le paiement en tranches',
  'tranches_prevues': 'L\'échéancier',
  'notes': 'Les notes',
}

export function PaiementForceModal({ open, onClose, panierPayload }: PaiementForceModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'processing' | 'awaiting' | 'success'>('form')
  const [numero, setNumero] = useState('')
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const [idPanier, setIdPanier] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(180)
  const [phoneUrgence, setPhoneUrgence] = useState('+237 690 000 000')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.get('/public/config').then((r: any) => {
      if (r.data?.phone_urgence) setPhoneUrgence(r.data.phone_urgence)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [open])

  const operateur = detectOperateur(numero)
  const numeroLimpide = numero.replace(/[^0-9]/g, '').replace(/^237/, '')
  const isNumeroValid = numeroLimpide.length === 9 && operateur !== null

  // Le montant à payer = 1ère tranche OU total intégral
  const montantAPayer = panierPayload.paiement_en_tranches && panierPayload.tranches_prevues?.length
    ? panierPayload.tranches_prevues[0].montant_du_ttc
    : panierPayload.total_ttc

  const restantApresAcompte = panierPayload.total_ttc - montantAPayer

  const handleClose = () => {
    if (step === 'processing' || step === 'awaiting') {
      if (!confirm('Voulez-vous vraiment annuler le paiement en cours ?')) return
    }
    if (pollingRef.current) clearInterval(pollingRef.current)
    setStep('form')
    setNumero('')
    setError('')
    setReference('')
    setIdPanier(null)
    setCountdown(180)
    onClose()
  }

  const startPolling = (ref: string, panId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/kpay/statut/${ref}`)
        const status = res.data.status
        if (status === 'SUCCESS') {
          clearInterval(interval)
          // Finaliser la commande côté backend
          try {
            const payRes = await api.post(`/paniers/${panId}/payer`, {
              mode_paiement: 'mobile_money',
              operateur,
              numero_telephone: numeroLimpide,
              reference_transaction: ref,
              montant: montantAPayer,
            })
            const commande = payRes.data.commande
            setStep('success')
            setTimeout(() => {
              toast.success(`Commande ${commande.numero_commande} créée avec succès !`)
              router.push(`/dashboard/client/commandes/${commande.id_commande}`)
              router.refresh()
            }, 1500)
          } catch (e: any) {
            const msg = e.response?.data?.message || 'Erreur lors de la création de la commande'
            setError(msg)
            setStep('form')
          }
        } else if (status === 'FAILED') {
          clearInterval(interval)
          setError(res.data.reason || 'Paiement refusé ou annulé par l\'opérateur')
          setStep('form')
        }
      } catch {
        // Ignorer les erreurs temporaires
      }
    }, 3000)
    pollingRef.current = interval

    // Compte à rebours
    const cdInterval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(cdInterval)
          clearInterval(interval)
          setError('Délai expiré. Veuillez réessayer.')
          setStep('form')
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handlePayer = async () => {
    if (!isNumeroValid) {
      setError(`Numéro invalide. Vérifiez votre numéro ${operateur ? `(${operateur})` : 'Mobile Money'}.`)
      return
    }

    setError('')
    setStep('processing')

    try {
      // ÉTAPE 1 : Créer le panier
      const panierRes = await api.post('/paniers', panierPayload)
      const panier = panierRes.data
      const pid = panier.id_panier
      setIdPanier(pid)

      // ÉTAPE 2 : Initier le paiement KPay
      const kpayRes = await api.post('/kpay/initier-panier', {
        id_panier: pid,
        phone: numeroLimpide,
        montant: montantAPayer,
        operateur: operateur,
      })

      const kpayId = kpayRes.data.kpay_id
      setReference(kpayId)
      setCountdown(180)
      setStep('awaiting')
      startPolling(kpayId, pid)

    } catch (e: any) {
      console.error('Erreur paiement:', e.response?.data)

      const errors = e.response?.data?.errors
      let msg = e.response?.data?.message || 'Erreur lors du paiement'

      if (errors && typeof errors === 'object') {
        const firstField = Object.keys(errors)[0]
        const firstError = errors[firstField]?.[0] || 'Erreur inconnue'
        const label = LIBELLES_CHAMPS[firstField] || firstField

        msg = TRADUCTIONS_ERREURS[firstError]
          ? `${label} ${TRADUCTIONS_ERREURS[firstError]}`
          : `${label} : ${firstError}`
      }

      setError(msg)
      setStep('form')
    }
  }

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
          onClick={handleClose}>

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="p-5 bg-escom-gradient text-white relative">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">Paiement Mobile Money</h2>
                  <p className="text-xs text-white/80">Sécurisé et instantané</p>
                </div>
              </div>
              {step === 'form' && (
                <button onClick={handleClose}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* CONTENT */}
            {step === 'form' && (
              <div className="p-5 space-y-5">
                {/* Récap montant */}
                <div className="bg-escom-blue-50 border border-escom-blue-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-escom-blue-700 uppercase mb-2">À payer maintenant</p>
                  <p className="text-3xl font-extrabold text-escom-blue-900 mb-1">{formatXAF(montantAPayer)}</p>
                  {panierPayload.paiement_en_tranches && restantApresAcompte > 0 && (
                    <p className="text-xs text-escom-neutral-600">
                      Reste à payer en {(panierPayload.tranches_prevues?.length || 1) - 1} tranche(s) : <span className="font-semibold">{formatXAF(restantApresAcompte)}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-escom-neutral-500 mt-2">
                    Total commande : <span className="font-semibold">{formatXAF(panierPayload.total_ttc)}</span>
                  </p>
                </div>

                {/* Saisie numéro */}
                <div>
                  <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                    <Smartphone size={14} /> Numéro Mobile Money *
                  </label>
                  <div className="relative">
                    <input type="tel" value={numero}
                      onChange={e => { setNumero(e.target.value); setError('') }}
                      placeholder="Ex: 670 000 000"
                      maxLength={15}
                      autoFocus
                      className="input-escom pr-24" />
                    {operateur && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-bold ${
                        operateur === 'MTN'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {operateur}
                      </span>
                    )}
                  </div>
                  {numero && !operateur && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Préfixe non reconnu (MTN: 67/68/650-684 — Orange: 69/640-689)
                    </p>
                  )}
                  {operateur && numeroLimpide.length < 9 && (
                    <p className="text-xs text-escom-neutral-500 mt-1">
                      Encore {9 - numeroLimpide.length} chiffre(s)
                    </p>
                  )}
                  {operateur && numeroLimpide.length === 9 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Numéro {operateur} validé
                    </p>
                  )}
                </div>

                {/* Erreur backend */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {/* Sécurité */}
                <div className="flex items-start gap-2 text-[11px] text-escom-neutral-500 bg-escom-neutral-50 p-3 rounded-lg">
                  <ShieldCheck size={14} className="text-green-600 shrink-0 mt-0.5" />
                  <p>
                    Transaction sécurisée. Vous recevrez une notification Mobile Money pour confirmer le débit.
                    Si le paiement échoue, votre panier reste valide pendant 24h.
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex gap-2 pt-2 border-t">
                  <button onClick={handleClose} className="btn-outline flex-1">
                    Annuler
                  </button>
                  <button onClick={handlePayer}
                    disabled={!isNumeroValid}
                    className="btn-primary flex-1">
                    <CreditCard size={14} /> Payer {formatXAF(montantAPayer)}
                  </button>
                </div>
              </div>
            )}

            {/* PROCESSING */}
            {step === 'processing' && (
              <div className="p-10 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-escom-blue-600 mb-4" />
                <p className="font-semibold mb-1">Envoi de la demande...</p>
                <p className="text-xs text-escom-neutral-500">
                  Connexion à {operateur === 'MTN' ? 'MTN MoMo' : 'Orange Money'}
                </p>
              </div>
            )}

            {/* AWAITING VALIDATION */}
            {step === 'awaiting' && (
              <div className="p-6 text-center space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white shadow-lg ${
                  operateur === 'MTN' ? 'bg-yellow-400' : 'bg-orange-500'
                }`}>
                  <Phone size={32} className="animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-lg mb-1">Demande envoyée !</p>
                  <p className="text-sm text-escom-neutral-600">
                    Un message a été envoyé au<br />
                    <strong className="text-escom-neutral-900">+237 {numero}</strong>
                  </p>
                </div>
                <div className="bg-escom-blue-50 p-4 rounded-lg text-left">
                  <p className="font-semibold text-sm mb-2">Sur votre téléphone :</p>
                  <ol className="text-xs text-escom-neutral-700 space-y-1 list-decimal list-inside">
                    <li>Composez <strong>{operateur === 'MTN' ? '*126#' : '#150*4*4#'}</strong></li>
                    <li>Saisissez votre code PIN</li>
                    <li>Confirmez le paiement de <strong>{formatXAF(montantAPayer)}</strong></li>
                  </ol>
                </div>
                <div>
                  <p className="text-xs text-escom-neutral-500 mb-1">Temps restant</p>
                  <p className="text-2xl font-bold text-escom-blue-700 font-mono">{formatCountdown(countdown)}</p>
                </div>
                <p className="text-xs text-escom-neutral-400">Vérification automatique en cours...</p>
                <button onClick={handleClose} className="text-xs text-escom-neutral-500 hover:underline">
                  Annuler le paiement
                </button>
              </div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <div className="p-8 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                <div>
                  <p className="font-bold text-lg mb-1">Paiement validé !</p>
                  <p className="text-sm text-escom-neutral-600">Votre commande est en cours de création...</p>
                </div>
                <div className="bg-escom-blue-50 border border-escom-blue-200 rounded-xl p-4 text-left">
                  <p className="text-xs font-semibold text-escom-blue-700 uppercase mb-2 flex items-center gap-1">
                    <Phone size={12} /> Contact d'urgence ESCOM
                  </p>
                  <p className="text-sm text-escom-blue-900 font-bold">{phoneUrgence}</p>
                  <p className="text-xs text-escom-neutral-500 mt-1">
                    Pour toute question urgente concernant votre commande ou votre paiement, contactez-nous par appel ou WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}