import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, maxW = 'max-w-[460px]' }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#040912]/80 backdrop-blur-sm"
         onClick={onClose}>
      <div className={`card relative w-full ${maxW} p-7`} onClick={(e) => e.stopPropagation()}>
        <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky to-em" />
        <button onClick={onClose}
          className="absolute top-3 right-3 grid place-items-center w-7 h-7 rounded-full border border-line text-dim hover:text-sky hover:border-sky transition-colors">
          <X size={14} />
        </button>
        {title && <h3 className="font-mono text-[.95rem] tracking-wide mb-5 pr-6">{title}</h3>}
        {children}
      </div>
    </div>
  )
}
