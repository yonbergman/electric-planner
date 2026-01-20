'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Upload, Square, Pentagon, Hand, Trash2, Plus, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Point, FloorPlan } from '@/types'

type DrawMode = 'pan' | 'rectangle' | 'polygon' | 'place'

interface DraggedEntity {
  type: 'box' | 'item'
  id: string
  name: string
}

export default function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { floorPlans, roomPolygons, mapPositions, rooms, boxes, items, addFloorPlan, deleteFloorPlan, addRoomPolygon, setMapPosition } = useStore()

  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null)
  const [drawMode, setDrawMode] = useState<DrawMode>('pan')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([])
  const [currentRect, setCurrentRect] = useState<{ start: Point; end: Point } | null>(null)
  const [isDrawingRect, setIsDrawingRect] = useState(false)
  const [selectedRoomForDraw, setSelectedRoomForDraw] = useState<string | null>(null)
  const [draggedEntity, setDraggedEntity] = useState<DraggedEntity | null>(null)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())

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

    // Draw room polygons
    const polygons = roomPolygons.filter(p => p.floorPlanId === selectedFloorPlan)
    polygons.forEach(polygon => {
      const room = rooms.find(r => r.id === polygon.roomId)
      if (!room || polygon.points.length < 3) return

      ctx.beginPath()
      ctx.moveTo(polygon.points[0].x, polygon.points[0].y)
      polygon.points.forEach(point => ctx.lineTo(point.x, point.y))
      ctx.closePath()

      ctx.fillStyle = 'rgba(192, 132, 252, 0.1)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'
      ctx.lineWidth = 2 / zoom
      ctx.stroke()

      // Draw room name
      const centerX = polygon.points.reduce((sum, p) => sum + p.x, 0) / polygon.points.length
      const centerY = polygon.points.reduce((sum, p) => sum + p.y, 0) / polygon.points.length
      ctx.fillStyle = '#7c3aed'
      ctx.font = `${14 / zoom}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(room.name, centerX, centerY)
    })

    // Draw current polygon being drawn
    if (currentPolygon.length > 0) {
      ctx.beginPath()
      ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y)
      currentPolygon.forEach(point => ctx.lineTo(point.x, point.y))
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2 / zoom
      ctx.stroke()

      currentPolygon.forEach(point => {
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4 / zoom, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw current rectangle being drawn
    if (currentRect && isDrawingRect) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2 / zoom
      ctx.strokeRect(
        currentRect.start.x,
        currentRect.start.y,
        currentRect.end.x - currentRect.start.x,
        currentRect.end.y - currentRect.start.y
      )
    }

    // Draw boxes and items on map
    const positions = mapPositions.filter(p => p.floorPlanId === selectedFloorPlan)
    positions.forEach(pos => {
      if (pos.entityType === 'box') {
        const box = boxes.find(b => b.id === pos.entityId)
        if (box) {
          ctx.fillStyle = '#f97316'
          ctx.fillRect(pos.x - 15, pos.y - 15, 30, 30)
          ctx.fillStyle = 'white'
          ctx.font = `${10 / zoom}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(box.name.substring(0, 3), pos.x, pos.y + 3)
        }
      } else if (pos.entityType === 'item') {
        const item = items.find(i => i.id === pos.entityId)
        if (item) {
          ctx.fillStyle = '#8b5cf6'
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = 'white'
          ctx.font = `${10 / zoom}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(item.name?.substring(0, 2) || '?', pos.x, pos.y + 3)
        }
      }
    })

    ctx.restore()
  }, [currentFloorPlan, pan, zoom, roomPolygons, rooms, currentPolygon, currentRect, isDrawingRect, mapPositions, boxes, items, selectedFloorPlan, loadedImages])

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

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = screenToCanvas(e.clientX, e.clientY)

    if (drawMode === 'pan' || e.button === 1) {
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else if (drawMode === 'polygon' && selectedRoomForDraw) {
      setCurrentPolygon(prev => [...prev, pos])
    } else if (drawMode === 'rectangle' && selectedRoomForDraw) {
      setIsDrawingRect(true)
      setCurrentRect({ start: pos, end: pos })
    } else if (drawMode === 'place' && draggedEntity && selectedFloorPlan) {
      setMapPosition(selectedFloorPlan, draggedEntity.type, draggedEntity.id, pos.x, pos.y)
      setDraggedEntity(null)
      setDrawMode('pan')
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + (e.clientX - lastMousePos.x),
        y: prev.y + (e.clientY - lastMousePos.y)
      }))
      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else if (isDrawingRect && currentRect) {
      const pos = screenToCanvas(e.clientX, e.clientY)
      setCurrentRect({ ...currentRect, end: pos })
    }
  }

  const handleMouseUp = () => {
    if (isDrawingRect && currentRect && selectedRoomForDraw && selectedFloorPlan) {
      const points: Point[] = [
        currentRect.start,
        { x: currentRect.end.x, y: currentRect.start.y },
        currentRect.end,
        { x: currentRect.start.x, y: currentRect.end.y }
      ]
      addRoomPolygon(selectedRoomForDraw, selectedFloorPlan, points)
      setCurrentRect(null)
      setIsDrawingRect(false)
      setDrawMode('pan')
      setSelectedRoomForDraw(null)
    }
    setIsPanning(false)
  }

  const handleDoubleClick = () => {
    if (drawMode === 'polygon' && currentPolygon.length >= 3 && selectedRoomForDraw && selectedFloorPlan) {
      addRoomPolygon(selectedRoomForDraw, selectedFloorPlan, currentPolygon)
      setCurrentPolygon([])
      setDrawMode('pan')
      setSelectedRoomForDraw(null)
    }
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

  const startDrawing = (mode: 'rectangle' | 'polygon') => {
    if (rooms.length === 0) {
      alert('Please create at least one room first')
      return
    }
    setDrawMode(mode)
    setSelectedRoomForDraw(rooms[0].id)
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

            <select
              value={selectedFloorPlan || ''}
              onChange={(e) => setSelectedFloorPlan(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {floorPlans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>

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

            <div className="w-px h-6 bg-slate-300" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setDrawMode('pan')}
                className={`p-2 rounded-lg transition-colors ${drawMode === 'pan' ? 'bg-copper-100 text-copper-700' : 'hover:bg-slate-100'}`}
                title="Pan mode"
              >
                <Hand size={18} />
              </button>
              <button
                onClick={() => startDrawing('rectangle')}
                className={`p-2 rounded-lg transition-colors ${drawMode === 'rectangle' ? 'bg-copper-100 text-copper-700' : 'hover:bg-slate-100'}`}
                title="Draw rectangle room"
              >
                <Square size={18} />
              </button>
              <button
                onClick={() => startDrawing('polygon')}
                className={`p-2 rounded-lg transition-colors ${drawMode === 'polygon' ? 'bg-copper-100 text-copper-700' : 'hover:bg-slate-100'}`}
                title="Draw polygon room"
              >
                <Pentagon size={18} />
              </button>
            </div>

            {(drawMode === 'rectangle' || drawMode === 'polygon') && (
              <>
                <select
                  value={selectedRoomForDraw || ''}
                  onChange={(e) => setSelectedRoomForDraw(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setDrawMode('pan')
                    setCurrentPolygon([])
                    setCurrentRect(null)
                    setSelectedRoomForDraw(null)
                  }}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Cancel drawing"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </>
        )}

        <div className="ml-auto text-sm text-slate-600">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Sidebar with entities */}
      {currentFloorPlan && (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-white border-r border-slate-200 overflow-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Boxes</h3>
              <div className="space-y-2">
                {boxes.map(box => {
                  const room = rooms.find(r => r.id === box.roomId)
                  return (
                    <button
                      key={box.id}
                      onClick={() => {
                        setDraggedEntity({ type: 'box', id: box.id, name: box.name })
                        setDrawMode('place')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-copper-50 transition-colors ${
                        draggedEntity?.id === box.id ? 'bg-copper-100' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{box.name}</div>
                      <div className="text-xs text-slate-500">{room?.name}</div>
                    </button>
                  )
                })}
              </div>

              <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-6">Items</h3>
              <div className="space-y-2">
                {items.map(item => {
                  const room = rooms.find(r => r.id === item.roomId)
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDraggedEntity({ type: 'item', id: item.id, name: item.name || 'Item' })
                        setDrawMode('place')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors ${
                        draggedEntity?.id === item.id ? 'bg-purple-100' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{item.name || 'Unnamed item'}</div>
                      <div className="text-xs text-slate-500">{room?.name}</div>
                    </button>
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
              onDoubleClick={handleDoubleClick}
              className="cursor-crosshair"
              style={{
                cursor: drawMode === 'pan' ? (isPanning ? 'grabbing' : 'grab') :
                       drawMode === 'place' ? 'crosshair' : 'crosshair'
              }}
            />

            {drawMode === 'polygon' && currentPolygon.length > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
                Double-click to finish polygon ({currentPolygon.length} points)
              </div>
            )}

            {drawMode === 'place' && draggedEntity && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
                Click to place: {draggedEntity.name}
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
