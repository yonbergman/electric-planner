'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Home, DoorOpen, CookingPot, Sofa, Footprints,
  Bed, Bath, Tv, Briefcase, ArrowUpDown, TreePalm, Baby, Shirt, Car, Warehouse,
  UtensilsCrossed, Dumbbell, Gamepad2, Music, Book, Flower2, Dog, Waves,
  LucideIcon
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  onNavigate?: () => void
}

// Smart icon detection based on room name
const ROOM_PATTERNS: Array<{ patterns: RegExp[]; icon: LucideIcon }> = [
  { patterns: [/entry|entrance|foyer|lobby/i], icon: DoorOpen },
  { patterns: [/kitchen|מטבח/i], icon: CookingPot },
  { patterns: [/living|lounge|family|salon|סלון/i], icon: Sofa },
  { patterns: [/hall|corridor|מסדרון/i], icon: Footprints },
  { patterns: [/master\s*(bed)?|bedroom|חדר שינה/i], icon: Bed },
  { patterns: [/bath|shower|toilet|wc|שירותים|אמבט/i], icon: Bath },
  { patterns: [/cinema|theater|media/i], icon: Tv },
  { patterns: [/office|study|work|משרד/i], icon: Briefcase },
  { patterns: [/stair|מדרגות/i], icon: ArrowUpDown },
  { patterns: [/patio|balcon|terrace|deck|garden|מרפסת|גינה/i], icon: TreePalm },
  { patterns: [/kid|child|nursery|baby|ילד/i], icon: Baby },
  { patterns: [/closet|wardrobe|laundry|ארון|כביסה/i], icon: Shirt },
  { patterns: [/garage|parking|חניה/i], icon: Car },
  { patterns: [/storage|basement|cellar|מחסן/i], icon: Warehouse },
  { patterns: [/dining|אוכל/i], icon: UtensilsCrossed },
  { patterns: [/gym|fitness|workout/i], icon: Dumbbell },
  { patterns: [/game|play|משחק/i], icon: Gamepad2 },
  { patterns: [/music|studio/i], icon: Music },
  { patterns: [/librar|reading/i], icon: Book },
  { patterns: [/sun\s*room|conservator/i], icon: Flower2 },
  { patterns: [/pet|dog|cat/i], icon: Dog },
  { patterns: [/pool|spa|jacuzzi/i], icon: Waves },
]

function getRoomIcon(name: string): LucideIcon {
  for (const { patterns, icon } of ROOM_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(name)) return icon
    }
  }
  return Home
}

export default function Sidebar({ onNavigate }: Props) {
  const { rooms, selectedRoomId, addRoom, selectRoom, deleteRoom, updateRoom } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleAddRoom = () => {
    const newRoom = addRoom('New Room')
    // Find the newly created room and start editing
    const newRoomId = useStore.getState().rooms[useStore.getState().rooms.length - 1]?.id
    if (newRoomId) {
      setEditingId(newRoomId)
      setEditName('New Room')
    }
  }

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      updateRoom(id, editName.trim())
    }
    setEditingId(null)
  }

  const handleSelectRoom = (id: string) => {
    selectRoom(id)
    onNavigate?.()
  }

  return (
    <div className="w-64 bg-white h-full flex flex-col border-r border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rooms</h2>
      </div>

      {/* Room list */}
      <ul className="flex-1 overflow-auto p-2 pb-16 space-y-1">
        {rooms.map((room) => {
          const RoomIcon = getRoomIcon(room.name)
          return (
          <li key={room.id}>
            {editingId === room.id ? (
              <div className="flex gap-1 p-1">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(room.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => handleSaveEdit(room.id)}
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-silver-500"
                />
              </div>
            ) : (
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-all ${
                  selectedRoomId === room.id
                    ? 'bg-silver-500 text-white shadow-md shadow-silver-500/30'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => handleSelectRoom(room.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <RoomIcon size={16} className={selectedRoomId === room.id ? 'text-silver-200' : 'text-slate-400'} />
                  <span className="text-sm font-medium truncate">{room.name}</span>
                </div>
                <div className={`flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedRoomId === room.id ? 'opacity-100' : ''
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(room.id, room.name)
                    }}
                    aria-label={`Edit ${room.name}`}
                    className={`p-1.5 rounded-md transition-colors ${
                      selectedRoomId === room.id
                        ? 'hover:bg-silver-400'
                        : 'hover:bg-slate-200'
                    }`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm({ id: room.id, name: room.name })
                    }}
                    aria-label={`Delete ${room.name}`}
                    className={`p-1.5 rounded-md transition-colors ${
                      selectedRoomId === room.id
                        ? 'hover:bg-red-400'
                        : 'hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </li>
        )})}
      </ul>

      {rooms.length === 0 && (
        <div className="text-center py-8 px-4 flex-1 flex flex-col justify-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-lg flex items-center justify-center">
            <Home size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 mb-1">No rooms yet</p>
          <p className="text-xs text-slate-400">Add a room to get started</p>
        </div>
      )}

      {/* Add room button at bottom */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleAddRoom}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-silver-600 hover:bg-silver-50 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Room
        </button>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete room?"
          message={`"${deleteConfirm.name}" and all its boxes, modules, and items will be deleted.`}
          onConfirm={() => {
            deleteRoom(deleteConfirm.id)
            setDeleteConfirm(null)
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
