'use client'

import { useState } from 'react'
import { Plus, Package, Zap } from 'lucide-react'
import { useStore } from '@/store/useStore'
import BoxCard from './BoxCard'
import BoxEditor from './BoxEditor'
import ItemSection from './ItemSection'
import { Box } from '@/types'

type MobileTab = 'boxes' | 'items'

export default function RoomView() {
  const { rooms, boxes, selectedRoomId } = useStore()
  const [editingBox, setEditingBox] = useState<Box | undefined>(undefined)
  const [showNewBox, setShowNewBox] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('boxes')

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

      {/* Mobile tabs - only visible below lg breakpoint */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setMobileTab('boxes')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'boxes'
              ? 'text-copper-600 border-b-2 border-copper-500 bg-copper-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Package size={18} />
          Boxes
        </button>
        <button
          onClick={() => setMobileTab('items')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'items'
              ? 'text-copper-600 border-b-2 border-copper-500 bg-copper-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Zap size={18} />
          Items
        </button>
      </div>

      {/* Content area - tabs on mobile, side-by-side on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Boxes Section - hidden on mobile when items tab active */}
        <div className={`flex-1 p-4 sm:p-6 pb-24 overflow-auto ${mobileTab !== 'boxes' ? 'hidden lg:block' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:block">Boxes</h2>
            <button
              onClick={() => setShowNewBox(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-copper-500 text-white text-sm font-medium rounded-lg hover:bg-copper-600 transition-colors shadow-sm shadow-copper-500/20 ml-auto"
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
                className="px-5 py-2.5 bg-copper-500 text-white text-sm font-medium rounded-lg hover:bg-copper-600 transition-colors shadow-md shadow-copper-500/20"
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

        {/* Items Section - hidden on mobile when boxes tab active */}
        <div className={`lg:border-l border-slate-200 lg:h-full ${mobileTab !== 'items' ? 'hidden lg:block' : ''}`}>
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
