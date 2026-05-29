'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TYPE_SERVICE_OPTIONS } from '@/lib/devis-helpers'
import { X, Loader2, FileText, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function DemanderDevisModal({ open, onClose, onCreated }: Props) {
  const [typeService, setTypeService] = useState('')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [delai, setDelai] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const reset = () => {
    setTypeService(''); setTitre(''); setDescription(''); setBudget(''); setDelai('')
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    // Validation côté client
    if (!typeService) return toast.error('Choisissez un type de service')
    if (titre.trim().length < 5) return toast.error('Le titre doit faire au moins 5 caractères')
    if (description.trim().length < 20) return toast.error('Décrivez votre besoin (20 caractères minimum)')

    setSubmitting(true)
    try {
      await api.post('/devis', {
        type_service: typeService,
        titre: titre.trim(),
        description_besoin: description.trim(),
        budget_indicatif: budget ? parseFloat(budget) : null,
        delai_souhaite: delai || null,
      })
      toast.success('Demande de devis envoyée ! Notre équipe va la traiter.')
      reset()
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Erreur lors de l'envoi de la demande")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Demander un devis personnalisé</h2>
              <p className="text-xs text-blue-100">Décrivez votre projet, nous le chiffrons sous 48h</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6">
          {/* Type de service */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Type de service <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPE_SERVICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeService(opt.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition-all duration-200',
                    typeService === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm scale-[1.02]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Titre du projet <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Identité visuelle complète pour ma boutique"
              maxLength={200}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Description du besoin <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez précisément ce que vous souhaitez : objectifs, style, contraintes, exemples..."
              rows={5}
              maxLength={5000}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{description.length}/5000</p>
          </div>

          {/* Budget + Délai */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Budget indicatif (XAF)
                <span className="ml-1 font-normal text-gray-400">— optionnel</span>
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex : 150000"
                min={0}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Délai souhaité
                <span className="ml-1 font-normal text-gray-400">— optionnel</span>
              </label>
              <input
                type="date"
                value={delai}
                onChange={(e) => setDelai(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Note info */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-xs leading-relaxed text-blue-800">
              Après réception, notre équipe étudie votre demande et vous propose un prix et un délai.
              Vous restez libre d'accepter ou de refuser — sans engagement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-white px-6 py-4">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:shadow-xl hover:shadow-blue-600/30 active:scale-95 disabled:opacity-60"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
            ) : (
              <>Envoyer ma demande</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}