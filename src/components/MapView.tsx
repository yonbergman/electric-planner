'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Upload, Hand, Trash2, X, Pencil, Box as BoxIcon, Filter } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Point, FloorPlan, DEFAULT_ITEM_ICONS, ITEM_LABELS } from '@/types'
import ItemIcon from '@/components/ItemIcon'
import { ICON_MAP } from '@/components/ItemIcon'

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

interface ContextMenu {
  x: number
  y: number
  positionId: string
  entityType: 'box' | 'item'
  entityId: string
}

export default function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { floorPlans, roomPolygons, mapPositions, rooms, boxes, items, modules, addFloorPlan, deleteFloorPlan, setMapPosition, updateMapPosition, updateFloorPlan, deleteMapPosition } = useStore()

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
  const [imageOpacity, setImageOpacity] = useState(1)
  const [imageScale, setImageScale] = useState(1)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)

  const currentFloorPlan = floorPlans.find(f => f.id === selectedFloorPlan)
  const [iconImages, setIconImages] = useState<Map<string, HTMLImageElement>>(new Map())

  // Helper to get SVG path for icons
  const getIconSVGPath = (iconName: string): string => {
    const svgPaths: Record<string, string> = {
      'Lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
      'Lamp': '<path d="M8 2h8l4 10H4L8 2Z"/><path d="M12 12v8"/><path d="M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8Z"/>',
      'LampDesk': '<path d="m14 5-3 3 2 7 8-8-7-2Z"/><path d="m14 5-3 3-3-3 3-3 3 3Z"/><path d="M9.5 6.5 4 12l3 6"/><path d="M3 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H3Z"/>',
      'LampFloor': '<path d="M9 2h6l3 7H6l3-7Z"/><path d="M12 9v13"/><path d="M9 22h6"/>',
      'LampCeiling': '<path d="M12 2v5"/><path d="M6 7h12l-3 9H9L6 7Z"/><path d="M9.17 16a3 3 0 1 0 5.66 0"/>',
      'LampWallUp': '<path d="M11 4h6l3 7H8l3-7Z"/><path d="M14 11v5a2 2 0 0 1-2 2H9"/><path d="M4 15h2a2 2 0 0 1 2 2v2"/>',
      'Fan': '<path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/><path d="M12 12v.01"/>',
      'AirVent': '<path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 8h12"/><path d="M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12"/><path d="M6.6 15.6A2 2 0 1 0 10 17v-5"/>',
      'Blinds': '<path d="M3 3h18"/><path d="M20 7H8"/><path d="M20 11H8"/><path d="M10 19h10"/><path d="M8 15h12"/><path d="M4 3v14"/><circle cx="4" cy="19" r="2"/>',
      'PanelTop': '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>',
      'Sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
      'Star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      'Plug': '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
      'Refrigerator': '<path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z"/><path d="M5 10h14"/><path d="M15 7v6"/>',
      'WashingMachine': '<path d="M3 6h3m0 0h12m-12 0v12m12-12v12M6 18h12"/><circle cx="12" cy="13" r="5"/><path d="M12 18a5 5 0 0 0 2.5-.67"/><path d="M7 3h10"/>',
      'Tv': '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
      'Monitor': '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
      'Speaker': '<rect width="16" height="20" x="4" y="2" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="6" r="1"/>',
      'Coffee': '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
      'Microwave': '<rect width="20" height="15" x="2" y="4" rx="2"/><rect width="8" height="7" x="6" y="8" rx="1"/><path d="M18 8v7"/><path d="M6 19v2"/><path d="M18 19v2"/>',
      'CookingPot': '<path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/>',
      'Heater': '<path d="M11 2v2M7 7v10M21 7v10M17 7v10M13 7v10M11 20v2"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
      'Sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
      'Moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
      'Gamepad2': '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5Z"/>',
      'Toilet': '<path d="M7 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><path d="M7 10h10"/><path d="M19 10v3a1 1 0 0 1-1 1h-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-5Z"/><path d="M5 10v3a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H6a3 3 0 0 1-3-3v-5Z"/><path d="M12 4v2"/>',
      'Router': '<rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6.01 18H6"/><path d="M10.01 18H10"/><path d="M15 10v4"/><path d="M17.84 7.17a4 4 0 0 0-5.66 0"/><path d="M20.66 4.34a8 8 0 0 0-11.31 0"/>',
      'Footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/>',
    }
    return svgPaths[iconName] || '<circle cx="12" cy="12" r="8"/>'
  }

  // Pre-load icon images
  useEffect(() => {
    const iconsToLoad = new Set<string>()
    items.forEach(item => {
      const iconName = item.icon || DEFAULT_ITEM_ICONS[item.type]
      iconsToLoad.add(iconName)
    })

    iconsToLoad.forEach(iconName => {
      if (!iconImages.has(iconName)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${getIconSVGPath(iconName)}</svg>`
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
          setIconImages(prev => new Map(prev).set(iconName, img))
          URL.revokeObjectURL(url)
        }
        img.src = url
      }
    })
  }, [items, iconImages])

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

    // Draw floor plan image with opacity and scale
    const img = loadedImages.get(currentFloorPlan.id)
    const scaledWidth = currentFloorPlan.width * imageScale
    const scaledHeight = currentFloorPlan.height * imageScale
    if (img) {
      ctx.globalAlpha = imageOpacity
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#f1f5f9'
      ctx.fillRect(0, 0, scaledWidth, scaledHeight)
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
                // Get all positions for this item (can be placed multiple times)
                const itemPositions = mapPositions.filter(p => p.entityId === item.id && p.floorPlanId === selectedFloorPlan)
                itemPositions.forEach(itemPos => {
                  ctx.beginPath()
                  ctx.moveTo(pos.x, pos.y)
                  ctx.lineTo(itemPos.x, itemPos.y)
                  ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'
                  ctx.lineWidth = 2 / zoom
                  ctx.setLineDash([5 / zoom, 5 / zoom])
                  ctx.stroke()
                  ctx.setLineDash([])
                })
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
                // Get all positions for this box (for consistency with items)
                const boxPositions = mapPositions.filter(p => p.entityId === box.id && p.floorPlanId === selectedFloorPlan)
                boxPositions.forEach(boxPos => {
                  ctx.beginPath()
                  ctx.moveTo(pos.x, pos.y)
                  ctx.lineTo(boxPos.x, boxPos.y)
                  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
                  ctx.lineWidth = 2 / zoom
                  ctx.setLineDash([5 / zoom, 5 / zoom])
                  ctx.stroke()
                  ctx.setLineDash([])
                })
              }
            })
          }

          // Draw item circle
          ctx.fillStyle = isSelected ? '#7c3aed' : isHovered ? '#a78bfa' : '#8b5cf6'
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)
          ctx.fill()

          // Draw icon
          const iconName = item.icon || DEFAULT_ITEM_ICONS[item.type]
          const iconImg = iconImages.get(iconName)
          if (iconImg) {
            const iconSize = 16
            ctx.drawImage(iconImg, pos.x - iconSize/2, pos.y - iconSize/2, iconSize, iconSize)
          }

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
  }, [currentFloorPlan, pan, zoom, mapPositions, boxes, items, modules, selectedFloorPlan, loadedImages, hoveredEntity, selectedEntity, iconImages, imageOpacity, imageScale])

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

    if (movingEntity) {
      // Move the entity by updating its existing position
      const newX = pos.x + movingEntity.offsetX
      const newY = pos.y + movingEntity.offsetY
      updateMapPosition(movingEntity.positionId, newX, newY)
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const pos = screenToCanvas(e.clientX, e.clientY)
    const entity = findEntityAtPosition(pos)

    if (entity) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        positionId: entity.positionId,
        entityType: entity.type,
        entityId: entity.id
      })
    } else {
      setContextMenu(null)
    }
  }

  const handleRemoveFromMap = () => {
    if (contextMenu) {
      deleteMapPosition(contextMenu.positionId)
      setContextMenu(null)
      if (selectedEntity?.type === contextMenu.entityType && selectedEntity?.id === contextMenu.entityId) {
        setSelectedEntity(null)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!selectedFloorPlan) return

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json')) as DraggedEntity
      const pos = screenToCanvas(e.clientX, e.clientY)
      setMapPosition(selectedFloorPlan, data.type, data.id, pos.x, pos.y)
    } catch {
      // Invalid drop data
    }
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

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
            className="flex items-center gap-2 px-3 py-2 bg-silver-600 text-white rounded-lg hover:bg-silver-700 transition-colors text-sm font-medium"
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
                    className="px-3 py-2 border border-silver-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-silver-500"
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
              className={`p-2 rounded-lg transition-colors ${drawMode === 'pan' ? 'bg-silver-100 text-silver-700' : 'hover:bg-slate-100'}`}
              title="Pan mode"
            >
              <Hand size={18} />
            </button>

            <div className="w-px h-6 bg-slate-300" />

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Opacity:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={imageOpacity * 100}
                onChange={(e) => setImageOpacity(parseInt(e.target.value) / 100)}
                className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-silver-600"
                title={`Floor plan opacity: ${Math.round(imageOpacity * 100)}%`}
              />
              <span className="text-sm text-slate-600 w-8">{Math.round(imageOpacity * 100)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Scale:</label>
              <input
                type="range"
                min="10"
                max="200"
                value={imageScale * 100}
                onChange={(e) => setImageScale(parseInt(e.target.value) / 100)}
                className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-silver-600"
                title={`Floor plan scale: ${Math.round(imageScale * 100)}%`}
              />
              <span className="text-sm text-slate-600 w-10">{Math.round(imageScale * 100)}%</span>
            </div>
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
                  hidePlaced ? 'bg-silver-100 text-silver-700' : 'hover:bg-slate-100'
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
                    ? roomBoxes.filter(b => !mapPositions.some(p => p.entityType === 'box' && p.entityId === b.id && p.floorPlanId === selectedFloorPlan))
                    : roomBoxes

                  // For items, we never hide them since they can be placed multiple times
                  const visibleItems = roomItems

                  if (visibleBoxes.length === 0 && visibleItems.length === 0) return null

                  return (
                    <div key={room.id} className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">{room.name}</h3>

                      {visibleBoxes.length > 0 && (
                        <div className="space-y-1 mb-3">
                          <div className="text-xs text-slate-500 mb-1">Boxes</div>
                          {visibleBoxes.map(box => {
                            const isPlaced = mapPositions.some(p => p.entityType === 'box' && p.entityId === box.id && p.floorPlanId === selectedFloorPlan)
                            return (
                              <button
                                key={box.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'box', id: box.id, name: box.name }))
                                  e.dataTransfer.effectAllowed = 'copy'
                                }}
                                onClick={() => {
                                  setDraggedEntity({ type: 'box', id: box.id, name: box.name })
                                  setDrawMode('place')
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-silver-50 transition-colors flex items-center gap-2 ${
                                  draggedEntity?.id === box.id ? 'bg-silver-100' : ''
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
                            const placementCount = mapPositions.filter(p => p.entityId === item.id && p.floorPlanId === selectedFloorPlan).length
                            const icon = item.icon || DEFAULT_ITEM_ICONS[item.type]
                            return (
                              <button
                                key={item.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'item', id: item.id, name: item.name || 'Item' }))
                                  e.dataTransfer.effectAllowed = 'copy'
                                }}
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
                                  <div className="font-medium text-sm truncate">{item.name || ITEM_LABELS[item.type]}</div>
                                  {placementCount > 0 && <div className="text-xs text-green-600">Placed ({placementCount})</div>}
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
          <div
            ref={containerRef}
            className="flex-1 relative"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <canvas
              ref={canvasRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={handleContextMenu}
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

            {/* Context menu */}
            {contextMenu && (
              <div
                className="absolute bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleRemoveFromMap}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Remove from map
                </button>
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
                          <div className="font-medium">{item.name || ITEM_LABELS[item.type]}</div>
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
              className="px-4 py-2 bg-silver-600 text-white rounded-lg hover:bg-silver-700 transition-colors"
            >
              Upload Floor Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
