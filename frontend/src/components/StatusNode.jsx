import { useState } from 'react'
import { Check, LoaderCircle, Circle, StickyNote, UserRound, Square, CheckSquare, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../store/auth.js'

export const STATUS = {
  done:        { label: 'Done',        Icon: Check,         ring: 'border-em text-em bg-em/15',     line: 'bg-em' },
  in_progress: { label: 'In progress', Icon: LoaderCircle,  ring: 'border-sky text-sky bg-sky/15 animate-nodePulse', line: 'bg-linehi' },
  todo:        { label: 'Not started', Icon: Circle,        ring: 'border-linehi text-faint',       line: 'bg-linehi' },
}

function ClientSubsteps({ pi, si, substeps }) {
  const toggleSubstep = useAuth((s) => s.toggleSubstep)
  const [noteFor, setNoteFor] = useState(null)   // bi awaiting a note before marking done
  const [noteText, setNoteText] = useState('')

  if (!substeps?.length) return null

  async function check(bi, b) {
    if (!b.done) {
      // opening a small note box before confirming completion
      setNoteFor(bi); setNoteText(b.clientNote || '')
    } else {
      await toggleSubstep(pi, si, bi, false, b.clientNote || '')
    }
  }
  async function confirmDone(bi) {
    const mailed = await toggleSubstep(pi, si, bi, true, noteText)
    toast.success(mailed ? 'Done — sudosudev a été notifié.' : 'Marqué comme terminé.')
    setNoteFor(null); setNoteText('')
  }

  return (
    <div className="mt-2.5 space-y-1.5">
      {substeps.map((b, bi) => {
        const mine = b.owner === 'client'
        return (
          <div key={bi}>
            <div className="flex items-center gap-2">
              {mine ? (
                <button onClick={() => check(bi, b)} className={`shrink-0 ${b.done ? 'text-em' : 'text-rose-300 hover:text-rose-200'}`}>
                  {b.done ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              ) : (
                <span className={`shrink-0 ${b.done ? 'text-em' : 'text-faint'}`}>
                  {b.done ? <CheckSquare size={16} /> : <Square size={16} />}
                </span>
              )}
              <span className={`flex-1 text-[.84rem] ${b.done ? 'line-through text-faint' : mine ? '' : 'text-dim'}`}>{b.title}</span>
              <span className={`inline-flex items-center gap-1 font-mono text-[.5rem] uppercase tracking-wide px-1.5 py-[2px] border shrink-0
                ${mine ? 'text-rose-300 border-rose-400/50 bg-rose-400/10' : 'text-sky border-sky/40 bg-sky/5'}`}>
                {mine ? <UserRound size={9} /> : <Wrench size={9} />} {mine ? 'you' : 'sudosudev'}
              </span>
            </div>
            {mine && noteFor === bi && (
              <div className="flex items-start gap-2 mt-1.5 ml-6">
                <input className="input flex-1" autoFocus placeholder="Un mot ? (ex. voici les clés…) — facultatif"
                  value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmDone(bi)} />
                <button onClick={() => confirmDone(bi)} className="grid place-items-center w-8 h-8 border border-em/60 text-em hover:bg-em/10 shrink-0"><Check size={15} /></button>
              </div>
            )}
            {b.clientNote && b.done && (
              <div className="ml-6 mt-0.5 text-[.72rem] text-amber/80">“{b.clientNote}”</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Step({ step, isLast, pi, si }) {
  const m = STATUS[step.status] || STATUS.todo
  const { Icon } = m
  return (
    <div className="relative grid grid-cols-[36px_1fr] gap-x-4 pb-[1.1rem] last:pb-0">
      {!isLast && <span className={`absolute left-[17px] top-9 -bottom-0.5 w-0.5 ${m.line}`} />}
      <div className={`relative z-10 grid place-items-center w-9 h-9 rounded-full border-2 bg-bg2 ${m.ring}`}>
        <Icon size={16} className={step.status === 'in_progress' ? 'animate-spin [animation-duration:3s]' : ''} />
      </div>
      <div className={`pt-1 ${step.needsClient ? 'border-l-2 border-rose-400/60 pl-3 -ml-0.5' : ''}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[.95rem] font-medium ${step.status === 'todo' ? 'text-dim' : ''}`}>{step.title}</span>
          <span className={`font-mono text-[.52rem] tracking-wide px-2 py-[3px] border uppercase
            ${step.status === 'done' ? 'text-em border-em' : step.status === 'in_progress' ? 'text-sky border-sky' : 'text-faint border-faint'}`}>
            {m.label}
          </span>
          {step.needsClient && (
            <span className="inline-flex items-center gap-1 font-mono text-[.52rem] tracking-wide uppercase
                             text-rose-300 border border-rose-400/60 bg-rose-400/10 px-2 py-[3px]">
              <UserRound size={10} /> action de votre part
            </span>
          )}
        </div>
        {step.eta && <div className="font-mono text-[.62rem] text-faint mt-1 tracking-wide">~ {step.eta}</div>}
        {step.note && (
          <div className="mt-2 flex items-start gap-2 text-[.82rem] text-amber/90 bg-amber/5 border-l-2 border-amber/50 px-3 py-2 rounded-r">
            <StickyNote size={13} className="mt-0.5 shrink-0" />
            <span className="whitespace-pre-wrap leading-relaxed">{step.note}</span>
          </div>
        )}
        <ClientSubsteps pi={pi} si={si} substeps={step.substeps} />
      </div>
    </div>
  )
}