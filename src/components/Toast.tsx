'use client'

import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'error' | 'success' | 'info'
  onClose: () => void
}

export default function Toast({ message, type = 'error', onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const colors = {
    error: 'bg-red-600',
    success: 'bg-green-600',
    info: 'bg-gray-800',
  }

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-white/80 hover:text-white"
      >
        ×
      </button>
    </div>
  )
}
