'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from './api'

export type Role =
  | 'client'
  | 'commercial'
  | 'designer'
  | 'chef_projet'
  | 'imprimeur'
  | 'admin'
  | 'directeur'

export interface AuthUser {
  id: number
  nom_complet?: string
  nom?: string
  prenom?: string
  email: string
  role: Role
  is_staff: boolean
  type_client?: string
  raison_sociale?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (data: any) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem('escom_user')
        : null

    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {}
    }

    setLoading(false)

  }, [])

  // =========================
  // LOGIN
  // =========================
  const login = async (email: string, password: string) => {

    const res = await api.post('/auth/login', {
      email,
      password
    })

    const {
      token,
      user: u,
      role,
      is_staff
    } = res.data

    const fullUser: AuthUser = {
      ...u,
      role,
      is_staff
    }

    localStorage.setItem('escom_token', token)

    localStorage.setItem(
      'escom_user',
      JSON.stringify(fullUser)
    )

    setUser(fullUser)

    return fullUser
  }

  // =========================
  // REGISTER
  // =========================
  const register = async (data: any) => {

    const res = await api.post('/auth/register', data)

    const {
      token,
      user: u,
      role,
      is_staff
    } = res.data

    const fullUser: AuthUser = {
      ...u,
      role,
      is_staff
    }

    localStorage.setItem('escom_token', token)

    localStorage.setItem(
      'escom_user',
      JSON.stringify(fullUser)
    )

    setUser(fullUser)

    return fullUser
  }

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {

    try {
      await api.post('/auth/logout')
    } catch {}

    localStorage.removeItem('escom_token')
    localStorage.removeItem('escom_user')

    setUser(null)
  }

  // =========================
  // REFRESH USER
  // =========================
  const refresh = async () => {

    try {

      const res = await api.get('/auth/me')

      const fullUser: AuthUser = {
        ...res.data.user,
        role: res.data.role,
        is_staff: res.data.is_staff
      }

      setUser(fullUser)

      localStorage.setItem(
        'escom_user',
        JSON.stringify(fullUser)
      )

    } catch {

      setUser(null)

      localStorage.removeItem('escom_token')
      localStorage.removeItem('escom_user')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {

  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}