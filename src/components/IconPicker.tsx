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
      className="absolute left-0 top-8 bg-white border rounded-lg shadow-xl p-2 z-20 w-48"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-1">Choose icon</div>
      <div className="grid grid-cols-5 gap-1">
        {AVAILABLE_ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => {
              onSelect(icon)
              onClose()
            }}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              selectedIcon === icon ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
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
