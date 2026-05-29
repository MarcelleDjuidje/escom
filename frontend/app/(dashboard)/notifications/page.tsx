'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, Check, Loader2, ArrowLeft, CheckCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { relativeTime } from '@/lib/utils'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data?.data || res.data || [])
    } catch {
      setNotifications([])
    }
    setLoading(false)
  }

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(notifications.map(n =>
        n.id_notification === id ? { ...n, lu: true, lu_le: new Date().toISOString() } : n
      ))
    } catch {
      toast.error('Erreur')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read')
      toast.success('Toutes les notifications marquées comme lues')
      fetchData()
    } catch {
      toast.error('Erreur')
    }
  }

  const goBack = () => {
    if (!user) return router.push('/')
    if (user.is_staff) {
      router.push(user.role === 'admin' || user.role === 'directeur' ? '/dashboard/admin' : '/dashboard/employe')
    } else {
      router.push('/dashboard/client')
    }
  }

  return (
    <div className="min-h-screen bg-escom-neutral-50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={goBack} className="p-2 hover:bg-white rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="text-escom-blue-600" /> Notifications
            </h1>
            <p className="text-sm text-escom-neutral-500">
              {notifications.filter(n => !n.lu).length} non lue(s) sur {notifications.length}
            </p>
          </div>
          {notifications.some(n => !n.lu) && (
            <button onClick={markAllAsRead} className="btn-outline text-sm">
              <CheckCheck size={16} /> Tout marquer comme lu
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-escom-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card-escom p-12 text-center">
            <Bell className="w-16 h-16 text-escom-neutral-300 mx-auto mb-4" />
            <p className="text-escom-neutral-500">Aucune notification pour le moment.</p>
            <p className="text-xs text-escom-neutral-400 mt-1">
              Vous serez averti(e) ici en cas de nouvelle activité sur votre compte.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any, i: number) => (
              <motion.div
                key={n.id_notification}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card-escom p-4 flex items-start gap-3 ${!n.lu ? 'border-l-4 border-l-escom-blue-500' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  !n.lu ? 'bg-escom-blue-100 text-escom-blue-600' : 'bg-escom-neutral-100 text-escom-neutral-500'
                }`}>
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${!n.lu ? 'text-escom-neutral-900' : 'text-escom-neutral-600'}`}>
                    {n.titre || 'Notification'}
                  </p>
                  {n.message && (
                    <p className="text-sm text-escom-neutral-600 mt-1">{n.message}</p>
                  )}
                  <p className="text-xs text-escom-neutral-400 mt-2">
                    {relativeTime(n.created_at || n.envoye_le)}
                  </p>
                </div>
                {!n.lu && (
                  <button onClick={() => markAsRead(n.id_notification)}
                    className="text-escom-blue-600 hover:bg-escom-blue-50 p-2 rounded-lg shrink-0"
                    title="Marquer comme lu">
                    <Check size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}