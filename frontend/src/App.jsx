import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Recover from './pages/Recover.jsx'
import Workspace from './pages/Workspace.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

export default function App() {
  const init = useAuth((s) => s.init)
  useEffect(() => { init() }, [init])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recover" element={<Recover />} />
      <Route path="/workspace" element={
        <ProtectedRoute role="client"><Workspace /></ProtectedRoute>
      } />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}