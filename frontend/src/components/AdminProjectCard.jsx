import { useState } from 'react'
import { Check, LoaderCircle, Circle, Trash2, Pencil, Plus, X } from 'lucide-react'
import { useAdmin } from '../store/admin.js'
import NotifyModal from './NotifyModal.jsx'

const OPTS = [
  { key: 'todo',        label: 'Not started', Icon: Circle,       on: 'border-faint text-faint' },
  { key: 'in_progress', label: 'In progress', Icon: LoaderCircle, on: 'border-sky text-sky bg-sky/10' },
  { key: 'done',        label: 'Done',        Icon: Check,        on: 'border-em text-em bg-em/10' },
]

function StatusToggles({ status, onPick }) {
  return (
    <div className="flex gap-1.5">
      {OPTS.map(({ key, label, Icon, on }) => {
        const active = status === key
        return (
          <button key={key} title={label} onClick={() => !active && onPick(key)}
            className={`grid place-items-center w-7 h-7 rounded-full border transition-colors
              ${active ? on : 'border-line text-faint/50 hover:text-dim hover:border-linehi'}`}>
            <Icon size={13} />
          </button>
        )
      })}
    </div>
  )
}

function StepRow({ email, pi, si, step }) {
  const { updateStep, deleteStep } = useAdmin()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(null)   // status awaiting notify-confirmation
  const [title, setTitle] = useState(step.title)
  const [eta, setEta] = useState(step.eta || '')

  async function save() {
    if (!title.trim()) return
    await updateStep(email, pi, si, { title, eta })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[.6rem] text-faint w-5 text-right">{si + 1}.</span>
        <input className="input flex-1 min-w-[140px]" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <input className="input w-28" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="eta" />
        <button onClick={save} className="grid place-items-center w-7 h-7 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
        <button onClick={() => { setEditing(false); setTitle(step.title); setEta(step.eta || '') }}
          className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-dim"><X size={14} /></button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 flex-wrap group">
      <span className="font-mono text-[.6rem] text-faint w-5 text-right">{si + 1}.</span>
      <span className={`flex-1 min-w-[140px] text-sm ${step.status === 'todo' ? 'text-dim' : ''}`}>{step.title}</span>
      {step.eta && <span className="font-mono text-[.58rem] text-faint">~ {step.eta}</span>}
      <StatusToggles status={step.status} onPick={(s) => setPending(s)} />
      <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} title="Edit"
          className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-sky hover:border-sky transition-colors"><Pencil size={12} /></button>
        <button onClick={() => { if (confirm('Delete this step?')) deleteStep(email, pi, si) }} title="Delete"
          className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-red-400 hover:border-red-400/50 transition-colors"><Trash2 size={12} /></button>
      </div>
      {pending && (
        <NotifyModal email={email} pi={pi} si={si} step={step} status={pending}
                     onClose={() => setPending(null)} />
      )}
    </div>
  )
}

function AddStep({ email, pi }) {
  const addStep = useAdmin((s) => s.addStep)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [eta, setEta] = useState('')

  async function submit() {
    if (!title.trim()) return
    await addStep(email, pi, { title, eta })
    setTitle(''); setEta(''); setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 font-mono text-[.62rem] text-dim hover:text-sky transition-colors mt-1">
        <Plus size={13} /> add step
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2 flex-wrap mt-1">
      <span className="w-5" />
      <input className="input flex-1 min-w-[140px]" placeholder="Step title" value={title}
             onChange={(e) => setTitle(e.target.value)} autoFocus
             onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <input className="input w-28" placeholder="eta" value={eta} onChange={(e) => setEta(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <button onClick={submit} className="grid place-items-center w-7 h-7 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
      <button onClick={() => { setOpen(false); setTitle(''); setEta('') }} className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-dim"><X size={14} /></button>
    </div>
  )
}

export default function AdminProjectCard({ email, project, pi }) {
  const deleteProject = useAdmin((s) => s.deleteProject)
  const done = project.steps.filter((s) => s.status === 'done').length
  const pct = project.steps.length ? Math.round((done / project.steps.length) * 100) : 0

  return (
    <div className="card p-6 mb-5">
      <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-sky to-em" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
          {project.description && <p className="text-[.85rem] text-dim mt-1">{project.description}</p>}
          <div className="font-mono text-[.6rem] text-faint mt-2 tracking-wider">{done}/{project.steps.length} · {pct}%</div>
        </div>
        <button onClick={() => { if (confirm('Delete this project?')) deleteProject(email, pi) }}
          className="grid place-items-center w-8 h-8 border border-line text-faint hover:text-red-400 hover:border-red-400/50 transition-colors shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-5 space-y-2.5">
        {project.steps.map((s, si) => (
          <StepRow key={si} email={email} pi={pi} si={si} step={s} />
        ))}
        <AddStep email={email} pi={pi} />
      </div>
    </div>
  )
}
