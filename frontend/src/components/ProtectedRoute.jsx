import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth.js'

export default function ProtectedRoute({ role, children }) {
  const { role: current, loading } = useAuth()
  if (loading) return <div className="grid place-items-center min-h-[60vh] font-mono text-dim text-sm">loading…</div>
  if (current !== role) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />
  return children
}
