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

  async createClient(payload) {
    const { data } = await api.post('/admin/clients', payload)
    await get().loadClients()
    return data            // { email, clientId }  <-- shown once
  },

  async updateClient(email, fields) {
    await api.patch(`/admin/clients/${encodeURIComponent(email)}`, fields)
    await get().openClient(email)
    await get().loadClients()
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
    const { data } = await api.post(`/admin/clients/${encodeURIComponent(email)}/projects`, project)
    await get().openClient(email)
    return data?.mailed === true
  },

  async addPayment(email, pi, payment) {
    await api.post(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/payments`, payment)
    await get().openClient(email)
  },

  async updatePayment(email, pi, idx, fields) {
    await api.patch(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/payments/${idx}`, fields)
    await get().openClient(email)
  },

  async deletePayment(email, pi, idx) {
    await api.delete(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/payments/${idx}`)
    await get().openClient(email)
  },

  async remindPayment(email, pi, idx) {
    const { data } = await api.post(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/payments/${idx}/remind`)
    return data?.mailed === true
  },

  async updateProject(email, pi, fields) {
    await api.patch(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}`, fields)
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

  async addSubstep(email, pi, si, sub) {
    await api.post(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps/${si}/substeps`, sub)
    await get().openClient(email)
  },

  async updateSubstep(email, pi, si, bi, fields) {
    await api.patch(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps/${si}/substeps/${bi}`, fields)
    await get().openClient(email)
  },

  async deleteSubstep(email, pi, si, bi) {
    await api.delete(`/admin/clients/${encodeURIComponent(email)}/projects/${pi}/steps/${si}/substeps/${bi}`)
    await get().openClient(email)
  },
}))