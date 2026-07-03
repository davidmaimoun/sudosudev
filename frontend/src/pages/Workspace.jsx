import { useNavigate } from 'react-router-dom'
import { UserRound, ArrowRight } from 'lucide-react'
import { useAuth } from '../store/auth.js'
import Shell from '../components/Shell.jsx'
import ProjectCard from '../components/ProjectCard.jsx'

export default function Workspace() {
  const { workspace, logout } = useAuth()
  const nav = useNavigate()
  if (!workspace) return null

  const projects = workspace.projects || []
  const total = projects.reduce((n, p) => n + p.steps.length, 0)
  const done = projects.reduce((n, p) => n + p.steps.filter((s) => s.status === 'done').length, 0)
  const pct = total ? Math.round((done / total) * 100) : 0

  // collect everything that requires the client's action
  const todos = []
  projects.forEach((p) => {
    p.steps.forEach((s) => {
      if (s.needsClient && s.status !== 'done')
        todos.push({ project: p.name, label: s.title, kind: 'step' })
      ;(s.substeps || []).forEach((b) => {
        if (b.owner === 'client' && !b.done)
          todos.push({ project: p.name, label: b.title, kind: 'task' })
      })
    })
  })

  async function doLogout() { await logout(); nav('/login') }

  return (
    <Shell>
      <div className="mb-8 pb-6 border-b border-line">
        <div className="text-2xl font-bold tracking-tight">Welcome, <span className="text-sky">{workspace.client?.name}</span></div>
        <div className="font-mono text-[.65rem] text-dim mt-2 tracking-wide">
          {projects.length} project{projects.length > 1 ? 's' : ''} · {done}/{total} steps completed
        </div>

        {/* overall progress */}
        <div className="mt-4 max-w-md">
          <div className="flex items-center justify-between font-mono text-[.58rem] text-faint tracking-wider mb-1.5">
            <span>overall progress</span><span className="text-sky">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(86,207,252,.12)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#56cffc,#2dd4a0)' }} />
          </div>
        </div>

        <button onClick={doLogout}
          className="mt-5 font-mono text-[.62rem] text-dim border border-linehi px-3.5 py-1.5
                     hover:border-sky hover:text-sky transition-colors">Log out</button>
      </div>

      {/* what needs the client's attention */}
      {todos.length > 0 && (
        <div className="mb-8 card p-5 border-rose-400/30">
          <div className="flex items-center gap-2 font-mono text-[.65rem] tracking-wide text-rose-300 uppercase mb-3">
            <UserRound size={14} /> Needs your attention ({todos.length})
          </div>
          <ul className="space-y-2">
            {todos.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[.85rem]">
                <ArrowRight size={14} className="text-rose-300 mt-0.5 shrink-0" />
                <span>{t.label}<span className="text-faint font-mono text-[.6rem] ml-2">· {t.project}</span></span>
              </li>
            ))}
          </ul>
          <p className="text-[.72rem] text-dim mt-3">Check the matching step below to mark it done once handled.</p>
        </div>
      )}

      {projects.map((p, i) => <ProjectCard key={i} project={p} pi={i} bank={workspace.bank || {}} />)}

      <div className="font-mono text-[.58rem] text-faint mt-8 text-center tracking-wide">
        sudosudev · your projects, updated as we build.
      </div>
    </Shell>
  )
}