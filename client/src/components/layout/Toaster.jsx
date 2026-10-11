import { useState, useEffect } from 'react'

let _setToasts = null

export function toast(msg, type = 'success', duration = 3000) {
  if (_setToasts) {
    const id = Math.random().toString(36).slice(2)
    _setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => _setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }
}

const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }

export function Toaster() {
  const [toasts, setToasts] = useState([])
  useEffect(() => { _setToasts = setToasts }, [])

  return (
    <div className="fixed top-4 right-4 left-4 max-w-sm mx-auto z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[#1a1a2e] text-white rounded-xl px-4 py-3 text-sm font-semibold shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in"
        >
          <span>{icons[t.type] || icons.success}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
