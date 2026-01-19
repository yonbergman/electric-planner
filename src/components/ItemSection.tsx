'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { ItemType, ITEM_LABELS } from '@/types'

const ITEM_TYPES: ItemType[] = ['light', 'ceiling-fan', 'blinds', 'leds', 'appliance']

const ITEM_ICONS: Record<ItemType, string> = {
  'light': '💡',
  'ceiling-fan': '🌀',
  'blinds': '🪟',
  'leds': '✨',
  'appliance': '🔌',
}

interface Props {
  roomId: string
}

export default function ItemSection({ roomId }: Props) {
  const { items, modules, addItem, deleteItem, updateItem, setHoveredItem, hoveredModuleId } = useStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const roomItems = items.filter((i) => i.roomId === roomId)

  const handleAdd = (type: ItemType) => {
    addItem(roomId, type)
    setShowDropdown(false)
  }

  const handleStartEdit = (id: string, name: string | undefined) => {
    setEditingId(id)
    setEditName(name || '')
  }

  const handleSaveEdit = (id: string, type: ItemType) => {
    updateItem(id, type, editName.trim() || undefined)
    setEditingId(null)
  }

  return (
    <div className="w-64 p-6 overflow-auto bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-600">ITEMS</h2>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            + Add
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-8 bg-white border rounded shadow-lg py-1 z-10 min-w-36">
              {ITEM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleAdd(type)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  {ITEM_ICONS[type]} {ITEM_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {roomItems.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {roomItems.map((item) => {
            const hoveredModule = hoveredModuleId ? modules.find(m => m.id === hoveredModuleId) : null
            const isHighlighted = hoveredModule?.itemId === item.id
            return (
            <li
              key={item.id}
              className={`bg-white rounded border p-2 cursor-pointer transition-all ${
                isHighlighted
                  ? 'border-blue-500 ring-2 ring-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                  : 'hover:border-blue-400'
              }`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {editingId === item.id ? (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id, item.type)}
                    onBlur={() => handleSaveEdit(item.id, item.type)}
                    placeholder="Name (optional)"
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <span className="text-sm">
                    {ITEM_ICONS[item.type]} {item.name || ITEM_LABELS[item.type]}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleStartEdit(item.id, item.name)}
                      className="text-xs px-1 text-gray-500 hover:text-gray-700"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-xs px-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </li>
          )})}
        </ul>
      )}
    </div>
  )
}
