'use client'

import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function ClientProfil() {
  const { user } = useAuth()
  return (
    <DashboardLayout role="client">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mon profil</h1>
      </div>
      <div className="card-escom p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-20 h-20 rounded-full bg-escom-gradient flex items-center justify-center text-white text-2xl font-bold">
            {user?.nom_complet?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.nom_complet}</h2>
            <p className="text-escom-neutral-500">{user?.email}</p>
            {(user as any)?.raison_sociale && <p className="text-sm font-medium text-escom-blue-700">{(user as any).raison_sociale}</p>}
          </div>
        </div>
        <dl className="space-y-3">
          <div className="flex justify-between"><dt className="text-escom-neutral-500">Type</dt><dd className="font-medium capitalize">{(user as any)?.type_client}</dd></div>
          <div className="flex justify-between"><dt className="text-escom-neutral-500">Email</dt><dd className="font-medium">{user?.email}</dd></div>
        </dl>
      </div>
    </DashboardLayout>
  )
}
