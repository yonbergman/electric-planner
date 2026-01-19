'use client'

import { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

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

  const styles = {
    error: {
      bg: 'bg-red-500',
      icon: AlertCircle,
    },
    success: {
      bg: 'bg-emerald-500',
      icon: CheckCircle,
    },
    info: {
      bg: 'bg-slate-700',
      icon: Info,
    },
  }

  const { bg, icon: Icon } = styles[type]

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 ${bg} text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3`}>
      <Icon size={18} className="flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
