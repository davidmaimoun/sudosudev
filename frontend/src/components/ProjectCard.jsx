import Step from './StatusNode.jsx'
import { ExternalLink, CircleDollarSign } from 'lucide-react'

const SYM = { ILS: '₪', EUR: '€', USD: '$' }
const money = (n, cur) => {
  const v = Number(n) || 0
  const s = v % 1 ? v.toLocaleString(undefined, { minimumFractionDigits: 2 }) : v.toLocaleString()
  return `${SYM[cur] || ''}${s}`
}

export default function ProjectCard({ project, pi = 0, bank = {} }) {
  const done = project.steps.filter((s) => s.status === 'done').length
  const pct = project.steps.length ? Math.round((done / project.steps.length) * 100) : 0

  const billing = project.billing || { total: 0, currency: 'ILS', payments: [] }
  const bCur = billing.currency || 'ILS'
  const bPayments = billing.payments || []
  const bTotal = Number(billing.total) || 0
  const bPaid = bPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const bRemaining = bTotal - bPaid
  const bPct = bTotal > 0 ? Math.min(100, Math.round((bPaid / bTotal) * 100)) : 0
  const hasBilling = bTotal > 0 || bPayments.length > 0
  return (
    <div className="card p-7 mb-6">
      <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-gradient-to-b from-sky to-em" />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="text-xl font-semibold tracking-tight">{project.name}</h3>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[.62rem] tracking-wide text-em
                       border border-em/50 bg-em/5 px-3 py-1.5 hover:bg-em/12 transition-colors">
            <ExternalLink size={13} /> View live site
          </a>
        )}
      </div>
      {project.description && <p className="text-[.88rem] text-dim mt-2 leading-relaxed">{project.description}</p>}
      <div className="mt-4">
        <div className="flex items-center justify-between font-mono text-[.6rem] text-faint tracking-wider mb-1.5">
          <span>{done}/{project.steps.length} steps</span>
          <span className="text-sky">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(86,207,252,.12)' }}>
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#56cffc,#2dd4a0)' }} />
        </div>
      </div>
      {hasBilling && (
        <div className="mt-5 border border-line bg-bg2/40 p-4 rounded">
          <div className="flex items-center gap-2 font-mono text-[.62rem] tracking-wide text-sky uppercase mb-3">
            <CircleDollarSign size={14} /> Billing
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-bg2 border border-line py-2 rounded">
              <div className="font-mono text-[.5rem] text-faint uppercase tracking-wide">Total</div>
              <div className="text-[.95rem] text-ink">{money(bTotal, bCur)}</div>
            </div>
            <div className="bg-bg2 border border-line py-2 rounded">
              <div className="font-mono text-[.5rem] text-faint uppercase tracking-wide">Paid</div>
              <div className="text-[.95rem] text-em">{money(bPaid, bCur)}</div>
            </div>
            <div className="bg-bg2 border border-line py-2 rounded">
              <div className="font-mono text-[.5rem] text-faint uppercase tracking-wide">Remaining</div>
              <div className="text-[.95rem] text-amber">{money(bRemaining, bCur)}</div>
            </div>
          </div>
          {bTotal > 0 && (
            <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ background: 'rgba(45,212,160,.12)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${bPct}%`, background: 'linear-gradient(90deg,#2dd4a0,#56cffc)' }} />
            </div>
          )}
          {bPayments.length > 0 && (
            <div className="space-y-1">
              {bPayments.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[.8rem]">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === 'paid' ? 'bg-em' : 'bg-amber'}`} />
                  <span className={`flex-1 ${p.status === 'paid' ? 'text-faint line-through' : 'text-dim'}`}>
                    {p.label}
                    {p.dueDate && p.status !== 'paid' && <span className="font-mono text-[.55rem] text-faint ml-2">due {p.dueDate}</span>}
                  </span>
                  <span className={`font-mono text-[.78rem] ${p.status === 'paid' ? 'text-em' : 'text-ink'}`}>{money(p.amount, bCur)}</span>
                </div>
              ))}
            </div>
          )}

          {bRemaining > 0 && (bank.iban || bank.beneficiary) && (
            <div className="mt-4 pt-3 border-t border-line">
              <div className="font-mono text-[.55rem] text-faint uppercase tracking-wide mb-2">Payment · bank transfer</div>
              <div className="text-[.78rem] text-dim space-y-0.5 font-mono">
                {bank.beneficiary && <div><span className="text-faint">Beneficiary:</span> {bank.beneficiary}</div>}
                {bank.bank && <div><span className="text-faint">Bank:</span> {bank.bank}</div>}
                {bank.iban && <div><span className="text-faint">IBAN:</span> {bank.iban}</div>}
                {bank.swift && <div><span className="text-faint">SWIFT/BIC:</span> {bank.swift}</div>}
                {bank.account && <div><span className="text-faint">Account:</span> {bank.account}</div>}
              </div>
              <div className="text-[.68rem] text-faint mt-2">Please include the project name as the transfer reference.</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        {project.steps.map((s, i) => (
          <Step key={i} step={s} pi={pi} si={i} isLast={i === project.steps.length - 1} />
        ))}
      </div>
    </div>
  )
}