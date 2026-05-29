import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'ESCOM — La Communication à l\'ère du digital',
  description: 'Agence de communication 360° à Douala, Yaoundé et Bafoussam. Conception graphique, impression, social media, campagnes marketing.',
  keywords: ['communication', 'agence Cameroun', 'Douala', 'Yaoundé', 'Bafoussam', 'graphisme', 'impression', 'social media', 'marketing'],
  openGraph: {
    title: 'ESCOM — Agence de communication 360°',
    description: 'La communication à l\'ère du digital',
    locale: 'fr_FR',
    type: 'website',
  },
  icons: { icon: '/assets/images/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  )
}
