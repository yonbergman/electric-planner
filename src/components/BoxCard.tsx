'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Module, ModuleType, MODULE_SIZES, MODULE_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import ModuleSlot from './ModuleSlot'
import ConfirmDialog from './ConfirmDialog'
import Toast from './Toast'

interface Props {
  box: Box
  roomId: string
  onEdit: () => void
}

const MODULE_TYPES: ModuleType[] = [
  // Switches
  'light-switch-dumb',
  'light-switch-smart',
  'dimmer',
  'shutter',
  'scenario',
  // Power & data
  'socket',
  'usb-socket',
  'ethernet',
  // Filler
  'blank',
]

export default function BoxCard({ box, roomId, onEdit }: Props) {
  const { modules, addModule, deleteBox } = useStore()
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on escape or click outside
  useEffect(() => {
    if (showAddMenu === null) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddMenu(null)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddMenu])

  const boxModules = modules.filter((m) => m.boxId === box.id)

  // Build slot occupation map
  const slotMap: (Module | null)[] = Array(box.size).fill(null)
  const occupiedSecondSlots = new Set<number>()

  boxModules.forEach((mod) => {
    if (mod.position < box.size) {
      slotMap[mod.position] = mod
      const size = MODULE_SIZES[mod.type]
      if (size === 2 && mod.position + 1 < box.size) {
        occupiedSecondSlots.add(mod.position + 1)
      }
    }
  })

  const handleAddModule = (position: number) => {
    setShowAddMenu(position)
  }

  const handleSelectType = (position: number, type: ModuleType) => {
    const slotSize = MODULE_SIZES[type]
    if (slotSize === 2 && position + 1 >= box.size) {
      setToast('Not enough space (needs 2 slots)')
      setShowAddMenu(null)
      return
    }
    if (slotSize === 2 && slotMap[position + 1] !== null) {
      setToast('Next slot is occupied')
      setShowAddMenu(null)
      return
    }
    addModule(box.id, type, position, MODULE_LABELS[type])
    setShowAddMenu(null)
  }

  // 14-slot boxes break into 2 rows of 7
  // Module width: 56px + 6px gap = 62px per slot
  // 7 modules = 7*56 + 6*6 = 428px
  const shouldWrap = box.size === 14
  const containerStyle = shouldWrap ? { maxWidth: '440px' } : {}

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">{box.name}</h3>
          <p className="text-xs text-gray-500">{box.size} modules</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            aria-label={`Edit ${box.name}`}
            className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            aria-label={`Delete ${box.name}`}
            className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Switch plate frame - Vimar Linea style */}
      <div className="inline-block">
        {/* Outer frame */}
        <div className="bg-gradient-to-b from-[#f8f8f8] to-[#e8e8e8] p-1 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]">
          {/* Inner plate */}
          <div className="bg-gradient-to-b from-[#fafafa] to-[#f0f0f0] p-2 rounded-md border border-[#e0e0e0]">
            {/* Modules container */}
            <div className={`flex gap-[6px] ${shouldWrap ? 'flex-wrap' : 'flex-nowrap'}`} style={containerStyle}>
              {slotMap.map((mod, idx) => {
                const isOccupiedByPrevModule = occupiedSecondSlots.has(idx)

                if (isOccupiedByPrevModule) {
                  const prevModule = slotMap[idx - 1]
                  return (
                    <ModuleSlot
                      key={idx}
                      module={prevModule}
                      slotIndex={idx}
                      boxId={box.id}
                      roomId={roomId}
                      isSecondSlot
                      onAddModule={handleAddModule}
                    />
                  )
                }

                return (
                  <div key={idx} className="relative">
                    <ModuleSlot
                      module={mod}
                      slotIndex={idx}
                      boxId={box.id}
                      roomId={roomId}
                      onAddModule={handleAddModule}
                    />
                    {showAddMenu === idx && !mod && (
                      <div ref={menuRef} className="absolute top-16 left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 min-w-44">
                        <div className="text-xs font-medium text-gray-500 px-2 py-1">Add module</div>
                        {MODULE_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => handleSelectType(idx, type)}
                            className="flex items-center justify-between w-full text-left px-2 py-1.5 text-sm hover:bg-gray-50 rounded transition-colors"
                          >
                            <span>{MODULE_LABELS[type]}</span>
                            <span className="text-xs text-gray-400">{MODULE_SIZES[type]}M</span>
                          </button>
                        ))}
                        <hr className="my-1" />
                        <button
                          onClick={() => setShowAddMenu(null)}
                          className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:bg-gray-50 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete box?"
          message={`"${box.name}" and all its modules will be deleted.`}
          onConfirm={() => {
            deleteBox(box.id)
            setDeleteConfirm(false)
          }}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
