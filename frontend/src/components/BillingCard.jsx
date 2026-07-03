import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X, Check, Trash2, Pencil, BellRing, CircleDollarSign, Square, CheckSquare } from 'lucide-react'
import { useAdmin } from '../store/admin.js'

const SYM = { ILS: '₪', EUR: '€', USD: '$' }
const money = (n, cur) => {
  const v = Number(n) || 0
  const s = v % 1 ? v.toLocaleString(undefined, { minimumFractionDigits: 2 }) : v.toLocaleString()
  return `${SYM[cur] || ''}${s}`
}

export default function BillingCard({ email, pi, project }) {
  const { updateProject, addPayment, updatePayment, deletePayment, remindPayment } = useAdmin()
  const billing = project.billing || { total: 0, currency: 'ILS', payments: [] }
  const cur = billing.currency || 'ILS'
  const payments = billing.payments || []

  const paid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const total = Number(billing.total) || 0
  const remaining = total - paid
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

  const [editTotal, setEditTotal] = useState(false)
  const [tVal, setTVal] = useState(total)
  const [tCur, setTCur] = useState(cur)
  const [adding, setAdding] = useState(false)
  const [pLabel, setPLabel] = useState('')
  const [pAmount, setPAmount] = useState('')
  const [pDue, setPDue] = useState('')

  async function saveTotal() {
    await updateProject(email, pi, { total: Number(tVal) || 0, currency: tCur })
    setEditTotal(false)
  }
  async function submitPayment() {
    if (!pLabel.trim() || pAmount === '') return toast.error('Label and amount required.')
    await addPayment(email, pi, { label: pLabel, amount: Number(pAmount), dueDate: pDue })
    setPLabel(''); setPAmount(''); setPDue(''); setAdding(false)
  }
  async function togglePaid(idx, p) {
    await updatePayment(email, pi, idx, { status: p.status === 'paid' ? 'pending' : 'paid' })
  }
  async function remind(idx) {
    const mailed = await remindPayment(email, pi, idx)
    toast[mailed ? 'success' : 'error'](mailed ? 'Reminder emailed to the client.' : 'Email is off on the server.')
  }

  return (
    <div className="mt-4 border border-line bg-bg2/40 p-4 rounded">
      <div className="flex items-center gap-2 font-mono text-[.62rem] tracking-wide text-sky uppercase mb-3">
        <CircleDollarSign size={14} /> Billing
      </div>

      {/* totals row */}
      {editTotal ? (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <input className="input w-32" type="number" min="0" step="any" value={tVal} autoFocus
            onChange={(e) => setTVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveTotal()} />
          <div className="flex border border-line">
            {['ILS', 'EUR', 'USD'].map((c) => (
              <button key={c} onClick={() => setTCur(c)}
                className={`px-2.5 py-2 font-mono text-[.6rem] ${tCur === c ? 'bg-sky/15 text-sky' : 'text-faint'}`}>{SYM[c]}</button>
            ))}
          </div>
          <button onClick={saveTotal} className="grid place-items-center w-8 h-8 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
          <button onClick={() => { setEditTotal(false); setTVal(total); setTCur(cur) }} className="grid place-items-center w-8 h-8 border border-line text-faint"><X size={14} /></button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-bg2 border border-line py-2 rounded">
            <div className="font-mono text-[.5rem] text-faint uppercase tracking-wide">Total</div>
            <button onClick={() => { setEditTotal(true); setTVal(total); setTCur(cur) }}
              className="text-[.95rem] text-ink hover:text-sky transition-colors inline-flex items-center gap-1">
              {money(total, cur)} <Pencil size={10} className="opacity-50" />
            </button>
          </div>
          <div className="bg-bg2 border border-line py-2 rounded">
            <div className="font-mono text-[.5rem] text-faint uppercase tracking-wide">Paid</div>
            <div className="text-[.95rem] text-em">{money(paid, cur)}</div>
          </div>
          <div className="bg-bg2 border border-line py-2 rounded">
            <div className="font-mono text-[.5rem] text-faint uppercase tracking-wide">Remaining</div>
            <div className="text-[.95rem] text-amber">{money(remaining, cur)}</div>
          </div>
        </div>
      )}

      {/* progress */}
      {total > 0 && (
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-4" style={{ background: 'rgba(45,212,160,.12)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2dd4a0,#56cffc)' }} />
        </div>
      )}

      {/* payments list */}
      <div className="space-y-1.5">
        {payments.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 py-1 group/pay">
            <button onClick={() => togglePaid(idx, p)} className={`shrink-0 ${p.status === 'paid' ? 'text-em' : 'text-faint hover:text-dim'}`}>
              {p.status === 'paid' ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <span className={`flex-1 text-[.82rem] ${p.status === 'paid' ? 'text-faint line-through' : ''}`}>
              {p.label}
              {p.dueDate && <span className="font-mono text-[.55rem] text-faint ml-2">due {p.dueDate}</span>}
            </span>
            <span className={`font-mono text-[.8rem] ${p.status === 'paid' ? 'text-em' : 'text-ink'}`}>{money(p.amount, cur)}</span>
            {p.status !== 'paid' && (
              <button onClick={() => remind(idx)} title="Send payment reminder"
                className="shrink-0 text-faint hover:text-amber transition-colors"><BellRing size={14} /></button>
            )}
            <button onClick={() => deletePayment(email, pi, idx)} title="Delete"
              className="shrink-0 text-faint/50 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover/pay:opacity-100 transition-opacity"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {/* add payment */}
      {adding ? (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <input className="input flex-1 min-w-[120px]" placeholder="Label (e.g. Deposit, After design)" value={pLabel} autoFocus
            onChange={(e) => setPLabel(e.target.value)} />
          <input className="input w-24" type="number" min="0" step="any" placeholder="Amount" value={pAmount}
            onChange={(e) => setPAmount(e.target.value)} />
          <input className="input w-32" type="date" value={pDue} onChange={(e) => setPDue(e.target.value)} title="Due date (optional)" />
          <button onClick={submitPayment} className="grid place-items-center w-8 h-8 border border-em/60 text-em hover:bg-em/10"><Check size={14} /></button>
          <button onClick={() => { setAdding(false); setPLabel(''); setPAmount(''); setPDue('') }} className="grid place-items-center w-8 h-8 border border-line text-faint"><X size={14} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 font-mono text-[.6rem] text-faint hover:text-sky transition-colors mt-2">
          <Plus size={12} /> add payment
        </button>
      )}
    </div>
  )
}