'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import ConfirmDialog from './ConfirmDialog'

export default function Sidebar() {
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

  return (
    <div className="w-56 bg-gray-100 h-full p-4 flex flex-col">
      <h2 className="text-sm font-semibold text-gray-600 mb-2">ROOMS</h2>
      <div className="flex gap-1 mb-2">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
          placeholder="New room..."
          className="flex-1 px-2 py-1 text-sm border rounded"
        />
        <button
          onClick={handleAddRoom}
          aria-label="Add room"
          className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          +
        </button>
      </div>
      <ul className="space-y-1 flex-1 overflow-auto">
        {rooms.map((room) => (
          <li key={room.id}>
            {editingId === room.id ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(room.id)}
                  onBlur={() => handleSaveEdit(room.id)}
                  autoFocus
                  className="flex-1 px-2 py-1 text-sm border rounded"
                />
              </div>
            ) : (
              <div
                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer group ${
                  selectedRoomId === room.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
                }`}
                onClick={() => selectRoom(room.id)}
              >
                <span className="text-sm truncate">{room.name}</span>
                <div className={`flex gap-1 opacity-0 group-hover:opacity-100 ${
                  selectedRoomId === room.id ? 'opacity-100' : ''
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(room.id, room.name)
                    }}
                    aria-label={`Edit ${room.name}`}
                    className="text-xs px-1 hover:bg-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm({ id: room.id, name: room.name })
                    }}
                    aria-label={`Delete ${room.name}`}
                    className="text-xs px-1 hover:bg-red-500 rounded focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {rooms.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">No rooms yet</p>
          <p className="text-xs text-gray-400">Add a room above to get started</p>
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
