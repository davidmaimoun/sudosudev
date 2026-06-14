import { useState } from 'react'
import { toast } from 'sonner'
import { UserRound, MailX } from 'lucide-react'
import Modal from './Modal.jsx'
import { useAdmin } from '../store/admin.js'

// Asked when admin flags a step as "client action needed".
export default function ActionNotifyModal({ email, pi, si, step, onClose }) {
  const updateStep = useAdmin((s) => s.updateStep)
  const [busy, setBusy] = useState(false)

  async function apply(notify) {
    setBusy(true)
    try {
      const mailed = await updateStep(email, pi, si, { needsClient: true, notify })
      if (notify) toast.success(mailed ? 'Flagged · client emailed.' : 'Flagged (email is off on the server).')
      else toast.success('Flagged · no email sent.')
      onClose()
    } catch {
      toast.error('Could not update.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Mark as client action" onClose={onClose}>
      <p className="text-sm text-dim leading-relaxed mb-5">
        Flag <b className="text-ink">“{step.title}”</b> as needing the client's action.<br />
        Email the client to let them know?
      </p>
      <div className="flex flex-col gap-2.5">
        <button onClick={() => apply(true)} disabled={busy}
          className="inline-flex items-center justify-center gap-2 font-mono text-[.7rem] tracking-wide
                     bg-rose-400 text-[#040912] font-bold py-3 disabled:opacity-60"
          style={{ boxShadow: '3px 3px 0 #7f1d3a' }}>
          <UserRound size={15} /> {busy ? 'SAVING…' : 'FLAG & EMAIL CLIENT'}
        </button>
        <button onClick={() => apply(false)} disabled={busy}
          className="inline-flex items-center justify-center gap-2 font-mono text-[.7rem] tracking-wide
                     border border-linehi text-dim py-3 hover:border-sky hover:text-sky transition-colors disabled:opacity-60">
          <MailX size={15} /> Flag without email
        </button>
        <button onClick={onClose} disabled={busy}
          className="font-mono text-[.62rem] text-faint py-1 hover:text-dim transition-colors">Cancel</button>
      </div>
    </Modal>
  )
}