'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Bienvenue ${user.prenom || user.nom_complet} !`)

      // Destination par défaut selon le rôle
      const defaultDest = user.is_staff
        ? (user.role === 'admin' || user.role === 'directeur' ? '/dashboard/admin' : '/dashboard/employe')
        : '/dashboard/client'

      // Si l'utilisateur essayait d'accéder à une URL spécifique avant le login, on l'y renvoie
      // SI son rôle l'autorise (sinon on respecte la destination par défaut)
      let finalDest = defaultDest
      const redirectAfterLogin = sessionStorage.getItem('escom_redirect_after_login')
      sessionStorage.removeItem('escom_redirect_after_login')

      if (redirectAfterLogin) {
        const isAllowed = user.is_staff
          ? (user.role === 'admin' || user.role === 'directeur'
              ? redirectAfterLogin.startsWith('/dashboard/admin')
              : redirectAfterLogin.startsWith('/dashboard/employe'))
          : redirectAfterLogin.startsWith('/dashboard/client')
        if (isAllowed) finalDest = redirectAfterLogin
      }

      router.push(finalDest)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Identifiants incorrects'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold mb-2">Connexion</h1>
      <p className="text-escom-neutral-600 mb-8">Accédez à votre espace ESCOM</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-semibold mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
            <input
              type="email" required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-escom pl-10"
              placeholder="vous@exemple.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
            <input
              type={showPwd ? 'text' : 'password'} required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-escom pl-10 pr-10"
              placeholder="Votre mot de passe"
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-escom-neutral-400 hover:text-escom-neutral-700">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-escom-neutral-600">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-escom-blue-600 font-semibold hover:underline">Créer un compte</Link>
      </p>

      {/* <div className="mt-8 p-4 bg-escom-gold-50 border border-escom-gold-200 rounded-lg text-xs text-escom-gold-900">
        <strong>Compte admin de démonstration :</strong><br />
        Email : <code>admin@escom.cm</code><br />
        Mot de passe : <code>Admin@2026</code>
      </div> */}
    </motion.div>
  )
}