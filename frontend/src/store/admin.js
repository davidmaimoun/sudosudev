import { create } from 'zustand'
import { api } from '../lib/api.js'

// admin data store: client list + the currently opened client
export const useAdmin = create((set, get) => ({
  clients: [],
  loading: false,
  current: null,        // { name, email, projects: [...] }

  async loadClients() {
    set({ loading: true })
    try {
      const { data } = await api.get('/admin/clients')
      set({ clients: data.clients, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  async createClient(name, email) {
    const { data } = await api.post('/admin/clients', { name, email })
    await get().loadClients()
    return data            // { email, clientId }  <-- shown once
  },

  async deleteClient(email) {
    await api.delete(`/admin/clients/${encodeURIComponent(email)}`)
    set({ current: null })
    await get().loadClients()
  },

  async openClient(email) {
    const { data } = await api.get(`/admin/clients/${encodeURIComponent(email)}`)
    set({ current: data })
  },

  async regenerateId(email) {
    const { data } = await api.post(`/admin/clients/${encodeURIComponent(email)}/regenerate-id`)
    return data.clientId
  },

  async addProject(email, project) {
    await api.post(`/admin/clients/${encodeURIComponent(email)}/projects`, project)
    await get().openClient(email)
  },

  async deleteProject(email, pi) {
    await api.delete(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}`)
    await get().openClient(email)
  },

  async setStatus(email, pi, si, status, notify = false) {
    const { data } = await api.patch(
      `/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps/${si}`,
      { status, notify })
    await get().openClient(email)
    return data?.mailed === true
  },

  async addStep(email, pi, step) {
    await api.post(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps`, step)
    await get().openClient(email)
  },

  async updateStep(email, pi, si, fields) {
    await api.patch(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps/${si}`, fields)
    await get().openClient(email)
  },

  async deleteStep(email, pi, si) {
    await api.delete(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps/${si}`)
    await get().openClient(email)
  },
}))
