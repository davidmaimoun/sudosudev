import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { UserPlus, Users, RefreshCw, Trash2, FolderPlus, ChevronLeft } from 'lucide-react'
import { useAuth } from '../store/auth.js'
import { useAdmin } from '../store/admin.js'
import Shell from '../components/Shell.jsx'
import AdminProjectCard from '../components/AdminProjectCard.jsx'
import CreateClientModal from '../components/CreateClientModal.jsx'
import AddProjectModal from '../components/AddProjectModal.jsx'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const { clients, loading, loadClients, current, openClient, deleteClient, regenerateId } = useAdmin()
  const [showCreate, setShowCreate] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const nav = useNavigate()

  useEffect(() => { loadClients() }, [loadClients])

  async function doLogout() { await logout(); nav('/admin/login') }

  async function regen() {
    if (!confirm('Generate a NEW Client ID? The old one stops working immediately.')) return
    try {
      const cid = await regenerateId(current.email)
      toast.success(`New Client ID: ${cid}`, { duration: 10000 })
    } catch { toast.error('Could not regenerate.') }
  }

  async function removeClient() {
    if (!confirm(`Delete client ${current.email} and all their projects?`)) return
    try { await deleteClient(current.email); toast.success('Client deleted.') }
    catch { toast.error('Could not delete.') }
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-line">
        <h1 className="text-2xl font-bold tracking-tight">Admin <span className="text-em">dashboard</span></h1>
        <button onClick={doLogout}
          className="font-mono text-[.62rem] text-dim border border-linehi px-3.5 py-1.5 hover:border-sky hover:text-sky transition-colors">Log out</button>
      </div>

      {!current ? (
        /* ── client list ── */
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-mono text-[.7rem] text-dim tracking-wide">
              <Users size={15} className="text-sky" /> {clients.length} client{clients.length !== 1 ? 's' : ''}
            </div>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 font-mono text-[.65rem] tracking-wide text-sky border border-sky/60 bg-sky/5 px-3.5 py-2 hover:bg-sky/12 transition-colors">
              <UserPlus size={14} /> New client
            </button>
          </div>

          {loading ? (
            <div className="font-mono text-dim text-sm py-10 text-center">loading…</div>
          ) : clients.length === 0 ? (
            <div className="card p-8 text-dim text-sm text-center">No clients yet. Create your first one.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {clients.map((c) => (
                <button key={c.email} onClick={() => openClient(c.email)}
                  className="card p-5 text-left hover:border-linehi transition-colors group">
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky to-em opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="font-semibold">{c.name}</div>
                  <div className="font-mono text-[.62rem] text-dim mt-1">{c.email}</div>
                  <div className="font-mono text-[.58rem] text-faint mt-3 tracking-wide">
                    {c.projects} project{c.projects !== 1 ? 's' : ''} · {c.steps} steps
                  </div>
                </button>
              ))}
            </div>
          )}
          {showCreate && <CreateClientModal onClose={() => setShowCreate(false)} />}
        </>
      ) : (
        /* ── one client ── */
        <>
          <button onClick={() => useAdmin.setState({ current: null })}
            className="inline-flex items-center gap-1 font-mono text-[.62rem] text-dim hover:text-sky transition-colors mb-5">
            <ChevronLeft size={14} /> all clients
          </button>

          <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{current.name}</h2>
              <div className="font-mono text-[.62rem] text-dim mt-1">{current.email}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={regen} title="Regenerate Client ID"
                className="inline-flex items-center gap-1.5 font-mono text-[.6rem] text-dim border border-linehi px-3 py-2 hover:border-sky hover:text-sky transition-colors">
                <RefreshCw size={13} /> ID
              </button>
              <button onClick={removeClient}
                className="inline-flex items-center gap-1.5 font-mono text-[.6rem] text-dim border border-linehi px-3 py-2 hover:border-red-400 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
              <button onClick={() => setShowAddProject(true)}
                className="inline-flex items-center gap-2 font-mono text-[.62rem] tracking-wide text-em border border-em/60 bg-em/5 px-3.5 py-2 hover:bg-em/12 transition-colors">
                <FolderPlus size={14} /> Add project
              </button>
            </div>
          </div>

          {(current.projects || []).length === 0 ? (
            <div className="card p-8 text-dim text-sm text-center">No projects yet. Add the first one.</div>
          ) : (
            current.projects.map((p, pi) => (
              <AdminProjectCard key={pi} email={current.email} project={p} pi={pi} />
            ))
          )}

          {showAddProject && <AddProjectModal email={current.email} onClose={() => setShowAddProject(false)} />}
        </>
      )}
    </Shell>
  )
}
