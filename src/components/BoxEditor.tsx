'use client'

import { useState, useEffect } from 'react'
import { Box } from '@/types'
import { useStore } from '@/store/useStore'

interface Props {
  box?: Box
  roomId: string
  onClose: () => void
}

export default function BoxEditor({ box, roomId, onClose }: Props) {
  const { addBox, updateBox } = useStore()
  const [name, setName] = useState(box?.name || '')
  const [size, setSize] = useState<3 | 4 | 7 | 14>(box?.size || 4)

  useEffect(() => {
    if (box) {
      setName(box.name)
      setSize(box.size)
    }
  }, [box])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (box) {
      updateBox(box.id, name.trim(), size)
    } else {
      addBox(roomId, name.trim(), size)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">
          {box ? 'Edit Box' : 'Add Box'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. A1, Main, etc."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size (slots)
            </label>
            <div className="flex gap-2">
              {([3, 4, 7, 14] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 border rounded ${
                    size === s
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {box ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
