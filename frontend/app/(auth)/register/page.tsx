'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, User, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [type, setType] = useState<'particulier' | 'entreprise'>('particulier')
  const [data, setData] = useState({
    nom_complet: '', raison_sociale: '', email: '', telephone: '',
    ville: 'Douala', secteur_activite: '', adresse: '',
    password: '', password_confirmation: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const update = (k: string, v: string) => setData({ ...data, [k]: v })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (data.password !== data.password_confirmation) {
      setErrors({ password_confirmation: ['Les mots de passe ne correspondent pas'] })
      return
    }
    setLoading(true)
    try {
      await register({ type_client: type, ...data })
      toast.success('Compte créé ! Bienvenue chez ESCOM.')
      router.push('/dashboard/client')
    } catch (err: any) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
      else toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
      <p className="text-escom-neutral-600 mb-6">Rejoignez ESCOM en quelques secondes</p>

      <div className="flex gap-2 mb-6 p-1 bg-escom-neutral-100 rounded-xl">
        <button type="button" onClick={() => setType('particulier')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition ${
            type === 'particulier' ? 'bg-white shadow text-escom-blue-700' : 'text-escom-neutral-600'
          }`}>
          <User size={16} /> Particulier
        </button>
        <button type="button" onClick={() => setType('entreprise')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition ${
            type === 'entreprise' ? 'bg-white shadow text-escom-blue-700' : 'text-escom-neutral-600'
          }`}>
          <Building2 size={16} /> Entreprise
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nom complet *" value={data.nom_complet} onChange={v => update('nom_complet', v)} error={errors.nom_complet} />
          {type === 'entreprise' && (
            <Field label="Raison sociale *" value={data.raison_sociale} onChange={v => update('raison_sociale', v)} error={errors.raison_sociale} />
          )}
          {type === 'particulier' && <div />}
        </div>
        <Field label="Email *" type="email" value={data.email} onChange={v => update('email', v)} error={errors.email} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone *" value={data.telephone} onChange={v => update('telephone', v)} error={errors.telephone} placeholder="+237..." />
          <Field label="Ville" value={data.ville} onChange={v => update('ville', v)} />
        </div>
        {type === 'entreprise' && <Field label="Secteur d'activité" value={data.secteur_activite} onChange={v => update('secteur_activite', v)} />}

        <div>
          <label className="text-sm font-semibold mb-1.5 block">Mot de passe *</label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} required minLength={8}
              value={data.password} onChange={e => update('password', e.target.value)}
              className="input-escom pr-10" placeholder="8 caractères minimum" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-escom-neutral-400">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password[0]}</p>}
        </div>

        <Field label="Confirmer le mot de passe *" type="password" value={data.password_confirmation}
          onChange={v => update('password_confirmation', v)} error={errors.password_confirmation} />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-escom-neutral-600">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-escom-blue-600 font-semibold hover:underline">Se connecter</Link>
      </p>
    </motion.div>
  )
}

function Field({ label, value, onChange, error, type = 'text', placeholder }: any) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block">{label}</label>
      <input type={type} required={label.includes('*')} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-escom" />
      {error && <p className="text-xs text-red-600 mt-1">{error[0]}</p>}
    </div>
  )
}
