'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { ItemType, ITEM_LABELS, DEFAULT_ITEM_ICONS, IconName } from '@/types'
import ConfirmDialog from './ConfirmDialog'
import ItemIcon from './ItemIcon'
import IconPicker from './IconPicker'

const ITEM_TYPES: ItemType[] = ['light', 'ceiling-light', 'ceiling-fan', 'blinds', 'leds', 'appliance']

interface Props {
  roomId: string
}

export default function ItemSection({ roomId }: Props) {
  const { items, modules, addItem, deleteItem, updateItem, setHoveredItem, hoveredModuleId } = useStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: ItemType } | null>(null)
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on escape or click outside
  useEffect(() => {
    if (!showDropdown) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const roomItems = items.filter((i) => i.roomId === roomId)

  const handleAdd = (type: ItemType) => {
    addItem(roomId, type)
    setShowDropdown(false)
  }

  const handleStartEdit = (id: string, name: string | undefined) => {
    setEditingId(id)
    setEditName(name || '')
  }

  const handleSaveEdit = (id: string) => {
    updateItem(id, { name: editName.trim() || undefined })
    setEditingId(null)
  }

  const handleIconChange = (id: string, icon: IconName) => {
    updateItem(id, { icon })
  }

  const getItemIcon = (item: { type: ItemType; icon?: IconName }) => {
    return item.icon || DEFAULT_ITEM_ICONS[item.type]
  }

  return (
    <div className="w-64 p-6 overflow-auto bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-600">ITEMS</h2>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Add item"
            aria-expanded={showDropdown}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            + Add
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-8 bg-white border rounded shadow-lg py-1 z-10 min-w-36">
              {ITEM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleAdd(type)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  <ItemIcon icon={DEFAULT_ITEM_ICONS[type]} size={16} className="text-gray-600" />
                  {ITEM_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {roomItems.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400 mb-2">No items yet</p>
          <p className="text-xs text-gray-400 mb-3">Items are things you want to control (lights, fans, blinds)</p>
          <button
            onClick={() => setShowDropdown(true)}
            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            + Add first item
          </button>
        </div>
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                    onBlur={() => handleSaveEdit(item.id)}
                    placeholder="Name (optional)"
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 text-sm relative">
                    <button
                      onClick={() => setIconPickerFor(iconPickerFor === item.id ? null : item.id)}
                      className="text-gray-600 hover:text-blue-500 transition-colors"
                      aria-label="Change icon"
                    >
                      <ItemIcon icon={getItemIcon(item)} size={16} />
                    </button>
                    {iconPickerFor === item.id && (
                      <IconPicker
                        selectedIcon={getItemIcon(item)}
                        onSelect={(icon) => handleIconChange(item.id, icon)}
                        onClose={() => setIconPickerFor(null)}
                      />
                    )}
                    <span>{item.name || ITEM_LABELS[item.type]}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleStartEdit(item.id, item.name)}
                      aria-label={`Edit ${item.name || ITEM_LABELS[item.type]}`}
                      className="text-xs px-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: item.id, name: item.name || ITEM_LABELS[item.type], type: item.type })}
                      aria-label={`Delete ${item.name || ITEM_LABELS[item.type]}`}
                      className="text-xs px-1 text-red-500 hover:text-red-700 focus:outline-none focus:text-red-700"
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

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete item?"
          message={`"${deleteConfirm.name}" will be removed and disconnected from any modules.`}
          onConfirm={() => {
            deleteItem(deleteConfirm.id)
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
