import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, Check, MailCheck } from 'lucide-react'
import { useAuth } from '../store/auth.js'
import Shell from '../components/Shell.jsx'

// Two modes:
//  - no token in URL  -> ask for email, send recovery link
//  - token in URL     -> confirm, regenerate ID, show + email it
export default function Recover() {
  const [params] = useSearchParams()
  const emailParam = params.get('email') || ''
  const tokenParam = params.get('token') || ''
  const { recoverRequest, recoverConfirm } = useAuth()
  const nav = useNavigate()

  const [email, setEmail] = useState(emailParam)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [result, setResult] = useState(null)     // { clientId, emailed }
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // if a token is present, confirm automatically on load
  useEffect(() => {
    if (emailParam && tokenParam) {
      (async () => {
        setBusy(true)
        try {
          const r = await recoverConfirm(emailParam, tokenParam)
          setResult(r)
        } catch (e) {
          setError(e?.response?.data?.error || 'Invalid or expired link.')
        } finally {
          setBusy(false)
        }
      })()
    }
  }, [emailParam, tokenParam])

  async function requestLink(e) {
    e.preventDefault()
    if (!email) return toast.error('Enter your email.')
    setBusy(true)
    try {
      await recoverRequest(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(result.clientId)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  // ── token mode: show outcome ──
  if (emailParam && tokenParam) {
    return (
      <Shell>
        <div className="min-h-[58vh] grid place-items-center">
          <div className="w-full max-w-[420px] card p-9 relative">
            <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky to-em" />
            {busy && <p className="font-mono text-dim text-sm">Checking your link…</p>}
            {!busy && error && (
              <>
                <h1 className="text-[1.3rem] font-bold tracking-tight mb-2 text-rose-300">Invalid link</h1>
                <p className="text-sm text-dim mb-6">{error} You can request a new one.</p>
                <button onClick={() => nav('/recover')} className="btn-connect">REQUEST A NEW LINK</button>
              </>
            )}
            {!busy && result && (
              <>
                <div className="font-mono text-[.62rem] tracking-[2px] text-em mb-3">// new access id</div>
                <h1 className="text-[1.3rem] font-bold tracking-tight mb-3">Your new ID</h1>
                <p className="text-sm text-dim mb-4 leading-relaxed">
                  {result.emailed ? 'It was also emailed to you.' : 'Keep it safe.'} The old one no longer works.
                </p>
                <div className="bg-bg2 border border-linehi p-4 font-mono mb-5">
                  <div className="text-[.6rem] text-faint tracking-wide uppercase mb-1">Client ID</div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl text-sky tracking-[3px]">{result.clientId}</span>
                    <button onClick={copy} className="grid place-items-center w-9 h-9 border border-linehi text-dim hover:text-sky hover:border-sky transition-colors">
                      {copied ? <Check size={15} className="text-em" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => nav('/login')} className="btn-connect">GO TO SIGN IN →</button>
              </>
            )}
          </div>
        </div>
      </Shell>
    )
  }

  // ── request mode ──
  return (
    <Shell>
      <div className="min-h-[58vh] grid place-items-center">
        <div className="w-full max-w-[400px] card p-9 relative">
          <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky to-em" />
          {sent ? (
            <div className="text-center">
              <MailCheck size={34} className="text-em mx-auto mb-4" />
              <h1 className="text-[1.25rem] font-bold tracking-tight mb-2">Check your inbox</h1>
              <p className="text-sm text-dim leading-relaxed">
                If an account exists for <b className="text-ink">{email}</b>, a link has just been sent.
                Il expire dans 10&nbsp;minutes.
              </p>
              <button onClick={() => nav('/login')} className="mt-6 font-mono text-[.62rem] text-dim hover:text-sky transition-colors">← back to sign in</button>
            </div>
          ) : (
            <form onSubmit={requestLink}>
              <div className="font-mono text-[.62rem] tracking-[2px] text-em mb-3">// forgot your id</div>
              <h1 className="text-[1.3rem] font-bold tracking-tight mb-2">Recover my ID</h1>
              <p className="text-sm text-dim mb-6 leading-relaxed">
                Enter your email and we'll send you a link to generate a new access ID.
              </p>
              <div className="mb-6">
                <label className="label">Email</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button type="submit" className="btn-connect" disabled={busy}>
                {busy ? 'SENDING…' : 'SEND THE LINK →'}
              </button>
              <button type="button" onClick={() => nav('/login')} className="w-full mt-3 font-mono text-[.62rem] text-faint hover:text-dim transition-colors">← back to sign in</button>
            </form>
          )}
        </div>
      </div>
    </Shell>
  )
}