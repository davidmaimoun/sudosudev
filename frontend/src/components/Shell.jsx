import { Link } from 'react-router-dom'

export default function Shell({ children }) {
  return (
    <div className="max-w-[920px] mx-auto px-6 pt-10 pb-16">
      <div className="flex items-center justify-between mb-10">
        <div className="font-mono text-base tracking-wide">
          <span className="text-sky">sudo</span>su<span className="text-em">dev</span>
          <span className="text-faint"> · client space</span>
        </div>
        <a href="/" className="font-mono text-[.7rem] text-dim hover:text-sky transition-colors">← back to site</a>
      </div>
      {children}
    </div>
  )
}
