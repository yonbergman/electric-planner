'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Upload, ZoomIn, ZoomOut, Move, Square, Pentagon, Hand, Trash2, X, Box as BoxIcon,
  Lightbulb, Circle, Edit2
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Point, ITEM_LABELS, DEFAULT_ITEM_ICONS } from '@/types'
import ItemIcon from './ItemIcon'

type Tool = 'pan' | 'rectangle' | 'polygon' | 'place-item' | 'place-box'

interface DragState {
  type: 'item' | 'box'
  id: string
  offset: Point
}

// Generate a color for each room based on its ID
function getRoomColor(roomId: string, rooms: { id: string }[]): string {
  const colors = [
    'rgba(239, 68, 68, 0.3)',   // red
    'rgba(34, 197, 94, 0.3)',   // green
    'rgba(59, 130, 246, 0.3)',  // blue
    'rgba(168, 85, 247, 0.3)',  // purple
    'rgba(236, 72, 153, 0.3)',  // pink
    'rgba(251, 146, 60, 0.3)',  // orange
    'rgba(14, 165, 233, 0.3)',  // cyan
    'rgba(163, 230, 53, 0.3)',  // lime
    'rgba(250, 204, 21, 0.3)',  // yellow
    'rgba(244, 114, 182, 0.3)', // fuchsia
  ]
  const index = rooms.findIndex(r => r.id === roomId)
  return colors[index % colors.length]
}

