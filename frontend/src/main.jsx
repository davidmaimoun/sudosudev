import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* basename matches vite base + nginx /app/ */}
    <BrowserRouter basename="/app">
      <App />
      <Toaster theme="dark" position="top-center" richColors />
    </BrowserRouter>
  </React.StrictMode>,
)
