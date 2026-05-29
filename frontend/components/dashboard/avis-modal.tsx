'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Loader2, Send, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface AvisModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  idCommande?: number
  numeroCommande?: string
}

export function AvisModal({ isOpen, onClose, onSuccess, idCommande, numeroCommande }: AvisModalProps) {
  const [note, setNote] = useState(0)
  const [hoveredNote, setHoveredNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Reset à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setNote(0)
        setHoveredNote(0)
        setCommentaire('')
        setSubmitting(false)
        setSuccess(false)
      }, 300)
    }
  }, [isOpen])

  const submit = async () => {
    if (note === 0) {
      toast.error('Veuillez sélectionner une note')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        note,
        commentaire: commentaire.trim() || null,
      }
      if (idCommande) payload.id_commande = idCommande

      await api.post('/avis', payload)
      setSuccess(true)
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 2000)
    } catch (e: any) {
      console.error('Erreur avis:', e.response?.data)
      const errors = e.response?.data?.errors
      if (errors) {
        const messages = Object.entries(errors).map(([f, m]: any) => `${f}: ${m[0]}`).join('\n')
        toast.error(messages)
      } else {
        toast.error(e.response?.data?.message || 'Erreur lors de l\'envoi de l\'avis')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const labelForNote = (n: number): string => {
    const labels: Record<number, string> = {
      1: '😞 Très insatisfait',
      2: '🙁 Insatisfait',
      3: '😐 Correct',
      4: '🙂 Satisfait',
      5: '😍 Excellent !',
    }
    return labels[n] || ''
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
          onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-lg w-full"
            onClick={e => e.stopPropagation()}>

            {/* HEADER */}
            <div className="p-5 border-b flex items-center justify-between bg-escom-gradient text-white rounded-t-2xl">
              <div>
                <h2 className="font-bold text-lg">Laisser un avis</h2>
                {numeroCommande && <p className="text-xs text-escom-blue-100">{numeroCommande}</p>}
              </div>
              <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>

            {/* CONTENU */}
            <div className="p-6">
              {success ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-700 mb-2">Merci pour votre avis !</h3>
                  <p className="text-sm text-escom-neutral-600">
                    Votre retour est précieux. Il sera publié après validation par notre équipe.
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-escom-neutral-600 mb-4">
                    Votre avis nous aide à nous améliorer et guide les futurs clients.
                  </p>

                  {/* Étoiles */}
                  <div className="text-center mb-5">
                    <p className="text-xs font-semibold text-escom-neutral-500 uppercase mb-3">Votre note</p>
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button"
                          onMouseEnter={() => setHoveredNote(n)}
                          onMouseLeave={() => setHoveredNote(0)}
                          onClick={() => setNote(n)}
                          className="p-1 transition-transform hover:scale-125">
                          <Star size={36}
                            className={n <= (hoveredNote || note)
                              ? 'fill-escom-gold-500 text-escom-gold-500'
                              : 'text-escom-neutral-300'}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-escom-blue-700 mt-2 h-5">
                      {labelForNote(hoveredNote || note)}
                    </p>
                  </div>

                  {/* Commentaire */}
                  <div className="mb-4">
                    <label className="text-sm font-semibold block mb-2">
                      Votre commentaire <span className="text-escom-neutral-400 font-normal">(optionnel)</span>
                    </label>
                    <textarea value={commentaire}
                      onChange={e => setCommentaire(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Partagez votre expérience : qualité, délais, communication..."
                      className="input-escom" />
                    <p className="text-[10px] text-escom-neutral-500 mt-1 text-right">
                      {commentaire.length}/2000
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button onClick={onClose} className="btn-outline">Annuler</button>
                    <button onClick={submit} disabled={submitting || note === 0}
                      className="btn-primary">
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Envoyer mon avis
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}