export default function MapView() {
  const {
    rooms, boxes, items, modules,
    floorPlans, roomPolygons, mapPositions,
    addFloorPlan, updateFloorPlan, deleteFloorPlan,
    addRoomPolygon, updateRoomPolygon, deleteRoomPolygon,
    setMapPosition, deleteMapPosition
  } = useStore()

  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('pan')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 })

  // Drawing state
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([])
  const [selectedRoomForDrawing, setSelectedRoomForDrawing] = useState<string | null>(null)
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null)

  // Placement state
  const [itemToPlace, setItemToPlace] = useState<string | null>(null)
  const [boxToPlace, setBoxToPlace] = useState<string | null>(null)

  // Dragging state
  const [dragging, setDragging] = useState<DragState | null>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; polygonId: string } | null>(null)

  // Hover/selection state
  const [hoveredEntity, setHoveredEntity] = useState<{ type: 'item' | 'box'; id: string } | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'item' | 'box'; id: string } | null>(null)

  // Floor plan name editing
  const [editingFloorPlanName, setEditingFloorPlanName] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  // Select first floor plan by default
  useEffect(() => {
    if (!selectedFloorPlanId && floorPlans.length > 0) {
      setSelectedFloorPlanId(floorPlans[0].id)
    }
  }, [floorPlans, selectedFloorPlanId])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        const newId = addFloorPlan(file.name, imageUrl)
        if (i === 0) setSelectedFloorPlanId(newId)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (screenX - rect.left - pan.x) / zoom,
      y: (screenY - rect.top - pan.y) / zoom,
    }
  }

  // Handle mouse wheel for zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    if (e.shiftKey) {
      // Shift + wheel = horizontal pan
      setPan(p => ({ x: p.x - e.deltaY, y: p.y }))
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + wheel = zoom (some browsers/trackpads)
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomDelta))

      // Zoom towards mouse position
      const zoomPoint = screenToCanvas(e.clientX, e.clientY)
      setPan({
        x: mouseX - zoomPoint.x * newZoom,
        y: mouseY - zoomPoint.y * newZoom,
      })
      setZoom(newZoom)
    } else {
      // Regular wheel = zoom
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomDelta))

      // Zoom towards mouse position
      const zoomPoint = screenToCanvas(e.clientX, e.clientY)
      setPan({
        x: mouseX - zoomPoint.x * newZoom,
        y: mouseY - zoomPoint.y * newZoom,
      })
      setZoom(newZoom)
    }
  }

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas || !selectedFloorPlanId) return

    const point = screenToCanvas(e.clientX, e.clientY)

    // Check if clicking on an existing item/box to drag
    if (tool === 'pan') {
      const positions = mapPositions.filter(p => p.floorPlanId === selectedFloorPlanId)
      for (const pos of positions) {
        const distance = Math.sqrt((pos.position.x - point.x) ** 2 + (pos.position.y - point.y) ** 2)
        if (distance < 20) {
          setDragging({
            type: pos.type,
            id: pos.id,
            offset: { x: point.x - pos.position.x, y: point.y - pos.position.y }
          })
          return
        }
      }

      // Start panning
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    if (tool === 'rectangle' && selectedRoomForDrawing) {
      setDrawingPoints([point])
    } else if (tool === 'polygon' && selectedRoomForDrawing) {
      setDrawingPoints([...drawingPoints, point])
    } else if (tool === 'place-item' && itemToPlace) {
      setMapPosition(itemToPlace, 'item', selectedFloorPlanId, point)
      setItemToPlace(null)
      setTool('pan')
    } else if (tool === 'place-box' && boxToPlace) {
      setMapPosition(boxToPlace, 'box', selectedFloorPlanId, point)
      setBoxToPlace(null)
      setTool('pan')
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    const point = screenToCanvas(e.clientX, e.clientY)
    setCurrentMousePos(point)

    if (dragging) {
      const newPos = { x: point.x - dragging.offset.x, y: point.y - dragging.offset.y }
      setMapPosition(dragging.id, dragging.type, selectedFloorPlanId!, newPos)
      return
    }

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }

    // Check hover
    if (selectedFloorPlanId) {
      const positions = mapPositions.filter(p => p.floorPlanId === selectedFloorPlanId)
      let found = false
      for (const pos of positions) {
        const distance = Math.sqrt((pos.position.x - point.x) ** 2 + (pos.position.y - point.y) ** 2)
        if (distance < 20) {
          setHoveredEntity({ type: pos.type, id: pos.id })
          found = true
          break
        }
      }
      if (!found) setHoveredEntity(null)
    }
  }

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragging) {
      setDragging(null)
      return
    }

    if (isPanning) {
      setIsPanning(false)
      return
    }

    const point = screenToCanvas(e.clientX, e.clientY)

    if (tool === 'rectangle' && drawingPoints.length === 1 && selectedRoomForDrawing) {
      const start = drawingPoints[0]
      const points = [
        start,
        { x: point.x, y: start.y },
        point,
        { x: start.x, y: point.y },
      ]
      addRoomPolygon(selectedRoomForDrawing, selectedFloorPlanId!, points, 'rectangle')
      setDrawingPoints([])
      setTool('pan')
    }
  }

  // Handle double click (finish polygon)
  const handleDoubleClick = () => {
    if (tool === 'polygon' && drawingPoints.length >= 3 && selectedRoomForDrawing) {
      addRoomPolygon(selectedRoomForDrawing, selectedFloorPlanId!, drawingPoints, 'polygon')
      setDrawingPoints([])
      setTool('pan')
    }
  }

  // Handle right click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!selectedFloorPlanId) return

    const point = screenToCanvas(e.clientX, e.clientY)

    // Check if clicking on a room polygon
    const polygons = roomPolygons.filter(p => p.floorPlanId === selectedFloorPlanId)
    for (const polygon of polygons) {
      if (isPointInPolygon(point, polygon.points)) {
        setContextMenu({ x: e.clientX, y: e.clientY, polygonId: polygon.id })
        return
      }
    }
  }

  // Check if point is inside polygon
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y
      const xj = polygon[j].x, yj = polygon[j].y
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  // Click on entity
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hoveredEntity) {
      setSelectedEntity(hoveredEntity)
    } else {
      setSelectedEntity(null)
    }
  }

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply transform
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw floor plan image
    if (selectedFloorPlanId) {
      const floorPlan = floorPlans.find(f => f.id === selectedFloorPlanId)
      if (floorPlan) {
        let img = imageCache.current.get(floorPlan.id)
        if (!img) {
          img = new Image()
          img.src = floorPlan.imageUrl
          img.onload = () => {
            imageCache.current.set(floorPlan.id, img!)
            // Trigger re-render
            setZoom(z => z)
          }
        } else if (img.complete) {
          ctx.drawImage(img, 0, 0)
        }
      }

      // Draw room polygons
      const polygons = roomPolygons.filter(p => p.floorPlanId === selectedFloorPlanId)
      for (const polygon of polygons) {
        const room = rooms.find(r => r.id === polygon.roomId)
        if (!room) continue

        ctx.fillStyle = getRoomColor(polygon.roomId, rooms)
        ctx.strokeStyle = getRoomColor(polygon.roomId, rooms).replace('0.3', '0.8')
        ctx.lineWidth = 2 / zoom

        ctx.beginPath()
        ctx.moveTo(polygon.points[0].x, polygon.points[0].y)
        for (let i = 1; i < polygon.points.length; i++) {
          ctx.lineTo(polygon.points[i].x, polygon.points[i].y)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Draw room label
        const centerX = polygon.points.reduce((sum, p) => sum + p.x, 0) / polygon.points.length
        const centerY = polygon.points.reduce((sum, p) => sum + p.y, 0) / polygon.points.length
        ctx.fillStyle = '#1e293b'
        ctx.font = `${14 / zoom}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(room.name, centerX, centerY)
      }

      // Draw items and boxes
      const positions = mapPositions.filter(p => p.floorPlanId === selectedFloorPlanId)
      for (const pos of positions) {
        const isHovered = hoveredEntity?.type === pos.type && hoveredEntity?.id === pos.id
        const isSelected = selectedEntity?.type === pos.type && selectedEntity?.id === pos.id

        ctx.save()
        ctx.translate(pos.position.x, pos.position.y)

        // Draw circle background
        ctx.beginPath()
        ctx.arc(0, 0, 15, 0, Math.PI * 2)
        if (isSelected) {
          ctx.fillStyle = '#ea580c'
          ctx.strokeStyle = '#ea580c'
        } else if (isHovered) {
          ctx.fillStyle = '#fb923c'
          ctx.strokeStyle = '#fb923c'
        } else if (pos.type === 'item') {
          ctx.fillStyle = '#fbbf24'
          ctx.strokeStyle = '#f59e0b'
        } else {
          ctx.fillStyle = '#94a3b8'
          ctx.strokeStyle = '#64748b'
        }
        ctx.fill()
        ctx.lineWidth = 2 / zoom
        ctx.stroke()

        // Draw icon representation (simplified)
        ctx.fillStyle = '#ffffff'
        ctx.font = `${12 / zoom}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(pos.type === 'item' ? '💡' : '📦', 0, 0)

        ctx.restore()
      }

      // Draw connections
      if (selectedEntity) {
        const entity = selectedEntity.type === 'item'
          ? items.find(i => i.id === selectedEntity.id)
          : boxes.find(b => b.id === selectedEntity.id)

        if (selectedEntity.type === 'item' && entity) {
          // Find modules connected to this item
          const connectedModules = modules.filter(m => m.itemId === selectedEntity.id)
          for (const module of connectedModules) {
            const box = boxes.find(b => b.id === module.boxId)
            if (!box) continue

            const boxPos = positions.find(p => p.type === 'box' && p.id === box.id)
            const itemPos = positions.find(p => p.type === 'item' && p.id === selectedEntity.id)

            if (boxPos && itemPos) {
              ctx.strokeStyle = '#ef4444'
              ctx.lineWidth = 2 / zoom
              ctx.setLineDash([5 / zoom, 5 / zoom])
              ctx.beginPath()
              ctx.moveTo(itemPos.position.x, itemPos.position.y)
              ctx.lineTo(boxPos.position.x, boxPos.position.y)
              ctx.stroke()
              ctx.setLineDash([])
            }
          }
        }
      }

      // Draw current drawing
      if (tool === 'rectangle' && drawingPoints.length === 1 && currentMousePos) {
        const start = drawingPoints[0]
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2 / zoom
        ctx.setLineDash([5 / zoom, 5 / zoom])
        ctx.strokeRect(
          start.x,
          start.y,
          currentMousePos.x - start.x,
          currentMousePos.y - start.y
        )
        ctx.setLineDash([])
      } else if (tool === 'polygon' && drawingPoints.length > 0) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2 / zoom
        ctx.setLineDash([5 / zoom, 5 / zoom])
        ctx.beginPath()
        ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y)
        for (let i = 1; i < drawingPoints.length; i++) {
          ctx.lineTo(drawingPoints[i].x, drawingPoints[i].y)
        }
        if (currentMousePos) {
          ctx.lineTo(currentMousePos.x, currentMousePos.y)
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Draw points
        for (const point of drawingPoints) {
          ctx.fillStyle = '#3b82f6'
          ctx.beginPath()
          ctx.arc(point.x, point.y, 3 / zoom, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    ctx.restore()
  }, [
    zoom, pan, selectedFloorPlanId, floorPlans, roomPolygons, rooms, mapPositions,
    drawingPoints, currentMousePos, tool, hoveredEntity, selectedEntity, items, boxes, modules
  ])

  // Get entity info
  const getEntityInfo = () => {
    if (!selectedEntity) return null

    if (selectedEntity.type === 'item') {
      const item = items.find(i => i.id === selectedEntity.id)
      if (!item) return null

      const room = rooms.find(r => r.id === item.roomId)
      const connectedModules = modules.filter(m => m.itemId === item.id)
      const connectedBoxes = connectedModules.map(m => boxes.find(b => b.id === m.boxId)).filter(Boolean)

      return {
        title: item.name || ITEM_LABELS[item.type],
        type: 'Item',
        details: [
          { label: 'Room', value: room?.name || 'Unknown' },
          { label: 'Type', value: ITEM_LABELS[item.type] },
          { label: 'Connected to', value: connectedBoxes.length > 0 ? connectedBoxes.map(b => b!.name).join(', ') : 'None' },
        ]
      }
    } else {
      const box = boxes.find(b => b.id === selectedEntity.id)
      if (!box) return null

      const room = rooms.find(r => r.id === box.roomId)
      const boxModules = modules.filter(m => m.boxId === box.id)

      return {
        title: box.name,
        type: 'Box',
        details: [
          { label: 'Room', value: room?.name || 'Unknown' },
          { label: 'Size', value: `${box.size} modules` },
          { label: 'Modules', value: `${boxModules.length}/${box.size}` },
        ]
      }
    }
  }

  const entityInfo = getEntityInfo()

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Top toolbar */}
      <div className="bg-white border-b border-slate-200 p-3 flex items-center gap-3 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors text-sm"
        >
          <Upload size={16} />
          Upload Floor Plan
        </button>

        {floorPlans.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <select
                value={selectedFloorPlanId || ''}
                onChange={(e) => setSelectedFloorPlanId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {floorPlans.map((fp) => (
                  <option key={fp.id} value={fp.id}>
                    {fp.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const fp = floorPlans.find(f => f.id === selectedFloorPlanId)
                  if (fp) {
                    setEditingFloorPlanName(fp.id)
                    setEditName(fp.name)
                  }
                }}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Rename floor plan"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => {
                  if (selectedFloorPlanId) {
                    deleteFloorPlan(selectedFloorPlanId)
                    setSelectedFloorPlanId(null)
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete floor plan"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setTool('pan')}
                className={`p-2 rounded-lg transition-colors ${
                  tool === 'pan' ? 'bg-copper-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Pan (drag to move)"
              >
                <Hand size={18} />
              </button>
              <button
                onClick={() => {
                  setTool('rectangle')
                  setSelectedRoomForDrawing(rooms[0]?.id || null)
                }}
                className={`p-2 rounded-lg transition-colors ${
                  tool === 'rectangle' ? 'bg-copper-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Draw rectangle room"
              >
                <Square size={18} />
              </button>
              <button
                onClick={() => {
                  setTool('polygon')
                  setSelectedRoomForDrawing(rooms[0]?.id || null)
                }}
                className={`p-2 rounded-lg transition-colors ${
                  tool === 'polygon' ? 'bg-copper-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Draw polygon room"
              >
                <Pentagon size={18} />
              </button>
            </div>

            {(tool === 'rectangle' || tool === 'polygon') && (
              <select
                value={selectedRoomForDrawing || ''}
                onChange={(e) => setSelectedRoomForDrawing(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            )}

            <div className="w-px h-8 bg-slate-200" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm text-slate-600 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(5, z + 0.1))}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {selectedFloorPlanId && (
          <div className="w-64 bg-white border-r border-slate-200 overflow-auto p-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Items</h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const room = rooms.find(r => r.id === item.roomId)
                  const icon = item.icon || DEFAULT_ITEM_ICONS[item.type]
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setItemToPlace(item.id)
                        setTool('place-item')
                      }}
                      className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <ItemIcon icon={icon} size={16} className="text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.name || ITEM_LABELS[item.type]}</div>
                        <div className="text-xs text-slate-400">{room?.name}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Boxes</h3>
              <div className="space-y-1">
                {boxes.map((box) => {
                  const room = rooms.find(r => r.id === box.roomId)
                  return (
                    <button
                      key={box.id}
                      onClick={() => {
                        setBoxToPlace(box.id)
                        setTool('place-box')
                      }}
                      className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <BoxIcon size={16} className="text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{box.name}</div>
                        <div className="text-xs text-slate-400">{room?.name}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {floorPlans.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Upload size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 mb-2">No floor plans yet</p>
                <p className="text-sm text-slate-400 mb-4">Upload a floor plan image to get started</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors"
                >
                  Upload Floor Plan
                </button>
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                onClick={handleCanvasClick}
              />

              {/* Hints */}
              {tool === 'rectangle' && (
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
                  Click and drag to draw a rectangle
                </div>
              )}
              {tool === 'polygon' && (
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
                  Click to add points, double-click to finish
                </div>
              )}
              {tool === 'place-item' && itemToPlace && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
                  Click to place item
                </div>
              )}
              {tool === 'place-box' && boxToPlace && (
                <div className="absolute top-4 left-4 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
                  Click to place box
                </div>
              )}

              {/* Entity info panel */}
              {entityInfo && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 w-64 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-900">{entityInfo.title}</div>
                      <div className="text-xs text-slate-500">{entityInfo.type}</div>
                    </div>
                    <button
                      onClick={() => setSelectedEntity(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {entityInfo.details.map((detail, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-slate-500">{detail.label}:</span>{' '}
                        <span className="text-slate-900">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const polygon = roomPolygons.find(p => p.id === contextMenu.polygonId)
                if (polygon) {
                  const newRoomId = rooms[(rooms.findIndex(r => r.id === polygon.roomId) + 1) % rooms.length]?.id
                  if (newRoomId) {
                    updateRoomPolygon(polygon.id, newRoomId)
                  }
                }
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
            >
              Change Room
            </button>
            <button
              onClick={() => {
                deleteRoomPolygon(contextMenu.polygonId)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
        </>
      )}

      {/* Floor plan name edit dialog */}
      {editingFloorPlanName && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Rename Floor Plan</h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFloorPlan(editingFloorPlanName, editName)
                  setEditingFloorPlanName(null)
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingFloorPlanName(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateFloorPlan(editingFloorPlanName, editName)
                  setEditingFloorPlanName(null)
                }}
                className="px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
