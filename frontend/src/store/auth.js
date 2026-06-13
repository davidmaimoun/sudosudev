import { create } from 'zustand'
import { api } from '../lib/api.js'

export const useAuth = create((set) => ({
  role: null,            // 'client' | 'admin' | null
  workspace: null,       // client workspace data
  loading: true,

  // restore an existing session on app load
  async init() {
    try {
      const { data } = await api.get('/me')
      set({ role: 'client', workspace: data, loading: false })
    } catch {
      set({ role: null, workspace: null, loading: false })
    }
  },

  async loginClient(email, clientId) {
    const { data } = await api.post('/login', { email, clientId })
    set({ role: 'client', workspace: data })
    return data
  },

  async loginAdmin(email, code) {
    await api.post('/admin/login', { email, code })
    set({ role: 'admin', workspace: null })
  },

  async logout() {
    try { await api.post('/logout') } catch {}
    set({ role: null, workspace: null })
  },

  clear() { set({ role: null, workspace: null }) },
}))
