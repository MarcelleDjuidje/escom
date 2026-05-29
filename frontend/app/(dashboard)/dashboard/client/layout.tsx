'use client'

import { RoleGuard } from '@/components/auth/role-guard'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="client">{children}</RoleGuard>
}