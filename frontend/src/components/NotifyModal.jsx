import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, MailX } from 'lucide-react'
import Modal from './Modal.jsx'
import { useAdmin } from '../store/admin.js'

const LABEL = { done: 'Done', in_progress: 'In progress', todo: 'Not started' }

// Confirms a status change and asks whether to email the client.
export default function NotifyModal({ email, pi, si, step, status, onClose }) {
  const setStatus = useAdmin((s) => s.setStatus)
  const [busy, setBusy] = useState(false)

  async function apply(notify) {
    setBusy(true)
    try {
      const mailed = await setStatus(email, pi, si, status, notify)
      if (notify) toast.success(mailed ? 'Status updated · client notified by email.' : 'Status updated (email is disabled on the server).')
      else toast.success('Status updated · no email sent.')
      onClose()
    } catch {
      toast.error('Could not update status.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Update step status" onClose={onClose}>
      <p className="text-sm text-dim leading-relaxed mb-5">
        Set <b className="text-ink">“{step.title}”</b> to <b className="text-sky">{LABEL[status]}</b>.<br />
        Do you want to notify the client by email?
      </p>
      <div className="flex flex-col gap-2.5">
        <button onClick={() => apply(true)} disabled={busy}
          className="inline-flex items-center justify-center gap-2 font-mono text-[.7rem] tracking-wide
                     bg-sky text-[#040912] font-bold py-3 disabled:opacity-60"
          style={{ boxShadow: '3px 3px 0 #0c4a6e' }}>
          <Mail size={15} /> {busy ? 'SAVING…' : 'NOTIFY CLIENT & SAVE'}
        </button>
        <button onClick={() => apply(false)} disabled={busy}
          className="inline-flex items-center justify-center gap-2 font-mono text-[.7rem] tracking-wide
                     border border-linehi text-dim py-3 hover:border-sky hover:text-sky transition-colors disabled:opacity-60">
          <MailX size={15} /> Save without email
        </button>
        <button onClick={onClose} disabled={busy}
          className="font-mono text-[.62rem] text-faint py-1 hover:text-dim transition-colors">Cancel</button>
      </div>
    </Modal>
  )
}
