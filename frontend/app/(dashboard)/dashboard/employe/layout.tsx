'use client'

import { RoleGuard } from '@/components/auth/role-guard'

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allow="employe">{children}</RoleGuard>
}