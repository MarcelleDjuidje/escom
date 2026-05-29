'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle2, AlertCircle, Phone, ChevronLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { formatXAF } from '@/lib/utils'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tranche: {
    id_tranche: number
    libelle: string
    montant_du_ttc: number
    numero_tranche: number
  } | null
  numeroCommande?: string
}

type Step = 'select_operator' | 'enter_phone' | 'sending' | 'awaiting_validation' | 'success' | 'error'
type Operator = 'mtn' | 'orange'

// Préfixes téléphoniques camerounais
const MTN_PREFIXES = ['67', '68', '650', '651', '652', '653', '654', '680', '681', '682', '683', '684']
const ORANGE_PREFIXES = ['69', '655', '656', '657', '658', '659', '640', '641', '642', '643', '685', '686', '687', '688', '689']

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\.]/g, '').replace(/^(\+?237)/, '')
}

function validatePhoneByOperator(phone: string, operator: Operator): { valid: boolean; detectedOperator: Operator | null } {
  const cleaned = cleanPhone(phone)
  if (cleaned.length !== 9) return { valid: false, detectedOperator: null }

  const prefix2 = cleaned.substring(0, 2)
  const prefix3 = cleaned.substring(0, 3)

  const isMtn = MTN_PREFIXES.some(p => p.length === 2 ? prefix2 === p : prefix3 === p)
  const isOrange = ORANGE_PREFIXES.some(p => p.length === 2 ? prefix2 === p : prefix3 === p)

  let detectedOperator: Operator | null = null
  if (isMtn) detectedOperator = 'mtn'
  else if (isOrange) detectedOperator = 'orange'

  return {
    valid: detectedOperator === operator,
    detectedOperator,
  }
}

function formatPhoneDisplay(phone: string): string {
  const cleaned = cleanPhone(phone)
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`
  return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`
}

