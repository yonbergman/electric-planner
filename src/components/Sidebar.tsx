'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Home } from 'lucide-react'
import { useStore } from '@/store/useStore'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: Props) {
  const { rooms, selectedRoomId, addRoom, selectRoom, deleteRoom, updateRoom } = useStore()
  const [newRoomName, setNewRoomName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      addRoom(newRoomName.trim())
      setNewRoomName('')
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
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Rooms</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
            placeholder="New room..."
            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
          <button
            onClick={handleAddRoom}
            aria-label="Add room"
            className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Room list */}
      <ul className="flex-1 overflow-auto p-2 space-y-1">
        {rooms.map((room) => (
          <li key={room.id}>
            {editingId === room.id ? (
              <div className="flex gap-1 p-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(room.id)}
                  onBlur={() => handleSaveEdit(room.id)}
                  autoFocus
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-all ${
                  selectedRoomId === room.id
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => handleSelectRoom(room.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Home size={16} className={selectedRoomId === room.id ? 'text-indigo-200' : 'text-slate-400'} />
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
                        ? 'hover:bg-indigo-400'
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
        ))}
      </ul>

      {rooms.length === 0 && (
        <div className="text-center py-8 px-4">
          <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
            <Home size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 mb-1">No rooms yet</p>
          <p className="text-xs text-slate-400">Add a room above to get started</p>
        </div>
      )}

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
