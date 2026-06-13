import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import Modal from './Modal.jsx'
import { useAdmin } from '../store/admin.js'

export default function CreateClientModal({ onClose }) {
  const createClient = useAdmin((s) => s.createClient)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)   // { email, clientId }
  const [copied, setCopied] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name || !email) return toast.error('Name and email required.')
    setBusy(true)
    try {
      const r = await createClient(name, email)
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
          <b className="text-sky"> only once</b> — it’s stored hashed.
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
    <Modal title="New client" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mb-4">
          <label className="label">Client name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Bio Labs" />
        </div>
        <div className="mb-6">
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@acme.bio" />
        </div>
        <button type="submit" className="btn-connect" disabled={busy}>
          {busy ? 'CREATING…' : 'CREATE CLIENT →'}
        </button>
      </form>
    </Modal>
  )
}
