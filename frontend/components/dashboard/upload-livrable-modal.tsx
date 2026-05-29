'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Upload, Loader2, FileText, Image as ImageIcon, CheckCircle2,
  AlertCircle, Sparkles, FileArchive, File
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadLivrableModalProps {
  open: boolean
  onClose: () => void
  idProjet: number
  onUploaded?: () => void
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon
  if (mime === 'application/pdf') return FileText
  if (mime.includes('zip') || mime.includes('rar')) return FileArchive
  return File
}

export function UploadLivrableModal({ open, onClose, idProjet, onUploaded }: UploadLivrableModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [libelle, setLibelle] = useState('')
  const [description, setDescription] = useState('')
  const [estVersionFinale, setEstVersionFinale] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setLibelle('')
    setDescription('')
    setEstVersionFinale(false)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    if (uploading) return
    reset()
    onClose()
  }

  const onFileSelected = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`Fichier trop volumineux (max 50 MB). Le vôtre fait ${formatBytes(selectedFile.size)}.`)
      return
    }
    setFile(selectedFile)
    // Auto-remplir le libellé avec le nom du fichier (sans extension)
    if (!libelle) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^.]+$/, '')
      setLibelle(nameWithoutExt)
    }
    // Si image, générer un aperçu
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFileSelected(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onFileSelected(f)
  }

  const submit = async () => {
    if (!file) { toast.error('Veuillez sélectionner un fichier'); return }
    if (!libelle.trim()) { toast.error('Veuillez donner un titre au livrable'); return }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('id_projet', String(idProjet))
      formData.append('libelle', libelle.trim())
      if (description.trim()) formData.append('description', description.trim())
      formData.append('fichier', file)
      formData.append('est_version_finale', estVersionFinale ? '1' : '0')

      await api.post('/livrables', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
        },
      })

      toast.success('Livrable téléversé avec succès ! Le client a été notifié.')
      reset()
      onUploaded?.()
      onClose()
    } catch (e: any) {
      const errors = e.response?.data?.errors
      if (errors) {
        const firstError = (Object.values(errors)[0] as any)?.[0] || 'Erreur'
        toast.error(firstError)
      } else {
        toast.error(e.response?.data?.message || 'Erreur lors du téléversement')
      }
    } finally {
      setUploading(false)
    }
  }

  const FileIcon = file ? getFileIcon(file.type) : Upload
  const isImage = file?.type.startsWith('image/')

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
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* HEADER */}
            <div className="p-5 bg-escom-gradient text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Upload size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Nouveau livrable</h3>
                  <p className="text-xs text-white/80">Téléversez le fichier pour ce projet</p>
                </div>
              </div>
              {!uploading && (
                <button onClick={handleClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Zone drag & drop */}
              {!file && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition',
                    isDragging
                      ? 'border-escom-blue-600 bg-escom-blue-50'
                      : 'border-escom-neutral-300 hover:border-escom-blue-400 hover:bg-escom-neutral-50'
                  )}>
                  <Upload className="w-12 h-12 mx-auto text-escom-blue-500 mb-3" />
                  <p className="font-semibold text-sm text-escom-neutral-800">
                    Glissez votre fichier ici
                  </p>
                  <p className="text-xs text-escom-neutral-500 mt-1">
                    ou cliquez pour parcourir
                  </p>
                  <p className="text-[10px] text-escom-neutral-400 mt-3">
                    Images, PDF, ZIP, DOC... (max 50 MB)
                  </p>
                </div>
              )}

              <input ref={fileInputRef} type="file" onChange={handleFileInput}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.ai,.psd,.eps" />

              {/* Aperçu fichier sélectionné */}
              {file && (
                <div className="border rounded-xl overflow-hidden">
                  {isImage && preview ? (
                    <div className="relative bg-escom-neutral-100 max-h-64 overflow-hidden flex items-center justify-center">
                      <img src={preview} alt="Aperçu" className="max-h-64 w-auto object-contain" />
                      <span className="absolute top-2 right-2 bg-escom-gold-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={10} /> Filigrane auto
                      </span>
                    </div>
                  ) : (
                    <div className="bg-escom-neutral-50 p-6 flex items-center justify-center">
                      <FileIcon className="w-16 h-16 text-escom-blue-500" />
                    </div>
                  )}
                  <div className="p-3 bg-white flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{file.name}</p>
                      <p className="text-xs text-escom-neutral-500">{formatBytes(file.size)} • {file.type || 'inconnu'}</p>
                    </div>
                    {!uploading && (
                      <button onClick={() => { setFile(null); setPreview(null) }}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded ml-2 shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Champs */}
              {file && (
                <>
                  <div>
                    <label className="text-sm font-semibold block mb-1">Titre du livrable *</label>
                    <input type="text" value={libelle}
                      onChange={e => setLibelle(e.target.value)}
                      placeholder="Ex: Logo proposition 1"
                      maxLength={200} className="input-escom" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1">Description (optionnel)</label>
                    <textarea rows={2} value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Notes pour le client : choix typographique, palette..."
                      maxLength={1000} className="input-escom" />
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg border border-escom-blue-200 bg-escom-blue-50">
                    <input type="checkbox" id="estFinale"
                      checked={estVersionFinale}
                      onChange={e => setEstVersionFinale(e.target.checked)}
                      className="mt-0.5" />
                    <label htmlFor="estFinale" className="text-xs cursor-pointer flex-1">
                      <span className="font-semibold text-escom-blue-800 block">Version finale</span>
                      <span className="text-escom-blue-700">
                        Cochez si c'est la version définitive à livrer (le HD sera débloqué dès que le client aura payé en totalité)
                      </span>
                    </label>
                  </div>

                  {isImage && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-escom-gold-50 border border-escom-gold-200">
                      <Sparkles size={14} className="text-escom-gold-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-escom-gold-800">
                        Une <strong>preview filigranée ESCOM</strong> sera générée automatiquement pour protéger l'aperçu client. Le fichier HD original reste intact.
                      </p>
                    </div>
                  )}

                  {/* Barre de progression */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-escom-blue-700">Téléversement en cours...</span>
                        <span className="text-escom-neutral-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-escom-neutral-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-escom-gradient h-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t flex justify-end gap-2 bg-white">
              <button onClick={handleClose} disabled={uploading} className="btn-outline">
                Annuler
              </button>
              <button onClick={submit}
                disabled={uploading || !file || !libelle.trim()}
                className="btn-primary">
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" /> Envoi...</>
                  : <><Upload size={14} /> Téléverser</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}