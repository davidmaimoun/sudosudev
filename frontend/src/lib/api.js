import axios from 'axios'
import { useAuth } from '../store/auth.js'

// In dev, Vite proxies /api -> http://localhost:8000.
// In prod, nginx serves /api on the same origin.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// auto-logout on 401 (except on the login calls themselves)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err?.config?.url || ''
    if (err?.response?.status === 401 && !url.includes('login')) {
      useAuth.getState().clear()
    }
    return Promise.reject(err)
  }
)
