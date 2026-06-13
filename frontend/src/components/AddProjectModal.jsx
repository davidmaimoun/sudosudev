import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import Modal from './Modal.jsx'
import { useAdmin } from '../store/admin.js'

const blankStep = () => ({ title: '', eta: '' })

export default function AddProjectModal({ email, onClose }) {
  const addProject = useAdmin((s) => s.addProject)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState([blankStep(), blankStep()])
  const [busy, setBusy] = useState(false)

  function update(i, key, val) {
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, [key]: val } : st)))
  }
  const addStep = () => setSteps((s) => [...s, blankStep()])
  const removeStep = (i) => setSteps((s) => s.filter((_, idx) => idx !== i))

  async function submit(e) {
    e.preventDefault()
    const clean = steps.filter((s) => s.title.trim())
    if (!name.trim()) return toast.error('Project name required.')
    if (!clean.length) return toast.error('Add at least one step.')
    setBusy(true)
    try {
      // step 1 becomes in_progress automatically on the backend
      await addProject(email, { name, description, steps: clean })
      toast.success('Project added.')
      onClose()
    } catch {
      toast.error('Could not add project.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="New project" onClose={onClose} maxW="max-w-[560px]">
      <form onSubmit={submit}>
        <div className="mb-4">
          <label className="label">Project name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Genome Surveillance Pipeline" />
        </div>
        <div className="mb-5">
          <label className="label">Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary…" />
        </div>

        <div className="label mb-2">Steps <span className="text-faint normal-case">(step 1 starts “in progress”)</span></div>
        <div className="space-y-2 mb-3">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="font-mono text-[.6rem] text-faint w-5 text-right">{i + 1}.</span>
              <input className="input flex-1" value={s.title} onChange={(e) => update(i, 'title', e.target.value)} placeholder="Step title" />
              <input className="input w-28" value={s.eta} onChange={(e) => update(i, 'eta', e.target.value)} placeholder="eta (e.g. 1 week)" />
              <button type="button" onClick={() => removeStep(i)}
                className="grid place-items-center w-9 h-9 border border-line text-faint hover:text-red-400 hover:border-red-400/50 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addStep}
          className="inline-flex items-center gap-1.5 font-mono text-[.62rem] text-dim hover:text-sky transition-colors mb-6">
          <Plus size={13} /> add step
        </button>

        <button type="submit" className="btn-connect" disabled={busy}>
          {busy ? 'ADDING…' : 'ADD PROJECT →'}
        </button>
      </form>
    </Modal>
  )
}
