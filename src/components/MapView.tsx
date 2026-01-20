'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Upload, Hand, Trash2, X, Pencil, Box as BoxIcon, Filter } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Point, FloorPlan, DEFAULT_ITEM_ICONS } from '@/types'
import ItemIcon from '@/components/ItemIcon'

type DrawMode = 'pan' | 'place' | 'move'

interface DraggedEntity {
  type: 'box' | 'item'
  id: string
  name: string
}

interface MovingEntity {
  type: 'box' | 'item'
  id: string
  positionId: string
  offsetX: number
  offsetY: number
}

interface HoveredEntity {
  type: 'box' | 'item'
  id: string
  x: number
  y: number
}

export default function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { floorPlans, roomPolygons, mapPositions, rooms, boxes, items, modules, addFloorPlan, deleteFloorPlan, setMapPosition, updateFloorPlan } = useStore()

  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null)
  const [drawMode, setDrawMode] = useState<DrawMode>('pan')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [draggedEntity, setDraggedEntity] = useState<DraggedEntity | null>(null)
  const [movingEntity, setMovingEntity] = useState<MovingEntity | null>(null)
  const [hoveredEntity, setHoveredEntity] = useState<HoveredEntity | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'box' | 'item', id: string } | null>(null)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [hidePlaced, setHidePlaced] = useState(false)
  const [editingFloorName, setEditingFloorName] = useState<string | null>(null)
  const [floorNameInput, setFloorNameInput] = useState('')

  const currentFloorPlan = floorPlans.find(f => f.id === selectedFloorPlan)

  // Load floor plan images
  useEffect(() => {
    floorPlans.forEach(plan => {
      if (!loadedImages.has(plan.id)) {
        const img = new Image()
        img.onload = () => {
          setLoadedImages(prev => new Map(prev).set(plan.id, img))
        }
        img.src = plan.imageUrl
      }
    })
  }, [floorPlans, loadedImages])

  // Auto-select first floor plan
  useEffect(() => {
    if (!selectedFloorPlan && floorPlans.length > 0) {
      setSelectedFloorPlan(floorPlans[0].id)
    }
  }, [floorPlans, selectedFloorPlan])

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const x = (screenX - rect.left - pan.x) / zoom
    const y = (screenY - rect.top - pan.y) / zoom
    return { x, y }
  }, [zoom, pan])

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom + pan.x,
      y: canvasY * zoom + pan.y
    }
  }, [zoom, pan])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !currentFloorPlan) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw floor plan image
    const img = loadedImages.get(currentFloorPlan.id)
    if (img) {
      ctx.drawImage(img, 0, 0, currentFloorPlan.width, currentFloorPlan.height)
    } else {
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(0, 0, currentFloorPlan.width, currentFloorPlan.height)
    }

    // Draw boxes and items on map
    const positions = mapPositions.filter(p => p.floorPlanId === selectedFloorPlan)

    positions.forEach(pos => {
      const isHovered = hoveredEntity?.type === pos.entityType && hoveredEntity?.id === pos.entityId
      const isSelected = selectedEntity?.type === pos.entityType && selectedEntity?.id === pos.entityId

      if (pos.entityType === 'box') {
        const box = boxes.find(b => b.id === pos.entityId)
        if (box) {
          // Draw wiring connections if hovered
          if (isHovered) {
            const connectedModules = modules.filter(m => m.boxId === box.id && m.itemId)
            connectedModules.forEach(mod => {
              const item = items.find(i => i.id === mod.itemId)
              if (item) {
                const itemPos = mapPositions.find(p => p.entityId === item.id && p.floorPlanId === selectedFloorPlan)
                if (itemPos) {
                  ctx.beginPath()
                  ctx.moveTo(pos.x, pos.y)
                  ctx.lineTo(itemPos.x, itemPos.y)
                  ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'
                  ctx.lineWidth = 2 / zoom
                  ctx.setLineDash([5 / zoom, 5 / zoom])
                  ctx.stroke()
                  ctx.setLineDash([])
                }
              }
            })
          }

          // Draw box
          ctx.fillStyle = isSelected ? '#ea580c' : isHovered ? '#fb923c' : '#f97316'
          ctx.fillRect(pos.x - 15, pos.y - 15, 30, 30)

          // Draw box icon (simple representation)
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 2 / zoom
          ctx.strokeRect(pos.x - 8, pos.y - 8, 16, 16)

          if (isSelected || isHovered) {
            ctx.strokeStyle = '#dc2626'
            ctx.lineWidth = 2 / zoom
            ctx.strokeRect(pos.x - 18, pos.y - 18, 36, 36)
          }
        }
      } else if (pos.entityType === 'item') {
        const item = items.find(i => i.id === pos.entityId)
        if (item) {
          // Draw wiring connections if hovered
          if (isHovered) {
            const connectedModules = modules.filter(m => m.itemId === item.id)
            connectedModules.forEach(mod => {
              const box = boxes.find(b => b.id === mod.boxId)
              if (box) {
                const boxPos = mapPositions.find(p => p.entityId === box.id && p.floorPlanId === selectedFloorPlan)
                if (boxPos) {
                  ctx.beginPath()
                  ctx.moveTo(pos.x, pos.y)
                  ctx.lineTo(boxPos.x, boxPos.y)
                  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
                  ctx.lineWidth = 2 / zoom
                  ctx.setLineDash([5 / zoom, 5 / zoom])
                  ctx.stroke()
                  ctx.setLineDash([])
                }
              }
            })
          }

          // Draw item circle
          ctx.fillStyle = isSelected ? '#7c3aed' : isHovered ? '#a78bfa' : '#8b5cf6'
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)
          ctx.fill()

          // Draw simple icon representation (text)
          const icon = item.icon || DEFAULT_ITEM_ICONS[item.type]
          ctx.fillStyle = 'white'
          ctx.font = `${10 / zoom}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(icon.substring(0, 2), pos.x, pos.y + 3)

          if (isSelected || isHovered) {
            ctx.strokeStyle = '#dc2626'
            ctx.lineWidth = 2 / zoom
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }
    })

    ctx.restore()
  }, [currentFloorPlan, pan, zoom, mapPositions, boxes, items, modules, selectedFloorPlan, loadedImages, hoveredEntity, selectedEntity])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      draw()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    if (e.shiftKey) {
      setPan(prev => ({
        x: prev.x - e.deltaY,
        y: prev.y
      }))
    } else {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(10, zoom * delta))

      const scale = newZoom / zoom
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * scale,
        y: mouseY - (mouseY - prev.y) * scale
      }))
      setZoom(newZoom)
    }
  }

  const findEntityAtPosition = useCallback((pos: Point) => {
    if (!selectedFloorPlan) return null

    const positions = mapPositions.filter(p => p.floorPlanId === selectedFloorPlan)

    for (const mapPos of positions) {
      const distance = Math.sqrt(Math.pow(pos.x - mapPos.x, 2) + Math.pow(pos.y - mapPos.y, 2))
      const hitRadius = mapPos.entityType === 'box' ? 15 : 12

      if (distance <= hitRadius) {
        return {
          type: mapPos.entityType,
          id: mapPos.entityId,
          positionId: mapPos.id,
          x: mapPos.x,
          y: mapPos.y
        }
      }
    }
    return null
  }, [selectedFloorPlan, mapPositions])

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = screenToCanvas(e.clientX, e.clientY)

    // Check if clicking on an existing entity to move it
    const entity = findEntityAtPosition(pos)

    if (entity && drawMode === 'pan') {
      // Start moving the entity
      setMovingEntity({
        type: entity.type,
        id: entity.id,
        positionId: entity.positionId,
        offsetX: entity.x - pos.x,
        offsetY: entity.y - pos.y
      })
      setSelectedEntity({ type: entity.type, id: entity.id })
    } else if (drawMode === 'pan' || e.button === 1) {
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
      if (!entity) {
        setSelectedEntity(null)
      }
    } else if (drawMode === 'place' && draggedEntity && selectedFloorPlan) {
      setMapPosition(selectedFloorPlan, draggedEntity.type, draggedEntity.id, pos.x, pos.y)
      setDraggedEntity(null)
      setDrawMode('pan')
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = screenToCanvas(e.clientX, e.clientY)

    if (movingEntity && selectedFloorPlan) {
      // Move the entity
      const newX = pos.x + movingEntity.offsetX
      const newY = pos.y + movingEntity.offsetY
      setMapPosition(selectedFloorPlan, movingEntity.type, movingEntity.id, newX, newY)
    } else if (isPanning) {
      setPan(prev => ({
        x: prev.x + (e.clientX - lastMousePos.x),
        y: prev.y + (e.clientY - lastMousePos.y)
      }))
      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else {
      // Update hover state
      const entity = findEntityAtPosition(pos)
      if (entity) {
        setHoveredEntity({ type: entity.type, id: entity.id, x: entity.x, y: entity.y })
      } else {
        setHoveredEntity(null)
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setMovingEntity(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        addFloorPlan(file.name, event.target?.result as string, img.width, img.height)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFloorNameEdit = (floorId: string, currentName: string) => {
    setEditingFloorName(floorId)
    setFloorNameInput(currentName)
  }

  const handleFloorNameSave = () => {
    if (editingFloorName && floorNameInput.trim()) {
      updateFloorPlan(editingFloorName, floorNameInput.trim())
    }
    setEditingFloorName(null)
    setFloorNameInput('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-copper-600 text-white rounded-lg hover:bg-copper-700 transition-colors text-sm font-medium"
          >
            <Upload size={16} />
            Upload Floor Plan
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {floorPlans.length > 0 && (
          <>
            <div className="w-px h-6 bg-slate-300" />

            <div className="flex items-center gap-2">
              {editingFloorName === selectedFloorPlan ? (
                <>
                  <input
                    type="text"
                    value={floorNameInput}
                    onChange={(e) => setFloorNameInput(e.target.value)}
                    onBlur={handleFloorNameSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFloorNameSave()
                      if (e.key === 'Escape') {
                        setEditingFloorName(null)
                        setFloorNameInput('')
                      }
                    }}
                    className="px-3 py-2 border border-copper-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-copper-500"
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <select
                    value={selectedFloorPlan || ''}
                    onChange={(e) => setSelectedFloorPlan(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {floorPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                  {selectedFloorPlan && currentFloorPlan && (
                    <button
                      onClick={() => handleFloorNameEdit(selectedFloorPlan, currentFloorPlan.name)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Rename floor plan"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </>
              )}

              {selectedFloorPlan && (
                <button
                  onClick={() => {
                    if (confirm('Delete this floor plan?')) {
                      deleteFloorPlan(selectedFloorPlan)
                      setSelectedFloorPlan(null)
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete floor plan"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-slate-300" />

            <button
              onClick={() => setDrawMode('pan')}
              className={`p-2 rounded-lg transition-colors ${drawMode === 'pan' ? 'bg-copper-100 text-copper-700' : 'hover:bg-slate-100'}`}
              title="Pan mode"
            >
              <Hand size={18} />
            </button>
          </>
        )}

        <div className="ml-auto text-sm text-slate-600">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Sidebar with entities */}
      {currentFloorPlan && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <button
                onClick={() => setHidePlaced(!hidePlaced)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  hidePlaced ? 'bg-copper-100 text-copper-700' : 'hover:bg-slate-100'
                }`}
              >
                <Filter size={16} />
                <span className="text-sm font-medium">Hide Placed</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="p-4">
                {rooms.map(room => {
                  const roomBoxes = boxes.filter(b => b.roomId === room.id)
                  const roomItems = items.filter(i => i.roomId === room.id)

                  const visibleBoxes = hidePlaced
                    ? roomBoxes.filter(b => !mapPositions.some(p => p.entityId === b.id && p.floorPlanId === selectedFloorPlan))
                    : roomBoxes

                  const visibleItems = hidePlaced
                    ? roomItems.filter(i => !mapPositions.some(p => p.entityId === i.id && p.floorPlanId === selectedFloorPlan))
                    : roomItems

                  if (visibleBoxes.length === 0 && visibleItems.length === 0) return null

                  return (
                    <div key={room.id} className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">{room.name}</h3>

                      {visibleBoxes.length > 0 && (
                        <div className="space-y-1 mb-3">
                          <div className="text-xs text-slate-500 mb-1">Boxes</div>
                          {visibleBoxes.map(box => {
                            const isPlaced = mapPositions.some(p => p.entityId === box.id && p.floorPlanId === selectedFloorPlan)
                            return (
                              <button
                                key={box.id}
                                onClick={() => {
                                  setDraggedEntity({ type: 'box', id: box.id, name: box.name })
                                  setDrawMode('place')
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-copper-50 transition-colors flex items-center gap-2 ${
                                  draggedEntity?.id === box.id ? 'bg-copper-100' : ''
                                }`}
                              >
                                <BoxIcon size={14} className="text-orange-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{box.name}</div>
                                  {isPlaced && <div className="text-xs text-green-600">Placed</div>}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {visibleItems.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 mb-1">Items</div>
                          {visibleItems.map(item => {
                            const isPlaced = mapPositions.some(p => p.entityId === item.id && p.floorPlanId === selectedFloorPlan)
                            const icon = item.icon || DEFAULT_ITEM_ICONS[item.type]
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setDraggedEntity({ type: 'item', id: item.id, name: item.name || 'Item' })
                                  setDrawMode('place')
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                                  draggedEntity?.id === item.id ? 'bg-purple-100' : ''
                                }`}
                              >
                                <ItemIcon icon={icon} size={14} className="text-purple-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{item.name || 'Unnamed item'}</div>
                                  {isPlaced && <div className="text-xs text-green-600">Placed</div>}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div ref={containerRef} className="flex-1 relative">
            <canvas
              ref={canvasRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair"
              style={{
                cursor: drawMode === 'pan' ? (isPanning || movingEntity ? 'grabbing' : 'grab') :
                       drawMode === 'place' ? 'crosshair' : 'grab'
              }}
            />

            {drawMode === 'place' && draggedEntity && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
                Click to place: {draggedEntity.name}
              </div>
            )}

            {/* Context panel for selected entity */}
            {selectedEntity && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64 max-h-96 overflow-auto">
                {selectedEntity.type === 'box' && (() => {
                  const box = boxes.find(b => b.id === selectedEntity.id)
                  const room = box ? rooms.find(r => r.id === box.roomId) : null
                  const boxModules = modules.filter(m => m.boxId === selectedEntity.id)

                  return box ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-800">Box Details</h3>
                        <button
                          onClick={() => setSelectedEntity(null)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-slate-500">Name</div>
                          <div className="font-medium">{box.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Room</div>
                          <div className="font-medium">{room?.name || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Size</div>
                          <div className="font-medium">{box.size} modules</div>
                        </div>
                        {boxModules.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Modules ({boxModules.length})</div>
                            <div className="space-y-1">
                              {boxModules.map(mod => {
                                const connectedItem = mod.itemId ? items.find(i => i.id === mod.itemId) : null
                                return (
                                  <div key={mod.id} className="text-xs bg-slate-50 px-2 py-1 rounded">
                                    <div className="font-medium">{mod.label}</div>
                                    {connectedItem && (
                                      <div className="text-slate-500">→ {connectedItem.name}</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null
                })()}

                {selectedEntity.type === 'item' && (() => {
                  const item = items.find(i => i.id === selectedEntity.id)
                  const room = item ? rooms.find(r => r.id === item.roomId) : null
                  const connectedModules = modules.filter(m => m.itemId === selectedEntity.id)

                  return item ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-800">Item Details</h3>
                        <button
                          onClick={() => setSelectedEntity(null)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-slate-500">Name</div>
                          <div className="font-medium">{item.name || 'Unnamed item'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Room</div>
                          <div className="font-medium">{room?.name || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Type</div>
                          <div className="font-medium capitalize">{item.type.replace('-', ' ')}</div>
                        </div>
                        {item.icon && (
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-500">Icon</div>
                            <ItemIcon icon={item.icon} size={16} />
                          </div>
                        )}
                        {connectedModules.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Wired to ({connectedModules.length})</div>
                            <div className="space-y-1">
                              {connectedModules.map(mod => {
                                const box = boxes.find(b => b.id === mod.boxId)
                                return (
                                  <div key={mod.id} className="text-xs bg-slate-50 px-2 py-1 rounded">
                                    <div className="font-medium">{mod.label}</div>
                                    {box && (
                                      <div className="text-slate-500">in {box.name}</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {floorPlans.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-lg flex items-center justify-center">
              <Upload size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">No floor plans yet</h3>
            <p className="text-sm text-slate-500 mb-4">Upload a floor plan image to get started</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-copper-600 text-white rounded-lg hover:bg-copper-700 transition-colors"
            >
              Upload Floor Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
