'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import BoxCard from './BoxCard'
import BoxEditor from './BoxEditor'
import ItemSection from './ItemSection'
import { Box } from '@/types'

export default function RoomView() {
  const { rooms, boxes, selectedRoomId } = useStore()
  const [editingBox, setEditingBox] = useState<Box | undefined>(undefined)
  const [showNewBox, setShowNewBox] = useState(false)

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const roomBoxes = boxes.filter((b) => b.roomId === selectedRoomId)

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">Select a room from the sidebar</p>
          <p className="text-sm">or create a new one to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">{selectedRoom.name}</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Boxes Section */}
        <div className="flex-1 p-6 overflow-auto border-r">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-600">BOXES</h2>
            <button
              onClick={() => setShowNewBox(true)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              + Add Box
            </button>
          </div>

          {roomBoxes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">No boxes yet</p>
              <p className="text-sm text-gray-400 mb-4">Boxes are electrical switch plates that hold modules</p>
              <button
                onClick={() => setShowNewBox(true)}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                + Add first box
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {roomBoxes.map((box) => (
                <BoxCard key={box.id} box={box} roomId={selectedRoomId!} onEdit={() => setEditingBox(box)} />
              ))}
            </div>
          )}
        </div>

        {/* Items Section */}
        <ItemSection roomId={selectedRoomId!} />
      </div>

      {(showNewBox || editingBox) && (
        <BoxEditor
          box={editingBox}
          roomId={selectedRoomId!}
          onClose={() => {
            setShowNewBox(false)
            setEditingBox(undefined)
          }}
        />
      )}
    </div>
  )
}
