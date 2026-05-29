import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
})

// Auto-injection du token Sanctum
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('escom_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-redirect 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register') && path.startsWith('/dashboard')) {
        localStorage.removeItem('escom_token')
        localStorage.removeItem('escom_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const fileUrl = (path?: string | null) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = API_URL.replace('/api', '')
  return `${base}/storage/${path.replace(/^\/+/, '')}`
}
