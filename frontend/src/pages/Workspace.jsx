import { useNavigate } from 'react-router-dom'
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

  async function doLogout() { await logout(); nav('/login') }

  return (
    <Shell>
      <div className="mb-9 pb-6 border-b border-line">
        <div className="text-2xl font-bold tracking-tight">Welcome, <span className="text-sky">{workspace.client?.name}</span></div>
        <div className="font-mono text-[.65rem] text-dim mt-2 tracking-wide">
          {projects.length} project{projects.length > 1 ? 's' : ''} · {done}/{total} steps completed
        </div>
        <button onClick={doLogout}
          className="mt-4 font-mono text-[.62rem] text-dim border border-linehi px-3.5 py-1.5
                     hover:border-sky hover:text-sky transition-colors">Log out</button>
      </div>

      {projects.map((p, i) => <ProjectCard key={i} project={p} />)}

      <div className="font-mono text-[.58rem] text-faint mt-8 text-center tracking-wide">
        sudosudev · your projects, updated as we build.
      </div>
    </Shell>
  )
}
