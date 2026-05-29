import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-1 bg-escom-gradient relative overflow-hidden p-12 flex-col justify-between text-white">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 30% 30%, #d4af37 0%, transparent 50%)'
        }} />
        <div className="relative">
          <div className="bg-white/10 backdrop-blur p-3 rounded-xl inline-block">
            <Logo size={48} withText />
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold mb-4 text-balance">Bienvenue dans votre espace ESCOM</h2>
          <p className="text-escom-blue-100 text-lg max-w-md">
            Suivez vos projets, échangez avec votre équipe, téléchargez vos livrables — tout en un seul endroit.
          </p>
        </div>
        <div className="relative text-sm text-escom-blue-200 italic">— La Communication à l'ère du digital</div>
      </aside>
      <main className="flex-1 flex flex-col bg-white">
        <div className="p-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-escom-neutral-600 hover:text-escom-blue-600 transition">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  )
}
