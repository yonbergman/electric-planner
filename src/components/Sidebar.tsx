'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'

export default function Sidebar() {
  const { rooms, selectedRoomId, addRoom, selectRoom, deleteRoom, updateRoom } = useStore()
  const [newRoomName, setNewRoomName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

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
          className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
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
                    className="text-xs px-1 hover:bg-blue-600 rounded"
                  >
                    ✎
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRoom(room.id)
                    }}
                    className="text-xs px-1 hover:bg-red-500 rounded"
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
        <p className="text-sm text-gray-400 italic">No rooms yet</p>
      )}
    </div>
  )
}
