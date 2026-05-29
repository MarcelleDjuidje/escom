'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { CommandeDetail } from '@/components/dashboard/commande-detail'

export default function EmployeCommandeDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout role="employe">
      <CommandeDetail commandeId={Number(params.id)} viewerRole="employe" />
    </DashboardLayout>
  )
}