'use client'

import { useState, useEffect, useRef } from 'react'
import { Module, ModuleType, ITEM_LABELS, MODULE_LABELS, DEFAULT_ITEM_ICONS } from '@/types'
import { useStore } from '@/store/useStore'
import ItemIcon from './ItemIcon'

interface Props {
  module: Module | null
  slotIndex: number
  boxId: string
  roomId: string
  isSecondSlot?: boolean
  onAddModule: (position: number) => void
}


function ModuleVisual({ type, hasConnection }: { type: ModuleType; hasConnection: boolean }) {
  const baseClass = "w-full h-full flex items-center justify-center"
  const connectedDot = hasConnection ? (
    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-sm" />
  ) : null

  switch (type) {
    case 'blank':
      return (
        <div className={`${baseClass} bg-[#f5f5f5]`}>
          {connectedDot}
        </div>
      )

    case 'light-switch-dumb':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* Long rocker switch */}
          <div className="w-8 h-16 bg-gradient-to-b from-white to-[#e8e8e8] rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.1)] border border-[#d0d0d0]">
            <div className="w-full h-1/2 border-b border-[#c5c5c5] rounded-t-[2px] bg-gradient-to-b from-white to-[#f0f0f0]" />
            <div className="w-full h-1/2 rounded-b-[2px] bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0]" />
          </div>
        </div>
      )

    case 'light-switch-smart':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* Long rocker switch with LED */}
          <div className="w-8 h-16 bg-gradient-to-b from-white to-[#e8e8e8] rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.1)] border border-[#d0d0d0] relative">
            <div className="w-full h-1/2 border-b border-[#c5c5c5] rounded-t-[2px] bg-gradient-to-b from-white to-[#f0f0f0]" />
            <div className="w-full h-1/2 rounded-b-[2px] bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0]" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_rgba(74,222,128,0.9)]" />
          </div>
        </div>
      )

    case 'socket':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* Israel Type H socket - V shape with ground at bottom */}
          <div className="w-14 h-14 bg-gradient-to-b from-white to-[#ececec] rounded-full border-2 border-[#d0d0d0] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.1)] flex items-center justify-center">
            <div className="relative w-9 h-7">
              {/* Top left hole (live) */}
              <div className="absolute top-0 left-0 w-3 h-3 bg-[#1a1a1a] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
              {/* Top right hole (neutral) */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#1a1a1a] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
              {/* Bottom center hole (ground) - lower than the others */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
            </div>
          </div>
        </div>
      )

    case 'usb-socket':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* USB-A ports stacked */}
          <div className="flex flex-col gap-1.5">
            <div className="w-8 h-4 bg-[#333] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center border border-[#222]">
              <div className="w-5 h-2 bg-[#f5f5f5] rounded-[1px]" />
            </div>
            <div className="w-8 h-4 bg-[#333] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex items-center justify-center border border-[#222]">
              <div className="w-5 h-2 bg-[#f5f5f5] rounded-[1px]" />
            </div>
          </div>
        </div>
      )

    case 'ethernet':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* RJ45 Ethernet port */}
          <div className="w-10 h-8 bg-[#333] rounded-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] border border-[#222] flex items-center justify-center relative">
            {/* Port opening */}
            <div className="w-7 h-5 bg-[#1a1a1a] rounded-[1px] flex items-end justify-center pb-0.5">
              {/* Gold contacts */}
              <div className="flex gap-[2px]">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-[2px] h-2 bg-[#c9a227]" />
                ))}
              </div>
            </div>
            {/* Clip notch */}
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-1 bg-[#444] rounded-b-sm" />
          </div>
        </div>
      )

    case 'shutter':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* Shutter control - up/down buttons */}
          <div className="w-8 h-16 bg-gradient-to-b from-[#fafafa] to-[#f0f0f0] rounded-[3px] border border-[#d0d0d0] flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            {/* Up button */}
            <div className="flex-1 bg-gradient-to-b from-white to-[#f0f0f0] border-b border-[#c5c5c5] flex items-center justify-center hover:bg-[#f8f8f8]">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-[#555]" />
            </div>
            {/* Down button */}
            <div className="flex-1 bg-gradient-to-b from-[#f0f0f0] to-[#e5e5e5] flex items-center justify-center hover:bg-[#ececec]">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-[#555]" />
            </div>
          </div>
        </div>
      )

    case 'dimmer':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* Dimmer - up/down with sun symbols */}
          <div className="w-8 h-16 bg-gradient-to-b from-[#fafafa] to-[#f0f0f0] rounded-[3px] border border-[#d0d0d0] flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            {/* Brighter button */}
            <div className="flex-1 bg-gradient-to-b from-white to-[#f0f0f0] border-b border-[#c5c5c5] flex items-center justify-center">
              {/* Large sun */}
              <svg className="w-5 h-5 text-[#555]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            {/* Dimmer button */}
            <div className="flex-1 bg-gradient-to-b from-[#f0f0f0] to-[#e5e5e5] flex items-center justify-center">
              {/* Small sun */}
              <svg className="w-3.5 h-3.5 text-[#777]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      )

    case 'scenario':
      return (
        <div className={`${baseClass} bg-[#f5f5f5] relative`}>
          {connectedDot}
          {/* Scenario - two split buttons like light switch */}
          <div className="w-8 h-16 bg-gradient-to-b from-white to-[#e8e8e8] rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.1)] border border-[#d0d0d0] flex flex-col overflow-hidden">
            {/* Top button */}
            <div className="flex-1 border-b border-[#c5c5c5] bg-gradient-to-b from-white to-[#f0f0f0] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#888] shadow-inner" />
            </div>
            {/* Bottom button */}
            <div className="flex-1 bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#888] shadow-inner" />
            </div>
          </div>
        </div>
      )

    default:
      return <div className={`${baseClass} bg-[#f5f5f5]`}>{connectedDot}</div>
  }
}

