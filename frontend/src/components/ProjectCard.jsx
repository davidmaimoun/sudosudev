import Step from './StatusNode.jsx'

export default function ProjectCard({ project }) {
  const done = project.steps.filter((s) => s.status === 'done').length
  const pct = project.steps.length ? Math.round((done / project.steps.length) * 100) : 0
  return (
    <div className="card p-7 mb-6">
      <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-sky to-em" />
      <h3 className="text-xl font-semibold tracking-tight">{project.name}</h3>
      {project.description && <p className="text-[.88rem] text-dim mt-2 leading-relaxed">{project.description}</p>}
      <div className="font-mono text-[.6rem] text-faint mt-3 tracking-wider">
        {done}/{project.steps.length} steps · {pct}%
      </div>
      <div className="mt-6">
        {project.steps.map((s, i) => (
          <Step key={i} step={s} isLast={i === project.steps.length - 1} />
        ))}
      </div>
    </div>
  )
}
