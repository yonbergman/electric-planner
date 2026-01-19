'use client'

import { useEffect, useRef } from 'react'
import { AVAILABLE_ICONS, IconName } from '@/types'
import ItemIcon from './ItemIcon'

interface Props {
  selectedIcon: IconName
  onSelect: (icon: IconName) => void
  onClose: () => void
}

export default function IconPicker({ selectedIcon, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-10 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-20 w-52"
    >
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 pb-2">Choose icon</div>
      <div className="grid grid-cols-5 gap-1">
        {AVAILABLE_ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => {
              onSelect(icon)
              onClose()
            }}
            className={`p-2 rounded-lg transition-all ${
              selectedIcon === icon
                ? 'bg-copper-100 text-copper-600 ring-2 ring-copper-500'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label={icon}
          >
            <ItemIcon icon={icon} size={18} />
          </button>
        ))}
      </div>
    </div>
  )
}
