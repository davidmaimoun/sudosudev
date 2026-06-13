import { Check, LoaderCircle, Circle, StickyNote, UserRound } from 'lucide-react'

export const STATUS = {
  done:        { label: 'Done',        Icon: Check,         ring: 'border-em text-em bg-em/15',     line: 'bg-em' },
  in_progress: { label: 'In progress', Icon: LoaderCircle,  ring: 'border-sky text-sky bg-sky/15 animate-nodePulse', line: 'bg-linehi' },
  todo:        { label: 'Not started', Icon: Circle,        ring: 'border-linehi text-faint',       line: 'bg-linehi' },
}

export default function Step({ step, isLast }) {
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
      </div>
    </div>
  )
}