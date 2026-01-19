'use client'

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-lg flex items-center justify-center">
            <Package size={32} className="text-slate-400" />
          </div>
          <p className="text-lg text-slate-500 font-medium">Select a room from the sidebar</p>
          <p className="text-sm text-slate-400 mt-1">or create a new one to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Room header */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{selectedRoom.name}</h1>
      </div>

      {/* Content area - responsive stack */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Boxes Section */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Boxes</h2>
            <button
              onClick={() => setShowNewBox(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-500/20"
            >
              <Plus size={16} />
              Add Box
            </button>
          </div>

          {roomBoxes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package size={28} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium mb-1">No boxes yet</p>
              <p className="text-sm text-slate-400 mb-5">Boxes are electrical switch plates that hold modules</p>
              <button
                onClick={() => setShowNewBox(true)}
                className="px-5 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/20"
              >
                <Plus size={16} className="inline mr-1.5 -mt-0.5" />
                Add first box
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {roomBoxes.map((box) => (
                <BoxCard key={box.id} box={box} roomId={selectedRoomId!} onEdit={() => setEditingBox(box)} />
              ))}
            </div>
          )}
        </div>

        {/* Items Section - responsive */}
        <div className="lg:border-l border-t lg:border-t-0 border-slate-200">
          <ItemSection roomId={selectedRoomId!} />
        </div>
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
