import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import Modal from './Modal.jsx'
import { useAdmin } from '../store/admin.js'

export default function CreateClientModal({ onClose }) {
  const createClient = useAdmin((s) => s.createClient)
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', company: '', phone: '', address: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)   // { email, clientId }
  const [copied, setCopied] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim())
      return toast.error('First name, last name and email are required.')
    setBusy(true)
    try {
      const r = await createClient(f)
      setResult(r)
      toast.success('Client created.')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not create client.')
    } finally {
      setBusy(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(result.clientId)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  if (result) {
    return (
      <Modal title="Client created" onClose={onClose}>
        <p className="text-sm text-dim mb-4 leading-relaxed">
          Give these to <b className="text-ink">{result.email}</b>. The Client ID is shown
          <b className="text-sky"> only once</b> — it’s stored encrypted.
        </p>
        <div className="bg-bg2 border border-linehi p-4 font-mono">
          <div className="text-[.6rem] text-faint tracking-wide uppercase mb-1">Client ID</div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl text-sky tracking-[3px]">{result.clientId}</span>
            <button onClick={copy} className="grid place-items-center w-9 h-9 border border-linehi text-dim hover:text-sky hover:border-sky transition-colors">
              {copied ? <Check size={15} className="text-em" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="btn-connect mt-5">DONE</button>
      </Modal>
    )
  }

  return (
    <Modal title="New client" onClose={onClose} maxW="max-w-[500px]">
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">First name *</label>
            <input className="input" value={f.firstName} onChange={set('firstName')} placeholder="John" />
          </div>
          <div>
            <label className="label">Last name *</label>
            <input className="input" value={f.lastName} onChange={set('lastName')} placeholder="Doe" />
          </div>
        </div>
        <div className="mb-3">
          <label className="label">Email *</label>
          <input type="email" className="input" value={f.email} onChange={set('email')} placeholder="contact@client.com" />
        </div>
        <div className="mb-3">
          <label className="label">Company <span className="text-faint normal-case">(optional)</span></label>
          <input className="input" value={f.company} onChange={set('company')} placeholder="The Marauder Compagny" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="label">Phone <span className="text-faint normal-case">(opt.)</span></label>
            <input className="input" value={f.phone} onChange={set('phone')} placeholder="+972…" />
          </div>
          <div>
            <label className="label">Address <span className="text-faint normal-case">(opt.)</span></label>
            <input className="input" value={f.address} onChange={set('address')} placeholder="City…" />
          </div>
        </div>
        <button type="submit" className="btn-connect" disabled={busy}>
          {busy ? 'CREATING…' : 'CREATE CLIENT →'}
        </button>
      </form>
    </Modal>
  )
}