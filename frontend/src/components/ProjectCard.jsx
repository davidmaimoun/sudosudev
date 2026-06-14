import Step from './StatusNode.jsx'
import { ExternalLink } from 'lucide-react'

export default function ProjectCard({ project, pi = 0 }) {
  const done = project.steps.filter((s) => s.status === 'done').length
  const pct = project.steps.length ? Math.round((done / project.steps.length) * 100) : 0
  return (
    <div className="card p-7 mb-6">
      <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-sky to-em" />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold tracking-tight">{project.name}</h3>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[.62rem] tracking-wide text-em
                       border border-em/50 bg-em/5 px-3 py-1.5 hover:bg-em/12 transition-colors">
            <ExternalLink size={13} /> View live site
          </a>
        )}
      </div>
      {project.description && <p className="text-[.88rem] text-dim mt-2 leading-relaxed">{project.description}</p>}
      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[.6rem] text-faint tracking-wider mb-1.5">
          <span>{done}/{project.steps.length} steps</span>
          <span className="text-sky">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(86,207,252,.12)' }}>
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#56cffc,#2dd4a0)' }} />
        </div>
      </div>
      <div className="mt-6">
        {project.steps.map((s, i) => (
          <Step key={i} step={s} pi={pi} si={i} isLast={i === project.steps.length - 1} />
        ))}
      </div>
    </div>
  )
}