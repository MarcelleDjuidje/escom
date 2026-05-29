'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ChatPanel } from '@/components/dashboard/chat-panel'

export default function ChatPage() {
  return (
    <DashboardLayout role="admin">
      <ChatPanel />
    </DashboardLayout>
  )
}
