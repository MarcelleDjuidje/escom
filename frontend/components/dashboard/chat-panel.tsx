'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Paperclip, MessageSquare, Plus, X, UserPlus, Shield, ShoppingBag, Info, Image as ImageIcon, FileText, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { relativeTime, cn } from '@/lib/utils'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  commercial: 'Commercial ESCOM',
  designer: 'Designer ESCOM',
  chef_projet: 'Chef de projet ESCOM',
  imprimeur: 'Imprimeur ESCOM',
  admin: 'Administration ESCOM',
  directeur: 'Direction ESCOM',
}

const getRoleLabel = (role: string) => ROLE_LABELS[role] || 'Membre de l\'équipe ESCOM'

export interface ChatPanelProps {
  showStartButton?: boolean
}

export function ChatPanel({ showStartButton = true }: ChatPanelProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [showNewModal, setShowNewModal] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [contactType, setContactType] = useState<'employes' | 'clients' | ''>('')
  const [hasCommandes, setHasCommandes] = useState(true)
  const [newSujet, setNewSujet] = useState('')
  const [newContactId, setNewContactId] = useState<string>('')
  const [creating, setCreating] = useState(false)

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminSujet, setAdminSujet] = useState('')

  useEffect(() => { fetchConversations() }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selected) return
    const id = setInterval(() => {
      api.get(`/chat/conversations/${selected.id_conversation}`)
        .then((r: any) => setMessages(r.data.messages || []))
        .catch(() => {})
    }, 6000)
    return () => clearInterval(id)
  }, [selected])

  const fetchConversations = (autoSelect: boolean = true) => {
    setLoading(true)
    api.get('/chat/conversations')
      .then((r: any) => {
        const list = r.data || []
        setConversations(list)
        if (autoSelect && list[0] && !selected) selectConv(list[0].id_conversation)
      })
      .finally(() => setLoading(false))
  }

  const selectConv = async (id: number) => {
    try {
      const res = await api.get(`/chat/conversations/${id}`)
      setSelected(res.data.conversation)
      setMessages(res.data.messages || [])
      api.patch(`/chat/conversations/${id}/read`).catch(() => {})
    } catch {
      toast.error('Impossible de charger la conversation')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedFile) || !selected) return
    setSending(true)
    try {
      const formData = new FormData()
      if (input.trim()) formData.append('contenu', input.trim())
      if (selectedFile) formData.append('fichier', selectedFile)
      formData.append('type_message', 'texte')

      const res = await api.post(
        `/chat/conversations/${selected.id_conversation}/messages`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setMessages([...messages, res.data])
      setInput('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur d\'envoi')
    } finally {
      setSending(false)
    }
  }

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 MB)')
      return
    }
    setSelectedFile(file)
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const openNewModal = async () => {
    setShowNewModal(true)
    setNewSujet('')
    setNewContactId('')
    try {
      const res = await api.get('/chat/contacts-disponibles')
      setContacts(res.data.contacts || [])
      setContactType(res.data.type || '')
      setHasCommandes(res.data.has_commandes !== false)
    } catch {
      toast.error('Impossible de charger les contacts')
      setContacts([])
    }
  }

  const createConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSujet.trim() || !newContactId) {
      toast.error('Sujet et destinataire requis')
      return
    }
    setCreating(true)
    try {
      const payload: any = { sujet: newSujet.trim() }
      if (contactType === 'employes') {
        payload.id_employe = Number(newContactId)
      } else {
        payload.id_client = Number(newContactId)
      }

      const res = await api.post('/chat/conversations', payload)
      toast.success('Conversation créée')
      setShowNewModal(false)
      await fetchConversations(false)
      selectConv(res.data.id_conversation)
    } catch (e: any) {
      const errors = e.response?.data?.errors
      if (errors) {
        toast.error((Object.values(errors)[0] as any)?.[0] || 'Erreur')
      } else {
        toast.error(e.response?.data?.message || 'Erreur')
      }
    } finally {
      setCreating(false)
    }
  }

  const contacterAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminSujet.trim()) return
    setCreating(true)
    try {
      const res = await api.post('/chat/contacter-admin', { sujet: adminSujet.trim() })
      toast.success('Conversation avec l\'administration ouverte')
      setShowAdminModal(false)
      setAdminSujet('')
      await fetchConversations(false)
      selectConv(res.data.id_conversation)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const isMine = (msg: any) => {
    if (!user) return false
    if (user.is_staff) {
      return msg.expediteur_type === 'employe'
    }
    return msg.expediteur_type === 'client'
  }

  const getContactLabel = (c: any) => {
    if (contactType === 'employes') {
      const cmds = (c.commandes || []).map((cmd: any) => cmd.numero_commande).join(', ')
      const label = getRoleLabel(c.role)
      return cmds ? `${label} — ${cmds}` : label
    }
    return c.type_client === 'entreprise' && c.raison_sociale
      ? `${c.raison_sociale} — ${c.nom_complet}`
      : c.nom_complet
  }

  const getContactId = (c: any) => contactType === 'employes' ? c.id_employe : c.id_client

  const isClientRole = !user?.is_staff

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
  const getFileUrl = (url: string) => url?.startsWith('http') ? url : `${apiBase}${url}`

  return (
    <div className="card-escom h-[calc(100vh-200px)] flex overflow-hidden">
      <aside className="w-72 border-r border-escom-neutral-200 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Conversations</h2>
            <p className="text-xs text-escom-neutral-500">{conversations.length} discussion{conversations.length > 1 ? 's' : ''}</p>
          </div>
          {showStartButton && (
            <button onClick={openNewModal}
              className="bg-escom-blue-600 hover:bg-escom-blue-700 text-white p-2 rounded-full shadow transition"
              title="Nouvelle conversation">
              <Plus size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-escom-blue-600" /></div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-escom-neutral-300" />
              <p className="text-sm text-escom-neutral-500 mb-3">Aucune conversation</p>
              {showStartButton && (
                <button onClick={openNewModal} className="btn-primary !py-1.5 !px-3 !text-xs">
                  <Plus size={12} /> Démarrer
                </button>
              )}
            </div>
          ) : conversations.map(c => (
            <button key={c.id_conversation} onClick={() => selectConv(c.id_conversation)}
              className={cn(
                'w-full text-left p-3 border-b border-escom-neutral-100 hover:bg-escom-neutral-50 transition',
                selected?.id_conversation === c.id_conversation && 'bg-escom-blue-50'
              )}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm truncate">{c.sujet}</p>
              </div>
              <p className="text-xs text-escom-neutral-500 truncate">
                {user?.is_staff
                  ? (c.client?.raison_sociale || c.client?.nom_complet || 'Client')
                  : (c.employe ? getRoleLabel(c.employe.role) : 'Équipe ESCOM')}
              </p>
              {c.dernier_message_at && (
                <p className="text-[10px] text-escom-neutral-400 mt-1">{relativeTime(c.dernier_message_at)}</p>
              )}
            </button>
          ))}
        </div>

        {isClientRole && showStartButton && (
          <div className="p-3 border-t bg-escom-neutral-50">
            <button onClick={() => setShowAdminModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-escom-gold-100 hover:bg-escom-gold-200 text-escom-gold-800 text-xs font-semibold transition">
              <Shield size={14} /> Contacter l'administration
            </button>
            <p className="text-[10px] text-escom-neutral-500 text-center mt-1">
              Question hors-projet (facturation, réclamation...)
            </p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <header className="p-4 border-b">
              <h3 className="font-semibold">{selected.sujet}</h3>
              <p className="text-xs text-escom-neutral-500">
                {user?.is_staff
                  ? (selected.client?.raison_sociale || selected.client?.nom_complet || 'Client')
                  : `Avec ${selected.employe ? getRoleLabel(selected.employe.role) : 'l\'équipe ESCOM'}`}
              </p>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-escom-neutral-50">
              {messages.map((m: any, idx: number) => {
                const mine = isMine(m)
                const prevMine = idx > 0 ? isMine(messages[idx - 1]) : null
                const isFirstOfGroup = prevMine !== mine
                const avatar = mine
                  ? null
                  : (user?.is_staff
                      ? (selected?.client?.nom_complet?.charAt(0)?.toUpperCase() || 'C')
                      : (selected?.employe?.role
                          ? (ROLE_LABELS[selected.employe.role]?.charAt(0) || 'E')
                          : 'E'))
                const isImage = m.type_message === 'image' && m.fichier_url
                const isFile = (m.type_message === 'document' || m.type_message === 'audio' || m.type_message === 'video') && m.fichier_url
                const fichierFullUrl = m.fichier_url ? getFileUrl(m.fichier_url) : ''

                return (
                  <motion.div key={m.id_message}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex items-end gap-2',
                      mine ? 'justify-end' : 'justify-start',
                      isFirstOfGroup ? 'mt-3' : 'mt-0.5'
                    )}>

                    {!mine && (
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                        isFirstOfGroup
                          ? 'bg-escom-blue-100 text-escom-blue-700'
                          : 'opacity-0'
                      )}>
                        {avatar}
                      </div>
                    )}

                    <div className={cn(
                      'max-w-[75%] shadow-sm overflow-hidden',
                      mine
                        ? 'bg-gradient-to-br from-escom-blue-600 to-escom-blue-700 text-white'
                        : 'bg-white border border-escom-neutral-200 text-escom-neutral-800',
                      'rounded-2xl',
                      mine ? 'rounded-br-sm' : 'rounded-bl-sm'
                    )}>
                      {/* Image */}
                      {isImage && (
                        <a href={fichierFullUrl} target="_blank" rel="noopener noreferrer">
                          <img src={fichierFullUrl} alt={m.fichier_nom || 'image'}
                            className="max-h-64 w-auto object-cover hover:opacity-90 transition" />
                        </a>
                      )}

                      {/* Fichier */}
                      {isFile && (
                        <a href={fichierFullUrl} target="_blank" rel="noopener noreferrer" download
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 transition',
                            mine ? 'hover:bg-white/10' : 'hover:bg-escom-neutral-50'
                          )}>
                          <div className={cn(
                            'w-8 h-8 rounded flex items-center justify-center shrink-0',
                            mine ? 'bg-white/20' : 'bg-escom-blue-100'
                          )}>
                            <FileText size={16} className={mine ? 'text-white' : 'text-escom-blue-600'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-semibold truncate', mine ? 'text-white' : 'text-escom-neutral-800')}>
                              {m.fichier_nom || 'Fichier'}
                            </p>
                            {m.fichier_taille && (
                              <p className={cn('text-[10px]', mine ? 'text-escom-blue-100' : 'text-escom-neutral-500')}>
                                {formatBytes(m.fichier_taille)}
                              </p>
                            )}
                          </div>
                          <Download size={14} className={mine ? 'text-white' : 'text-escom-blue-600'} />
                        </a>
                      )}

                      {/* Texte */}
                      {m.contenu && (
                        <p className={cn('text-sm whitespace-pre-wrap leading-relaxed px-4 py-2.5', (isImage || isFile) && 'pt-2')}>
                          {m.contenu}
                        </p>
                      )}

                      {/* Métadonnées */}
                      <p className={cn(
                        'text-[10px] flex items-center gap-1 px-4 pb-2',
                        !m.contenu && '-mt-2 pt-2',
                        mine ? 'text-escom-blue-100 justify-end' : 'text-escom-neutral-400'
                      )}>
                        {relativeTime(m.envoye_le || m.created_at)}
                        {mine && <span className="ml-0.5">✓</span>}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare size={40} className="text-escom-neutral-300 mb-3" />
                  <p className="text-sm text-escom-neutral-500">
                    Aucun message. Démarrez la conversation ! 👋
                  </p>
                </div>
              )}
            </div>

            {/* Preview du fichier sélectionné */}
            {selectedFile && (
              <div className="px-3 py-2 bg-escom-blue-50 border-t flex items-center gap-2">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon size={16} className="text-escom-blue-600 shrink-0" />
                ) : (
                  <FileText size={16} className="text-escom-blue-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-escom-neutral-500">{formatBytes(selectedFile.size)}</p>
                </div>
                <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-red-600 hover:bg-red-50 p-1 rounded">
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={sendMessage} className="p-3 border-t flex items-center gap-2 bg-white">
              <input type="file" ref={fileInputRef} onChange={onFileSelected}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" />
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-escom-neutral-400 hover:text-escom-blue-600"
                title="Joindre un fichier (max 10 MB)">
                <Paperclip size={18} />
              </button>
              <input
                type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder={selectedFile ? "Légende (optionnel)..." : "Écrivez un message..."}
                className="flex-1 input-escom"
                disabled={sending}
              />
              <button type="submit" disabled={sending || (!input.trim() && !selectedFile)}
                className="btn-primary !py-2 !px-4">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={48} className="text-escom-neutral-300 mb-3" />
            <p className="text-escom-neutral-500 mb-3">
              {conversations.length === 0
                ? 'Aucune conversation pour le moment'
                : 'Sélectionnez une conversation pour commencer'}
            </p>
            {conversations.length === 0 && showStartButton && (
              <button onClick={openNewModal} className="btn-primary">
                <Plus size={16} /> Démarrer une conversation
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setShowNewModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full"
              onClick={e => e.stopPropagation()}>

              <div className="p-5 border-b flex items-center justify-between bg-escom-gradient text-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <UserPlus size={20} />
                  <h3 className="font-bold">Nouvelle conversation</h3>
                </div>
                <button onClick={() => setShowNewModal(false)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                  <X size={18} />
                </button>
              </div>

              {isClientRole && !hasCommandes ? (
                <div className="p-6 text-center">
                  <ShoppingBag size={48} className="mx-auto text-escom-blue-300 mb-3" />
                  <h4 className="font-bold text-lg mb-2">Pas encore de commande</h4>
                  <p className="text-sm text-escom-neutral-600 mb-4">
                    Pour discuter avec notre équipe créative, vous devez d'abord passer une commande.
                    Chaque interlocuteur que vous pourrez contacter sera celui qui travaille concrètement sur votre projet.
                  </p>
                  <div className="space-y-2">
                    <a href="/services" className="btn-primary w-full">
                      <ShoppingBag size={14} /> Découvrir nos services
                    </a>
                    <button onClick={() => { setShowNewModal(false); setShowAdminModal(true) }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-escom-gold-100 hover:bg-escom-gold-200 text-escom-gold-800 text-xs font-semibold">
                      <Shield size={14} /> Question hors-projet ? Contacter l'administration
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={createConversation} className="p-5 space-y-4">
                  {isClientRole && contacts.length > 0 && (
                    <div className="p-3 bg-escom-blue-50 rounded-lg flex items-start gap-2">
                      <Info size={14} className="text-escom-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-escom-blue-700">
                        Vous pouvez contacter uniquement les membres de l'équipe assignés à vos commandes.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold block mb-1">
                      {contactType === 'employes' ? 'Mon interlocuteur' : 'Sélectionnez un client'} *
                    </label>
                    <select value={newContactId} onChange={e => setNewContactId(e.target.value)}
                      className="input-escom" required>
                      <option value="">-- Choisir --</option>
                      {contacts.map((c: any) => {
                        const id = getContactId(c)
                        return <option key={id} value={id}>{getContactLabel(c)}</option>
                      })}
                    </select>
                    {contacts.length === 0 && (
                      <p className="text-xs text-escom-neutral-500 mt-1">Aucun contact disponible</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-1">Sujet *</label>
                    <input type="text" value={newSujet}
                      onChange={e => setNewSujet(e.target.value)}
                      placeholder="Ex: Question sur ma commande CMD-2026-0001"
                      maxLength={200}
                      className="input-escom" required />
                    <p className="text-[10px] text-escom-neutral-500 mt-1">{newSujet.length}/200</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onClick={() => setShowNewModal(false)} className="btn-outline">
                      Annuler
                    </button>
                    <button type="submit" disabled={creating || !newSujet.trim() || !newContactId} className="btn-primary">
                      {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Démarrer
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-escom-blue-950/80 backdrop-blur flex items-center justify-center p-4"
            onClick={() => setShowAdminModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full"
              onClick={e => e.stopPropagation()}>

              <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-escom-gold-500 to-escom-gold-600 text-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Shield size={20} />
                  <h3 className="font-bold">Contacter l'administration</h3>
                </div>
                <button onClick={() => setShowAdminModal(false)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={contacterAdmin} className="p-5 space-y-4">
                <div className="p-3 bg-escom-gold-50 rounded-lg flex items-start gap-2">
                  <Info size={14} className="text-escom-gold-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-escom-gold-800">
                    Cette option vous met directement en contact avec la direction. À utiliser pour les questions hors-projet : facturation, plaintes, demandes spéciales.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">Objet de votre demande *</label>
                  <input type="text" value={adminSujet}
                    onChange={e => setAdminSujet(e.target.value)}
                    placeholder="Ex: Problème de facturation, Réclamation..."
                    maxLength={200}
                    className="input-escom" required />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowAdminModal(false)} className="btn-outline">
                    Annuler
                  </button>
                  <button type="submit" disabled={creating || !adminSujet.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-escom-gold-500 hover:bg-escom-gold-600 text-white font-semibold text-sm">
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                    Démarrer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}