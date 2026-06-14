import { create } from 'zustand'
import { api } from '../lib/api.js'

export const useAuth = create((set) => ({
  role: null,            // 'client' | 'admin' | null
  workspace: null,       // client workspace data
  loading: true,

  // restore an existing session on app load (client OR admin)
  async init() {
    try {
      const { data } = await api.get('/me')
      set({ role: 'client', workspace: data, loading: false })
      return
    } catch {}
    try {
      await api.get('/admin/me')
      set({ role: 'admin', workspace: null, loading: false })
      return
    } catch {}
    set({ role: null, workspace: null, loading: false })
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

  // client checks/unchecks one of their own substeps (notifies admin server-side)
  async toggleSubstep(pi, si, bi, done, clientNote) {
    const { data } = await api.patch(`/me/projects/${pi}/steps/${si}/substeps/${bi}`, { done, clientNote })
    // refresh workspace
    const me = await api.get('/me')
    set({ workspace: me.data })
    return data?.mailed === true
  },

  clear() { set({ role: null, workspace: null }) },

  // recovery (no auth)
  async recoverRequest(email) {
    const { data } = await api.post('/recover/request', { email })
    return data?.ttlMin || 10
  },
  async recoverConfirm(email, token) {
    const { data } = await api.post('/recover/confirm', { email, token })
    return data   // { clientId, emailed }
  },
}))