export function PaymentModal({ isOpen, onClose, onSuccess, tranche, numeroCommande }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('select_operator')
  const [operator, setOperator] = useState<Operator | null>(null)
  const [phone, setPhone] = useState('')
  const [countdown, setCountdown] = useState(180)
  const [errorMsg, setErrorMsg] = useState('')
  const [reference, setReference] = useState('')

  // Reset à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select_operator')
        setOperator(null)
        setPhone('')
        setCountdown(180)
        setErrorMsg('')
        setReference('')
      }, 300)
    }
  }, [isOpen])

  // Compte à rebours en mode "attente"
  useEffect(() => {
    if (step !== 'awaiting_validation') return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          setStep('error')
          setErrorMsg('Délai expiré. Veuillez réessayer.')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  if (!tranche) return null

  const validation = operator ? validatePhoneByOperator(phone, operator) : { valid: false, detectedOperator: null }
  const phoneClean = cleanPhone(phone)
  const phoneComplete = phoneClean.length === 9

  const selectOperator = (op: Operator) => {
    setOperator(op)
    setStep('enter_phone')
  }

  const sendPaymentRequest = async () => {
    if (!operator || !validation.valid) return
    setStep('sending')
    // Simulation : 2 secondes d'envoi de la demande à l'opérateur
    await new Promise(r => setTimeout(r, 2000))
    setStep('awaiting_validation')
    setCountdown(180)
  }

  const confirmPayment = async () => {
    if (!operator || !phoneComplete) return
    setStep('sending')
    try {
      const ref = `ESC-${Date.now()}-${operator.toUpperCase()}`
      await api.post(`/tranches/${tranche.id_tranche}/payer`, {
        montant: tranche.montant_du_ttc,
        mode_paiement: 'mobile_money',
        reference_transaction: ref,
      })
      setReference(ref)
      setStep('success')
    } catch (e: any) {
      console.error('Erreur paiement:', e.response?.data)
      setErrorMsg(e.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement')
      setStep('error')
    }
  }

  const handleClose = () => {
    if (step === 'sending' || step === 'awaiting_validation') {
      if (!confirm('Voulez-vous vraiment annuler le paiement en cours ?')) return
    }
    onClose()
  }

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="p-5 border-b flex items-center justify-between bg-escom-gradient text-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-lg">Paiement Mobile Money</h2>
                {numeroCommande && <p className="text-xs text-escom-blue-100">{numeroCommande}</p>}
              </div>
              <button onClick={handleClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>

            {/* INFO TRANCHE */}
            <div className="p-5 bg-escom-gold-50 border-b">
              <p className="text-xs text-escom-gold-800 uppercase font-semibold">Tranche {tranche.numero_tranche}</p>
              <p className="font-bold">{tranche.libelle}</p>
              <p className="text-2xl font-bold text-escom-gold-700 mt-1">{formatXAF(tranche.montant_du_ttc)}</p>
            </div>

            {/* ÉTAPES */}
            <div className="p-5">

              {/* ÉTAPE 1 — Choix de l'opérateur */}
              {step === 'select_operator' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-semibold mb-4">Choisissez votre opérateur</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => selectOperator('mtn')}
                      className="p-5 rounded-xl border-2 border-escom-neutral-200 hover:border-yellow-500 hover:bg-yellow-50 transition group">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition">
                        MTN
                      </div>
                      <p className="font-semibold text-sm">MTN Mobile Money</p>
                      <p className="text-[10px] text-escom-neutral-500 mt-1">67, 68, 650-654, 680-684</p>
                    </button>
                    <button onClick={() => selectOperator('orange')}
                      className="p-5 rounded-xl border-2 border-escom-neutral-200 hover:border-orange-500 hover:bg-orange-50 transition group">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition">
                        Orange
                      </div>
                      <p className="font-semibold text-sm">Orange Money</p>
                      <p className="text-[10px] text-escom-neutral-500 mt-1">69, 640-643, 655-659, 685-689</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 2 — Saisie du numéro */}
              {step === 'enter_phone' && operator && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <button onClick={() => setStep('select_operator')}
                    className="text-sm text-escom-neutral-500 hover:text-escom-neutral-700 mb-3 flex items-center gap-1">
                    <ChevronLeft size={14} /> Changer d'opérateur
                  </button>

                  <div className={`p-3 rounded-lg mb-4 flex items-center gap-3 ${
                    operator === 'mtn' ? 'bg-yellow-50 border border-yellow-200' : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                      operator === 'mtn' ? 'bg-yellow-400' : 'bg-orange-500'
                    }`}>
                      {operator === 'mtn' ? 'MTN' : 'OM'}
                    </div>
                    <p className="font-semibold">
                      {operator === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'} sélectionné
                    </p>
                  </div>

                  <label className="text-sm font-semibold block mb-2">Numéro de téléphone</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-escom-neutral-500 font-medium">+237</div>
                    <input
                      type="tel"
                      value={formatPhoneDisplay(phone)}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                      placeholder="6XX XXX XXX"
                      className={`input-escom !pl-16 text-lg font-medium ${
                        phoneComplete && !validation.valid ? 'border-red-500' : ''
                      } ${
                        phoneComplete && validation.valid ? 'border-green-500' : ''
                      }`}
                      autoFocus
                    />
                  </div>

                  {/* Messages de validation */}
                  {phoneComplete && validation.valid && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-2 text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Numéro {operator === 'mtn' ? 'MTN' : 'Orange'} valide
                    </motion.div>
                  )}

                  {phoneComplete && !validation.valid && validation.detectedOperator && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Ce numéro est un numéro {validation.detectedOperator === 'mtn' ? 'MTN' : 'Orange'}</p>
                        <p className="text-xs mt-1">Changez d'opérateur ou saisissez un numéro {operator === 'mtn' ? 'MTN' : 'Orange'}.</p>
                      </div>
                    </motion.div>
                  )}

                  {phoneComplete && !validation.valid && !validation.detectedOperator && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <p>Numéro de téléphone non reconnu. Vérifiez le préfixe.</p>
                    </motion.div>
                  )}

                  <div className="flex gap-2 mt-5">
                    <button onClick={handleClose} className="btn-outline flex-1">Annuler</button>
                    <button onClick={sendPaymentRequest}
                      disabled={!validation.valid}
                      className="btn-primary flex-1">
                      <Phone size={16} /> Envoyer la demande
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ÉTAPE 3 — Envoi de la demande */}
              {step === 'sending' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                  <Loader2 className="w-16 h-16 mx-auto text-escom-blue-600 animate-spin mb-4" />
                  <p className="font-semibold text-lg">Envoi de la demande...</p>
                  <p className="text-sm text-escom-neutral-500 mt-1">Connexion à {operator === 'mtn' ? 'MTN MoMo' : 'Orange Money'}</p>
                </motion.div>
              )}

              {/* ÉTAPE 4 — Attente de validation utilisateur */}
              {step === 'awaiting_validation' && operator && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white shadow-lg ${
                    operator === 'mtn' ? 'bg-yellow-400' : 'bg-orange-500'
                  }`}>
                    <Phone size={32} className="animate-pulse" />
                  </div>
                  <p className="font-bold text-lg mb-2">Demande envoyée !</p>
                  <p className="text-sm text-escom-neutral-600 mb-4">
                    Un message a été envoyé au<br />
                    <strong className="text-escom-neutral-900">+237 {formatPhoneDisplay(phone)}</strong>
                  </p>

                  <div className="bg-escom-blue-50 p-4 rounded-lg mb-4 text-left">
                    <p className="font-semibold text-sm mb-2">📲 Sur votre téléphone :</p>
                    <ol className="text-xs text-escom-neutral-700 space-y-1 list-decimal list-inside">
                      <li>Composez <strong>{operator === 'mtn' ? '*126#' : '#150*4*4#'}</strong></li>
                      <li>Saisissez votre code PIN</li>
                      <li>Confirmez le paiement de <strong>{formatXAF(tranche.montant_du_ttc)}</strong></li>
                    </ol>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-escom-neutral-500 mb-1">Temps restant</p>
                    <p className="text-2xl font-bold text-escom-blue-700 font-mono">{formatCountdown(countdown)}</p>
                  </div>

                  <button onClick={confirmPayment} className="btn-primary w-full">
                    <CheckCircle2 size={16} /> J'ai validé sur mon téléphone
                  </button>
                  <button onClick={handleClose} className="text-xs text-escom-neutral-500 hover:underline mt-3">
                    Annuler le paiement
                  </button>
                </motion.div>
              )}

              {/* ÉTAPE 5 — Succès */}
              {step === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={48} className="text-green-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Paiement confirmé !</h3>
                  <p className="text-sm text-escom-neutral-600 mb-4">Votre paiement a été enregistré avec succès.</p>

                  <div className="bg-escom-neutral-50 p-4 rounded-lg text-left space-y-2 text-sm mb-5">
                    <div className="flex justify-between">
                      <span className="text-escom-neutral-500">Montant :</span>
                      <span className="font-semibold">{formatXAF(tranche.montant_du_ttc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-escom-neutral-500">Opérateur :</span>
                      <span className="font-semibold">{operator === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-escom-neutral-500">Référence :</span>
                      <span className="font-mono text-xs">{reference}</span>
                    </div>
                  </div>

                  <button onClick={() => { onSuccess(); onClose() }} className="btn-primary w-full">
                    Voir ma commande
                  </button>
                </motion.div>
              )}

              {/* ÉTAPE 6 — Erreur */}
              {step === 'error' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle size={48} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-700 mb-2">Paiement échoué</h3>
                  <p className="text-sm text-escom-neutral-600 mb-5">{errorMsg}</p>
                  <div className="flex gap-2">
                    <button onClick={handleClose} className="btn-outline flex-1">Fermer</button>
                    <button onClick={() => setStep('select_operator')} className="btn-primary flex-1">Réessayer</button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}