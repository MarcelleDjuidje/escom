'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { CommandeDetail } from '@/components/dashboard/commande-detail'

export default function AdminCommandeDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout role="admin">
      <CommandeDetail commandeId={Number(params.id)} viewerRole="admin" />
    </DashboardLayout>
  )
}