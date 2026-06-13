import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../store/auth.js'
import Shell from '../components/Shell.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [clientId, setClientId] = useState('')
  const [busy, setBusy] = useState(false)
  const loginClient = useAuth((s) => s.loginClient)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!email || !clientId) return toast.error('Please fill in both fields.')
    setBusy(true)
    try {
      await loginClient(email, clientId)
      nav('/workspace')
    } catch {
      toast.error('Invalid credentials.') // generic on purpose
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <div className="min-h-[58vh] grid place-items-center">
        <form onSubmit={submit} className="w-full max-w-[400px] card p-9 relative">
          <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky to-em" />
          <div className="font-mono text-[.62rem] tracking-[2px] text-em mb-3">// authorized access</div>
          <h1 className="text-[1.35rem] font-bold tracking-tight mb-2">Connect to your workspace</h1>
          <p className="text-[.85rem] text-dim mb-7 leading-relaxed">Enter your credentials to follow your projects in real time.</p>

          <div className="mb-4">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" placeholder="you@company.com"
                   value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="mb-6">
            <label className="label" htmlFor="cid">Client ID</label>
            <input id="cid" type="text" className="input uppercase tracking-[2px]" placeholder="Your ClientID"
                   value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </div>

          <button type="submit" className="btn-connect" disabled={busy}>
            {busy ? 'CONNECTING…' : 'CONNECT →'}
          </button>
        </form>
      </div>
    </Shell>
  )
}
