'use client'

import { useStore } from '@/store/useStore'
import { MODULE_LABELS, ITEM_LABELS, ModuleType } from '@/types'

const ITEM_ICONS: Record<string, string> = {
  'light': '💡',
  'ceiling-fan': '🌀',
  'blinds': '🪟',
  'leds': '✨',
  'appliance': '🔌',
}

export default function SummaryPage({ onClose }: { onClose: () => void }) {
  const { rooms, boxes, modules, items } = useStore()

  // Bill of materials - count modules by type
  const moduleCounts = modules.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1
    return acc
  }, {} as Record<ModuleType, number>)

  // Count boxes by size
  const boxCounts = boxes.reduce((acc, b) => {
    acc[b.size] = (acc[b.size] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Find unconnected items (items not linked to any module)
  const connectedItemIds = new Set(modules.map(m => m.itemId).filter(Boolean))
  const unconnectedItems = items.filter(i => !connectedItemIds.has(i.id))

  // Per-room stats
  const roomStats = rooms.map(room => {
    const roomBoxes = boxes.filter(b => b.roomId === room.id)
    const roomBoxIds = roomBoxes.map(b => b.id)
    const roomModules = modules.filter(m => roomBoxIds.includes(m.boxId))
    const roomItems = items.filter(i => i.roomId === room.id)
    const roomConnectedIds = new Set(roomModules.map(m => m.itemId).filter(Boolean))
    const roomUnconnected = roomItems.filter(i => !roomConnectedIds.has(i.id))

    return {
      room,
      boxCount: roomBoxes.length,
      moduleCount: roomModules.length,
      itemCount: roomItems.length,
      unconnectedCount: roomUnconnected.length,
    }
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold">Summary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="overflow-auto p-6 space-y-6">
          {/* Unconnected Items Alert */}
          {unconnectedItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">⚠️ Unconnected Items ({unconnectedItems.length})</h3>
              <ul className="space-y-1">
                {unconnectedItems.map(item => {
                  const room = rooms.find(r => r.id === item.roomId)
                  return (
                    <li key={item.id} className="text-sm text-amber-700">
                      {ITEM_ICONS[item.type]} {item.name || ITEM_LABELS[item.type]}
                      <span className="text-amber-500 ml-2">in {room?.name || 'Unknown room'}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {unconnectedItems.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">✓ All items are connected to modules</p>
            </div>
          )}

          {/* Overview Stats */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Overview</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{rooms.length}</div>
                <div className="text-xs text-gray-500">Rooms</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{boxes.length}</div>
                <div className="text-xs text-gray-500">Boxes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{modules.length}</div>
                <div className="text-xs text-gray-500">Modules</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{items.length}</div>
                <div className="text-xs text-gray-500">Items</div>
              </div>
            </div>

            {/* Per-room breakdown */}
            {roomStats.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 font-medium">Room</th>
                    <th className="py-2 font-medium text-center">Boxes</th>
                    <th className="py-2 font-medium text-center">Modules</th>
                    <th className="py-2 font-medium text-center">Items</th>
                    <th className="py-2 font-medium text-center">Unconnected</th>
                  </tr>
                </thead>
                <tbody>
                  {roomStats.map(({ room, boxCount, moduleCount, itemCount, unconnectedCount }) => (
                    <tr key={room.id} className="border-b border-gray-100">
                      <td className="py-2">{room.name}</td>
                      <td className="py-2 text-center">{boxCount}</td>
                      <td className="py-2 text-center">{moduleCount}</td>
                      <td className="py-2 text-center">{itemCount}</td>
                      <td className="py-2 text-center">
                        {unconnectedCount > 0 ? (
                          <span className="text-amber-600">{unconnectedCount}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bill of Materials */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Bill of Materials</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Boxes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Boxes</h4>
                {Object.keys(boxCounts).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No boxes yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 font-medium">Size</th>
                        <th className="py-2 font-medium text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[3, 4, 7, 14]
                        .filter(size => boxCounts[size])
                        .map(size => (
                          <tr key={size} className="border-b border-gray-200 last:border-0">
                            <td className="py-2">{size}-slot box</td>
                            <td className="py-2 text-right font-medium">{boxCounts[size]}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-medium">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right">{boxes.length}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Modules */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Modules</h4>
                {Object.keys(moduleCounts).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No modules yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 font-medium">Type</th>
                        <th className="py-2 font-medium text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(moduleCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <tr key={type} className="border-b border-gray-200 last:border-0">
                            <td className="py-2">{MODULE_LABELS[type as ModuleType]}</td>
                            <td className="py-2 text-right font-medium">{count}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-medium">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right">{modules.length}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
