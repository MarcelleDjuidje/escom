'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'
import { useAuth, type Role } from '@/lib/auth-context'

export type AllowedAudience = 'client' | 'employe' | 'admin' | 'authenticated'

interface RoleGuardProps {
  allow: AllowedAudience
  children: React.ReactNode
}

/**
 * Composant qui protège une zone selon le rôle.
 * - 'authenticated' : doit être connecté (n'importe quel rôle)
 * - 'client'        : doit être un client (is_staff = false)
 * - 'employe'       : doit être un employé non-admin
 * - 'admin'         : doit être admin OU directeur
 */
export function RoleGuard({ allow, children }: RoleGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    // Attendre que le contexte ait fini de charger localStorage
    if (loading) return

    // 1. Pas connecté → login (en mémorisant l'URL voulue)
    if (!user) {
      sessionStorage.setItem('escom_redirect_after_login', pathname)
      router.replace('/login')
      return
    }

    // 2. Vérification du rôle
    const hasAccess = checkAccess(user, allow)

    if (!hasAccess) {
      // Rediriger vers le dashboard correspondant à son rôle
      const fallback = getFallbackUrl(user)
      router.replace(fallback)
      return
    }

    // 3. Accès accordé
    setVerified(true)
  }, [user, loading, allow, pathname, router])

  // Loader pendant la vérification
  if (loading || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-escom-neutral-50">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-escom-gradient flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <Loader2 className="absolute inset-0 m-auto w-20 h-20 text-escom-blue-200 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-escom-neutral-700">Vérification de votre accès…</p>
          <p className="text-xs text-escom-neutral-400 mt-1">Veuillez patienter</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function checkAccess(user: { is_staff?: boolean; role?: Role }, allow: AllowedAudience): boolean {
  switch (allow) {
    case 'authenticated':
      return true
    case 'client':
      return !user.is_staff
    case 'employe':
      // Employé non-admin (designers, imprimeurs, chefs de projet, commerciaux)
      return user.is_staff === true && !['admin', 'directeur'].includes(user.role || '')
    case 'admin':
      return user.is_staff === true && ['admin', 'directeur'].includes(user.role || '')
    default:
      return false
  }
}

function getFallbackUrl(user: { is_staff?: boolean; role?: Role }): string {
  if (!user.is_staff) return '/dashboard/client'
  if (['admin', 'directeur'].includes(user.role || '')) return '/dashboard/admin'
  return '/dashboard/employe'
}