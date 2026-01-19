'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-slate-800">
            {box ? 'Edit Box' : 'Add Box'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. A1, Main, etc."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Size (slots)
            </label>
            <div className="flex gap-2">
              {([3, 4, 7, 14] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                    size === s
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 shadow-md shadow-indigo-500/30 transition-all"
            >
              {box ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
