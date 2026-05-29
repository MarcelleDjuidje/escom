'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/services', label: 'Services' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/processus', label: 'Processus' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/faq', label: 'FAQ' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dashHref = user ? (user.is_staff ? (user.role === 'admin' || user.role === 'directeur' ? '/dashboard/admin' : '/dashboard/employe') : '/dashboard/client') : '/login'

  return (
    <header className={cn(
      'fixed top-0 inset-x-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-white/90'
    )}>
      <div className="container-escom">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Logo size={42} />

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="text-sm font-medium text-escom-neutral-700 hover:text-escom-blue-600 transition relative group">
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-escom-gold-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link href={dashHref} className="btn-primary">
                Mon espace <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-escom-neutral-700 hover:text-escom-blue-600 transition">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Inscription
                </Link>
              </>
            )}
          </div>

          <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden border-t py-4 space-y-2"
            >
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="block py-2 px-3 rounded-lg hover:bg-escom-neutral-100 font-medium">
                  {l.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3 space-y-2">
                {user ? (
                  <Link href={dashHref} className="btn-primary w-full" onClick={() => setOpen(false)}>
                    Mon espace
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="btn-outline w-full" onClick={() => setOpen(false)}>Connexion</Link>
                    <Link href="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>Inscription</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
