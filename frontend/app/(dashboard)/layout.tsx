'use client'

import { RoleGuard } from '@/components/auth/role-guard'

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="authenticated">{children}</RoleGuard>
}