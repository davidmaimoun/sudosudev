import { useState } from 'react'
import { Check, LoaderCircle, Circle, Trash2, Pencil, Plus, X, StickyNote, UserRound,
         Wrench, Square, CheckSquare, ListPlus, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { useAdmin } from '../store/admin.js'
import { toast } from 'sonner'
import NotifyModal from './NotifyModal.jsx'
import ActionNotifyModal from './ActionNotifyModal.jsx'
import BillingCard from './BillingCard.jsx'

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
  const [noteEditing, setNoteEditing] = useState(false)
  const [pending, setPending] = useState(null)   // status awaiting notify-confirmation
  const [flagging, setFlagging] = useState(false) // step-action notify modal
  const [title, setTitle] = useState(step.title)
  const [eta, setEta] = useState(step.eta || '')
  const [note, setNote] = useState(step.note || '')

  async function save() {
    if (!title.trim()) return
    await updateStep(email, pi, si, { title, eta })
    setEditing(false)
  }

  async function saveNote() {
    await updateStep(email, pi, si, { note })
    setNoteEditing(false)
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
    <div className={step.needsClient ? 'border-l-2 border-rose-400/60 pl-2 -ml-2' : ''}>
      <div className="flex items-center gap-3 flex-wrap group">
        <span className="font-mono text-[.6rem] text-faint w-5 text-right">{si + 1}.</span>
        <span className={`flex-1 min-w-[140px] text-sm ${step.status === 'todo' ? 'text-dim' : ''}`}>
          {step.title}
          {step.needsClient && (
            <span className="ml-2 inline-flex items-center gap-1 font-mono text-[.5rem] tracking-wide uppercase
                             text-rose-300 border border-rose-400/50 bg-rose-400/10 px-1.5 py-[2px] align-middle">
              <UserRound size={9} /> client action
            </span>
          )}
        </span>
        {step.eta && <span className="font-mono text-[.58rem] text-faint">~ {step.eta}</span>}
        <StatusToggles status={step.status} onPick={(s) => setPending(s)} />
        <div className="flex gap-1 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => step.needsClient ? updateStep(email, pi, si, { needsClient: false }) : setFlagging(true)}
            title={step.needsClient ? 'Remove client-action flag' : 'Mark as needing client action'}
            className={`grid place-items-center w-7 h-7 border transition-colors
              ${step.needsClient ? 'border-rose-400/60 text-rose-300' : 'border-line text-faint hover:text-rose-300 hover:border-rose-400/50'}`}>
            <UserRound size={12} />
          </button>
          <button onClick={() => { setNote(step.note || ''); setNoteEditing(!noteEditing) }}
            title={step.note ? 'Edit note' : 'Add note'}
            className={`grid place-items-center w-7 h-7 border transition-colors
              ${step.note ? 'border-amber/50 text-amber' : 'border-line text-faint hover:text-amber hover:border-amber/50'}`}>
            <StickyNote size={12} />
          </button>
          <button onClick={() => setEditing(true)} title="Edit"
            className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-sky hover:border-sky transition-colors"><Pencil size={12} /></button>
          <button onClick={() => { if (confirm('Delete this step?')) deleteStep(email, pi, si) }} title="Delete"
            className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-red-400 hover:border-red-400/50 transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>

      {/* note editor */}
      {noteEditing && (
        <div className="flex items-start gap-2 mt-2 ml-8">
          <textarea className="input flex-1 min-h-[60px] resize-y" autoFocus
            placeholder="Note visible to the client (e.g. waiting on assets, a question, a heads-up)…"
            value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-col gap-1">
            <button onClick={saveNote} className="grid place-items-center w-7 h-7 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
            <button onClick={() => setNoteEditing(false)} className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-dim"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* note display (admin view) */}
      {!noteEditing && step.note && (
        <div className="mt-1.5 ml-8 flex items-start gap-2 text-[.78rem] text-amber/90 bg-amber/5 border-l-2 border-amber/50 px-3 py-1.5">
          <StickyNote size={12} className="mt-0.5 shrink-0" />
          <span className="whitespace-pre-wrap">{step.note}</span>
        </div>
      )}

      <AdminSubsteps email={email} pi={pi} si={si} substeps={step.substeps || []} />

      {pending && (
        <NotifyModal email={email} pi={pi} si={si} step={step} status={pending}
                     onClose={() => setPending(null)} />
      )}
      {flagging && (
        <ActionNotifyModal email={email} pi={pi} si={si} step={step}
                           onClose={() => setFlagging(false)} />
      )}
    </div>
  )
}

function AdminSubsteps({ email, pi, si, substeps }) {
  const { addSubstep, updateSubstep, deleteSubstep } = useAdmin()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('admin')
  const [notify, setNotify] = useState(true)

  async function add() {
    if (!title.trim()) return
    const mailed = await addSubstep(email, pi, si, { title, owner, notify: owner === 'client' && notify })
    if (owner === 'client' && notify) toast.success(mailed ? 'Task added · client emailed.' : 'Task added (email is off).')
    setTitle(''); setOwner('admin'); setNotify(true); setOpen(false)
  }

  return (
    <div className="ml-8 mt-2">
      {substeps.map((b, bi) => (
        <div key={bi} className="flex items-center gap-2 py-1 group/sub">
          <button onClick={() => updateSubstep(email, pi, si, bi, { done: !b.done })}
            className={`shrink-0 ${b.done ? 'text-em' : 'text-faint hover:text-dim'}`}>
            {b.done ? <CheckSquare size={15} /> : <Square size={15} />}
          </button>
          <span className={`flex-1 text-[.82rem] ${b.done ? 'line-through text-faint' : ''}`}>{b.title}</span>
          <span title={b.owner === 'client' ? 'Client' : 'You'}
            className={`inline-flex items-center gap-1 font-mono text-[.5rem] uppercase tracking-wide px-1.5 py-[2px] border
              ${b.owner === 'client' ? 'text-rose-300 border-rose-400/50 bg-rose-400/10' : 'text-sky border-sky/40 bg-sky/5'}`}>
            {b.owner === 'client' ? <UserRound size={9} /> : <Wrench size={9} />}
            {b.owner === 'client' ? 'client' : 'me'}
          </span>
          {b.clientNote && (
            <span title={b.clientNote} className="text-[.6rem] text-amber/80 max-w-[120px] truncate">“{b.clientNote}”</span>
          )}
          <button onClick={() => deleteSubstep(email, pi, si, bi)}
            className="shrink-0 text-faint/50 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-opacity">
            <X size={13} />
          </button>
        </div>
      ))}

      {open ? (
        <div className="mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <input className="input flex-1 min-w-[140px]" placeholder="Sub-task…" value={title} autoFocus
                   onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
            <div className="flex border border-line">
              <button onClick={() => setOwner('admin')}
                className={`px-2 py-1.5 font-mono text-[.55rem] uppercase ${owner === 'admin' ? 'bg-sky/15 text-sky' : 'text-faint'}`}>me</button>
              <button onClick={() => setOwner('client')}
                className={`px-2 py-1.5 font-mono text-[.55rem] uppercase ${owner === 'client' ? 'bg-rose-400/15 text-rose-300' : 'text-faint'}`}>client</button>
            </div>
            <button onClick={add} className="grid place-items-center w-7 h-7 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
            <button onClick={() => { setOpen(false); setTitle('') }} className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-dim"><X size={14} /></button>
          </div>
          {owner === 'client' && (
            <label className="flex items-center gap-2 mt-2 font-mono text-[.6rem] text-dim cursor-pointer select-none">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)}
                     className="accent-rose-400" />
              email the client about this task
            </label>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 font-mono text-[.58rem] text-faint hover:text-sky transition-colors mt-1">
          <ListPlus size={12} /> add sub-task
        </button>
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
  const { deleteProject, updateProject } = useAdmin()
  const [editingUrl, setEditingUrl] = useState(false)
  const [url, setUrl] = useState(project.url || '')
  const done = project.steps.filter((s) => s.status === 'done').length
  const pct = project.steps.length ? Math.round((done / project.steps.length) * 100) : 0

  async function saveUrl() {
    await updateProject(email, pi, { url })
    setEditingUrl(false)
  }

  return (
    <div className="card p-6 mb-5">
      <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-sky to-em" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">{project.name}</h3>
          {project.description && <p className="text-[.85rem] text-dim mt-1">{project.description}</p>}
          {editingUrl ? (
            <div className="flex items-center gap-2 mt-2">
              <input className="input flex-1 min-w-[180px]" value={url} autoFocus
                placeholder="https://staging.example.com"
                onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveUrl()} />
              <button onClick={saveUrl} className="grid place-items-center w-7 h-7 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
              <button onClick={() => { setEditingUrl(false); setUrl(project.url || '') }} className="grid place-items-center w-7 h-7 border border-line text-faint hover:text-dim"><X size={14} /></button>
            </div>
          ) : project.url ? (
            <div className="flex items-center gap-2 mt-2">
              <a href={project.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[.6rem] tracking-wide text-em border border-em/50 bg-em/5 px-2.5 py-1 hover:bg-em/12 transition-colors truncate max-w-[260px]">
                <ExternalLink size={12} /> {project.url.replace(/^https?:\/\//, '')}
              </a>
              <button onClick={() => { setUrl(project.url); setEditingUrl(true) }} title="Edit URL"
                className="grid place-items-center w-6 h-6 border border-line text-faint hover:text-sky hover:border-sky transition-colors"><Pencil size={11} /></button>
            </div>
          ) : (
            <button onClick={() => setEditingUrl(true)}
              className="inline-flex items-center gap-1.5 font-mono text-[.58rem] text-faint hover:text-em transition-colors mt-2">
              <LinkIcon size={11} /> add live URL
            </button>
          )}
          <div className="font-mono text-[.6rem] text-faint mt-2 tracking-wider">{done}/{project.steps.length} · {pct}%</div>
        </div>
        <button onClick={() => { if (confirm('Delete this project?')) deleteProject(email, pi) }}
          className="grid place-items-center w-8 h-8 border border-line text-faint hover:text-red-400 hover:border-red-400/50 transition-colors shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      <BillingCard email={email} pi={pi} project={project} />

      <div className="mt-5 space-y-2.5">
        {project.steps.map((s, si) => (
          <StepRow key={si} email={email} pi={pi} si={si} step={s} />
        ))}
        <AddStep email={email} pi={pi} />
      </div>
    </div>
  )
  
}