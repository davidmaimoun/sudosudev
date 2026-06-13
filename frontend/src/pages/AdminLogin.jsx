import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../store/auth.js'
import Shell from '../components/Shell.jsx'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const loginAdmin = useAuth((s) => s.loginAdmin)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!email || !code) return toast.error('Please fill in both fields.')
    setBusy(true)
    try {
      await loginAdmin(email, code)
      nav('/admin')
    } catch {
      toast.error('Invalid credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <div className="min-h-[58vh] grid place-items-center">
        <form onSubmit={submit} className="w-full max-w-[400px] card p-9 relative">
          <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-em to-sky" />
          <div className="font-mono text-[.62rem] tracking-[2px] text-em mb-3">// admin</div>
          <h1 className="text-[1.35rem] font-bold tracking-tight mb-6">Admin sign in</h1>
          <div className="mb-4">
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-6">
            <label className="label">Code</label>
            <input type="password" className="input tracking-[2px]" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button type="submit" className="btn-connect" disabled={busy}>
            {busy ? 'SIGNING IN…' : 'SIGN IN →'}
          </button>
        </form>
      </div>
    </Shell>
  )
}
