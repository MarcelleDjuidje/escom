'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ShoppingCart, FileText, MessageSquare, Bell, User, LogOut,
  Menu, X, Package, Briefcase, Image, Star, Users, BarChart3,
  Megaphone, Heart, Receipt, Gift, ListTodo, CreditCard, CheckCheck, Loader2, Inbox
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { cn, relativeTime } from '@/lib/utils'
import { toast } from 'sonner'

interface NavItem {
  href: string; label: string; icon: any
}

const CLIENT_NAV: NavItem[] = [
  { href: '/dashboard/client', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/client/commandes', label: 'Mes commandes', icon: ShoppingCart },
  { href: '/dashboard/client/devis', label: 'Mes devis', icon: FileText },
  { href: '/dashboard/client/factures', label: 'Mes factures', icon: Receipt },
  { href: '/dashboard/client/livrables', label: 'Mes livrables', icon: Package },
  { href: '/dashboard/client/demandes', label: 'Demandes campagne', icon: Megaphone },
  { href: '/dashboard/client/favoris', label: 'Mes favoris', icon: Heart },
  { href: '/dashboard/client/chat', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/client/profil', label: 'Mon profil', icon: User },
]

const EMPLOYE_NAV: NavItem[] = [
  { href: '/dashboard/employe', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/employe/projets', label: 'Mes projets', icon: Briefcase },
  { href: '/dashboard/employe/taches', label: 'Mes tâches', icon: ListTodo },
  { href: '/dashboard/employe/commandes', label: 'Commandes', icon: ShoppingCart },
  { href: '/dashboard/employe/clients', label: 'Mes clients', icon: Users },
  { href: '/dashboard/employe/demandes', label: 'Demandes', icon: Megaphone },
  { href: '/dashboard/employe/chat', label: 'Messages', icon: MessageSquare },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/dashboard/admin/services', label: 'Services', icon: Package },
  { href: '/dashboard/admin/commandes', label: 'Commandes', icon: ShoppingCart },
  { href: '/dashboard/admin/devis', label: 'Devis', icon: FileText },
  { href: '/dashboard/admin/demandes-campagne', label: 'Demandes campagne', icon: Megaphone },
  { href: '/dashboard/admin/factures', label: 'Factures', icon: Receipt },
  { href: '/dashboard/admin/projets', label: 'Projets', icon: Briefcase },
  { href: '/dashboard/admin/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/admin/employes', label: 'Employés', icon: User },
  { href: '/dashboard/admin/realisations', label: 'Réalisations', icon: Image },
  { href: '/dashboard/admin/promotions', label: 'Promotions', icon: Gift },
  { href: '/dashboard/admin/avis', label: 'Avis clients', icon: Star },
  { href: '/dashboard/admin/chat', label: 'Messages', icon: MessageSquare },
]

export function DashboardLayout({ children, role }: { children: React.ReactNode; role: 'client' | 'employe' | 'admin' }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const navItems = role === 'admin' ? ADMIN_NAV : role === 'employe' ? EMPLOYE_NAV : CLIENT_NAV

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-escom-neutral-50">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-escom-neutral-200 transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b">
            <Logo size={36} />
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                    active ? 'bg-escom-blue-50 text-escom-blue-700' : 'text-escom-neutral-700 hover:bg-escom-neutral-100'
                  )}>
                  <item.icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-escom-gradient flex items-center justify-center text-white font-bold text-sm">
                {(user?.prenom?.[0] || user?.nom_complet?.[0] || 'U').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom_complet}
                </p>
                <p className="text-xs text-escom-neutral-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition">
              <LogOut size={18} /> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-escom-neutral-200 h-16 flex items-center px-4 lg:px-8">
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 mr-2">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-semibold capitalize">
            {pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ') || 'Tableau de bord'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  )
}

// ============================================================
// COMPOSANT NOTIFICATION BELL
// ============================================================

const ICON_BY_TYPE: Record<string, any> = {
  nouvelle_commande: ShoppingCart,
  statut_commande: Package,
  paiement: CreditCard,
  paiement_recu: CreditCard,
  message_chat: MessageSquare,
  nouveau_message: MessageSquare,
  nouveau_devis: FileText,
  devis_accepte: FileText,
  avis_publie: Star,
  livrable_pret: Package,
  rappel_paiement: Bell,
}

const COLOR_BY_TYPE: Record<string, string> = {
  nouvelle_commande: 'bg-blue-100 text-blue-600',
  statut_commande: 'bg-indigo-100 text-indigo-600',
  paiement: 'bg-green-100 text-green-600',
  paiement_recu: 'bg-green-100 text-green-600',
  message_chat: 'bg-purple-100 text-purple-600',
  nouveau_message: 'bg-purple-100 text-purple-600',
  nouveau_devis: 'bg-orange-100 text-orange-600',
  devis_accepte: 'bg-green-100 text-green-600',
  avis_publie: 'bg-yellow-100 text-yellow-600',
  livrable_pret: 'bg-emerald-100 text-emerald-600',
  rappel_paiement: 'bg-red-100 text-red-600',
}

function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Récupération du compteur au montage + polling 30s
  useEffect(() => {
    fetchUnreadCount()
    const id = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(id)
  }, [])

  const fetchUnreadCount = () => {
    api.get('/notifications/unread-count')
      .then((r: any) => setUnreadCount(r.data?.count ?? r.data?.unread_count ?? 0))
      .catch(() => {})
  }

  const fetchNotifications = () => {
    setLoading(true)
    api.get('/notifications')
      .then((r: any) => {
        const list = r.data?.data || r.data || []
        setNotifications(Array.isArray(list) ? list.slice(0, 15) : [])
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  const toggleOpen = () => {
    const next = !isOpen
    setIsOpen(next)
    if (next) fetchNotifications()
  }

  const isUnread = (notif: any): boolean => {
    return !notif.lu && !notif.lu_le && !notif.read_at
  }

  const handleNotifClick = async (notif: any) => {
    const idNotif = notif.id_notification || notif.id

    // Marquer comme lue
    if (isUnread(notif)) {
      try {
        await api.patch(`/notifications/${idNotif}/read`)
      } catch {}
      fetchUnreadCount()
    }

    // Naviguer si url_action
    if (notif.url_action) {
      router.push(notif.url_action)
    }
    setIsOpen(false)
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read')
      toast.success('Toutes les notifications marquées comme lues')
      setUnreadCount(0)
      fetchNotifications()
    } catch (e: any) {
      toast.error('Erreur')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cloche + Badge */}
      <button onClick={toggleOpen}
        className="relative p-2 hover:bg-escom-neutral-100 rounded-lg transition"
        title="Notifications">
        <Bell size={20} className={unreadCount > 0 ? 'text-escom-blue-600' : 'text-escom-neutral-600'} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[380px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-escom-neutral-200 overflow-hidden z-50">

            {/* Header */}
            <div className="p-4 bg-escom-gradient text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <Bell size={16} /> Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] rounded-full px-2 py-0.5">
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition inline-flex items-center gap-1">
                    <CheckCheck size={12} /> Tout marquer lu
                  </button>
                )}
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-escom-blue-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Inbox className="w-12 h-12 mx-auto text-escom-neutral-300 mb-3" />
                  <p className="text-sm font-semibold text-escom-neutral-700">Aucune notification</p>
                  <p className="text-xs text-escom-neutral-500 mt-1">
                    Vous êtes à jour ! 🎉
                  </p>
                </div>
              ) : (
                notifications.map((notif: any) => {
                  const unread = isUnread(notif)
                  const Icon = ICON_BY_TYPE[notif.declencheur] || Bell
                  const color = COLOR_BY_TYPE[notif.declencheur] || 'bg-escom-neutral-100 text-escom-neutral-600'

                  return (
                    <button key={notif.id_notification || notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={cn(
                        'w-full text-left p-3 border-b border-escom-neutral-100 hover:bg-escom-neutral-50 transition flex gap-3',
                        unread && 'bg-escom-blue-50/40'
                      )}>
                      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', color)}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-0.5">
                          <p className={cn('text-sm truncate flex-1', unread ? 'font-bold text-escom-neutral-900' : 'font-medium text-escom-neutral-700')}>
                            {notif.titre}
                          </p>
                          {unread && (
                            <span className="w-2 h-2 rounded-full bg-escom-blue-600 mt-1.5 shrink-0"></span>
                          )}
                        </div>
                        {notif.contenu && (
                          <p className="text-xs text-escom-neutral-600 line-clamp-2">{notif.contenu}</p>
                        )}
                        <p className="text-[10px] text-escom-neutral-400 mt-1">
                          {relativeTime(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t bg-escom-neutral-50 text-center">
                <Link href="/notifications" onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-escom-blue-600 hover:text-escom-blue-700 inline-block py-1.5">
                  Voir toutes les notifications →
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}