export default function ModuleSlot({ module, slotIndex, boxId, roomId, isSecondSlot, onAddModule }: Props) {
  const { items, assignItem, deleteModule, updateModule, hoveredItemId, setHoveredModule } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on escape or click outside
  useEffect(() => {
    if (!showMenu) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const roomItems = items.filter((i) => i.roomId === roomId)

  // Second slot of a 2-slot module (socket)
  if (isSecondSlot && module) {
    return null // Socket visual spans both slots, rendered by first slot
  }

  if (!module) {
    return (
      <button
        onClick={() => onAddModule(slotIndex)}
        className="w-14 h-20 bg-[#fafafa] border border-dashed border-[#bbb] rounded-[3px] flex items-center justify-center text-[#999] hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50/50 transition-colors"
      >
        <span className="text-2xl font-light">+</span>
      </button>
    )
  }

  const item = items.find((i) => i.id === module.itemId)
  const isDoubleWidth = module.type === 'socket'
  const isHighlighted = hoveredItemId && module.itemId === hoveredItemId

  const getItemIcon = (i: typeof item) => {
    if (!i) return null
    return i.icon || DEFAULT_ITEM_ICONS[i.type]
  }

  const handleStartEditNotes = () => {
    setNotes(module.notes || '')
    setEditingNotes(true)
    setShowMenu(false)
  }

  const handleSaveNotes = () => {
    updateModule(module.id, { notes: notes.trim() || undefined })
    setEditingNotes(false)
  }

  return (
    <div className="relative" style={{ width: isDoubleWidth ? '118px' : '56px' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        onMouseEnter={() => { setShowTooltip(true); setHoveredModule(module.id) }}
        onMouseLeave={() => { setShowTooltip(false); setHoveredModule(null) }}
        aria-label={`${MODULE_LABELS[module.type]}${item ? ` connected to ${item.name || ITEM_LABELS[item.type]}` : ', click to connect'}`}
        className={`${isDoubleWidth ? 'w-[118px]' : 'w-14'} h-20 rounded-[3px] border overflow-hidden relative group transition-all ${
          isHighlighted
            ? 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] ring-2 ring-blue-400'
            : 'border-[#d5d5d5] shadow-[0_1px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
        }`}
      >
        <ModuleVisual type={module.type} hasConnection={!!item} />
        {/* Delete button - inside slot to avoid overlap */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            deleteModule(module.id)
          }}
          aria-label={`Delete ${MODULE_LABELS[module.type]}`}
          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/90 text-white rounded text-xs hidden group-hover:flex items-center justify-center cursor-pointer hover:bg-red-600"
        >
          ×
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && !showMenu && (
        <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-20 pointer-events-none shadow-lg">
          <div className="font-medium">{MODULE_LABELS[module.type]}</div>
          {item && (
            <div className="text-gray-300 mt-0.5 flex items-center gap-1">
              <ItemIcon icon={getItemIcon(item)!} size={12} />
              {item.name || ITEM_LABELS[item.type]}
            </div>
          )}
          {!item && <div className="text-gray-400 italic mt-0.5">Not connected</div>}
          {module.type === 'scenario' && module.notes && (
            <div className="text-gray-300 mt-1 max-w-48 whitespace-normal">{module.notes}</div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-800" />
        </div>
      )}

      {/* Menu */}
      {showMenu && (
        <div ref={menuRef} className="absolute top-[88px] left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-xl p-2 min-w-44">
          <div className="text-xs font-semibold mb-1 text-gray-500 px-2">Connect to:</div>
          <button
            onClick={() => {
              assignItem(module.id, undefined)
              setShowMenu(false)
            }}
            className="block w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
          >
            None
          </button>
          {roomItems.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                assignItem(module.id, i.id)
                setShowMenu(false)
              }}
              className={`flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded ${
                module.itemId === i.id ? 'bg-blue-50' : ''
              }`}
            >
              <ItemIcon icon={i.icon || DEFAULT_ITEM_ICONS[i.type]} size={14} className="text-gray-600" />
              {i.name || ITEM_LABELS[i.type]}
            </button>
          ))}
          {roomItems.length === 0 && (
            <p className="text-xs text-gray-400 italic px-2 py-1">No items in room</p>
          )}

          {module.type === 'scenario' && (
            <>
              <hr className="my-2" />
              <button
                onClick={handleStartEditNotes}
                className="block w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded text-gray-600"
              >
                {module.notes ? 'Edit notes...' : 'Add notes...'}
              </button>
            </>
          )}

          <hr className="my-2" />
          <button
            onClick={() => setShowMenu(false)}
            className="block w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 rounded"
          >
            Close
          </button>
        </div>
      )}

      {/* Notes editor modal */}
      {editingNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingNotes(false)}>
          <div className="bg-white rounded-lg p-4 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium mb-2">Scenario Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe this scenario..."
              className="w-full px-3 py-2 border rounded-lg text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditingNotes(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
