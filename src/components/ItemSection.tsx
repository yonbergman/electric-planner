'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Zap } from 'lucide-react'
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
    <div className="w-full lg:w-72 p-4 sm:p-6 pb-24 overflow-auto bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:block">Items</h2>
        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Add item"
            aria-expanded={showDropdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-copper-500 text-white text-sm font-medium rounded-lg hover:bg-copper-600 transition-colors shadow-sm shadow-copper-500/20"
          >
            <Plus size={16} />
            Add
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-10 min-w-44">
              {ITEM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleAdd(type)}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                >
                  <ItemIcon icon={DEFAULT_ITEM_ICONS[type]} size={18} className="text-slate-500" />
                  <span className="text-slate-700">{ITEM_LABELS[type]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {roomItems.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-lg flex items-center justify-center">
            <Zap size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 mb-1">No items yet</p>
          <p className="text-xs text-slate-400 mb-4">Items are things you control<br />(lights, fans, blinds)</p>
          <button
            onClick={() => setShowDropdown(true)}
            className="px-4 py-2 bg-copper-500 text-white text-sm font-medium rounded-lg hover:bg-copper-600 transition-colors shadow-sm shadow-copper-500/20"
          >
            <Plus size={16} className="inline mr-1 -mt-0.5" />
            Add first item
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
              className={`bg-slate-50 rounded-lg p-3 cursor-pointer transition-all ${
                isHighlighted
                  ? 'bg-copper-50 ring-2 ring-copper-400 shadow-lg shadow-copper-500/20'
                  : 'hover:bg-slate-100'
              }`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {editingId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                    onBlur={() => handleSaveEdit(item.id)}
                    placeholder="Name (optional)"
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper-500"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-sm relative min-w-0">
                    <button
                      onClick={() => setIconPickerFor(iconPickerFor === item.id ? null : item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isHighlighted ? 'bg-copper-100 text-copper-600' : 'bg-white text-slate-500 hover:text-copper-500'
                      }`}
                      aria-label="Change icon"
                    >
                      <ItemIcon icon={getItemIcon(item)} size={18} />
                    </button>
                    {iconPickerFor === item.id && (
                      <IconPicker
                        selectedIcon={getItemIcon(item)}
                        onSelect={(icon) => handleIconChange(item.id, icon)}
                        onClose={() => setIconPickerFor(null)}
                      />
                    )}
                    <span className="font-medium text-slate-700 truncate">{item.name || ITEM_LABELS[item.type]}</span>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(item.id, item.name)}
                      aria-label={`Edit ${item.name || ITEM_LABELS[item.type]}`}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-md transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: item.id, name: item.name || ITEM_LABELS[item.type], type: item.type })}
                      aria-label={`Delete ${item.name || ITEM_LABELS[item.type]}`}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
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
