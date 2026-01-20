import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Room, Box, Module, Item, ModuleType, ItemType, IconName, FloorPlan, RoomPolygon, MapPosition, Point } from '@/types'

interface StorageData {
  rooms: Room[]
  boxes: Box[]
  modules: Module[]
  items: Item[]
  floorPlans: FloorPlan[]
  roomPolygons: RoomPolygon[]
  mapPositions: MapPosition[]
}

interface State extends StorageData {
  selectedRoomId: string | null
  hoveredItemId: string | null
  hoveredModuleId: string | null

  // Room actions
  addRoom: (name: string) => void
  updateRoom: (id: string, name: string) => void
  deleteRoom: (id: string) => void
  selectRoom: (id: string | null) => void
  setHoveredItem: (id: string | null) => void
  setHoveredModule: (id: string | null) => void

  // Box actions
  addBox: (roomId: string, name: string, size: 3 | 4 | 7 | 14) => void
  updateBox: (id: string, name: string, size: 3 | 4 | 7 | 14) => void
  deleteBox: (id: string) => void

  // Module actions
  addModule: (boxId: string, type: ModuleType, position: number, label: string) => void
  updateModule: (id: string, updates: Partial<Pick<Module, 'label' | 'itemId' | 'notes'>>) => void
  deleteModule: (id: string) => void
  assignItem: (moduleId: string, itemId: string | undefined) => void

  // Item actions
  addItem: (roomId: string, type: ItemType, name?: string) => void
  updateItem: (id: string, updates: Partial<Pick<Item, 'name' | 'icon'>>) => void
  deleteItem: (id: string) => void

  // Map actions
  addFloorPlan: (name: string, imageUrl: string) => string
  updateFloorPlan: (id: string, name: string) => void
  deleteFloorPlan: (id: string) => void
  addRoomPolygon: (roomId: string, floorPlanId: string, points: Point[], type: 'rectangle' | 'polygon') => void
  updateRoomPolygon: (id: string, roomId: string) => void
  deleteRoomPolygon: (id: string) => void
  setMapPosition: (id: string, type: 'box' | 'item', floorPlanId: string, position: Point) => void
  deleteMapPosition: (id: string, type: 'box' | 'item') => void

  // Import/Export
  exportData: () => StorageData
  importData: (data: StorageData) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Compress string using browser's CompressionStream
async function compress(str: string): Promise<string> {
  const blob = new Blob([str])
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'))
  const compressed = await new Response(stream).arrayBuffer()
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(compressed))))
}

// Decompress string
async function decompress(base64: string): Promise<string> {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

// Generate shareable URL
export async function generateShareUrl(): Promise<string> {
  const state = useStore.getState()
  const data: StorageData = {
    rooms: state.rooms,
    boxes: state.boxes,
    modules: state.modules,
    items: state.items,
    floorPlans: state.floorPlans,
    roomPolygons: state.roomPolygons,
    mapPositions: state.mapPositions,
  }

  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create share link')

  const { path } = await response.json()
  return `${window.location.origin}${path}`
}

// Load from URL hash
export async function loadFromUrl(): Promise<boolean> {
  const hash = window.location.hash.slice(1)
  if (!hash) return false

  try {
    const json = await decompress(hash)
    const data = JSON.parse(json) as StorageData
    if (data.rooms && data.boxes && data.modules && data.items) {
      useStore.getState().importData({
        ...data,
        floorPlans: data.floorPlans || [],
        roomPolygons: data.roomPolygons || [],
        mapPositions: data.mapPositions || [],
      })
      // Clear hash after loading
      window.history.replaceState(null, '', window.location.pathname)
      return true
    }
  } catch (e) {
    console.error('Failed to load from URL:', e)
  }
  return false
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      rooms: [],
      boxes: [],
      modules: [],
      items: [],
      floorPlans: [],
      roomPolygons: [],
      mapPositions: [],
      selectedRoomId: null,
      hoveredItemId: null,
      hoveredModuleId: null,

      // Room actions
      addRoom: (name) =>
        set((state) => ({
          rooms: [...state.rooms, { id: generateId(), name }],
        })),

      updateRoom: (id, name) =>
        set((state) => ({
          rooms: state.rooms.map((r) => (r.id === id ? { ...r, name } : r)),
        })),

      deleteRoom: (id) =>
        set((state) => {
          const boxIds = state.boxes.filter((b) => b.roomId === id).map((b) => b.id)
          return {
            rooms: state.rooms.filter((r) => r.id !== id),
            boxes: state.boxes.filter((b) => b.roomId !== id),
            modules: state.modules.filter((m) => !boxIds.includes(m.boxId)),
            items: state.items.filter((i) => i.roomId !== id),
            selectedRoomId: state.selectedRoomId === id ? null : state.selectedRoomId,
          }
        }),

      selectRoom: (id) => set({ selectedRoomId: id }),
      setHoveredItem: (id) => set({ hoveredItemId: id }),
      setHoveredModule: (id) => set({ hoveredModuleId: id }),

      // Box actions
      addBox: (roomId, name, size) =>
        set((state) => ({
          boxes: [...state.boxes, { id: generateId(), roomId, name, size }],
        })),

      updateBox: (id, name, size) =>
        set((state) => ({
          boxes: state.boxes.map((b) => (b.id === id ? { ...b, name, size } : b)),
        })),

      deleteBox: (id) =>
        set((state) => ({
          boxes: state.boxes.filter((b) => b.id !== id),
          modules: state.modules.filter((m) => m.boxId !== id),
        })),

      // Module actions
      addModule: (boxId, type, position, label) =>
        set((state) => ({
          modules: [...state.modules, { id: generateId(), boxId, type, position, label }],
        })),

      updateModule: (id, updates) =>
        set((state) => ({
          modules: state.modules.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      deleteModule: (id) =>
        set((state) => ({
          modules: state.modules.filter((m) => m.id !== id),
        })),

      assignItem: (moduleId, itemId) =>
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === moduleId ? { ...m, itemId } : m
          ),
        })),

      // Item actions
      addItem: (roomId, type, name) =>
        set((state) => ({
          items: [...state.items, { id: generateId(), roomId, type, name }],
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          modules: state.modules.map((m) =>
            m.itemId === id ? { ...m, itemId: undefined } : m
          ),
          mapPositions: state.mapPositions.filter((p) => !(p.type === 'item' && p.id === id)),
        })),

      // Map actions
      addFloorPlan: (name, imageUrl) => {
        const id = generateId()
        set((state) => ({
          floorPlans: [...state.floorPlans, { id, name, imageUrl }],
        }))
        return id
      },

      updateFloorPlan: (id, name) =>
        set((state) => ({
          floorPlans: state.floorPlans.map((f) => (f.id === id ? { ...f, name } : f)),
        })),

      deleteFloorPlan: (id) =>
        set((state) => ({
          floorPlans: state.floorPlans.filter((f) => f.id !== id),
          roomPolygons: state.roomPolygons.filter((p) => p.floorPlanId !== id),
          mapPositions: state.mapPositions.filter((p) => p.floorPlanId !== id),
        })),

      addRoomPolygon: (roomId, floorPlanId, points, type) =>
        set((state) => ({
          roomPolygons: [...state.roomPolygons, { id: generateId(), roomId, floorPlanId, points, type }],
        })),

      updateRoomPolygon: (id, roomId) =>
        set((state) => ({
          roomPolygons: state.roomPolygons.map((p) => (p.id === id ? { ...p, roomId } : p)),
        })),

      deleteRoomPolygon: (id) =>
        set((state) => ({
          roomPolygons: state.roomPolygons.filter((p) => p.id !== id),
        })),

      setMapPosition: (id, type, floorPlanId, position) =>
        set((state) => {
          const existing = state.mapPositions.find((p) => p.id === id && p.type === type)
          if (existing) {
            return {
              mapPositions: state.mapPositions.map((p) =>
                p.id === id && p.type === type ? { ...p, floorPlanId, position } : p
              ),
            }
          }
          return {
            mapPositions: [...state.mapPositions, { id, type, floorPlanId, position }],
          }
        }),

      deleteMapPosition: (id, type) =>
        set((state) => ({
          mapPositions: state.mapPositions.filter((p) => !(p.id === id && p.type === type)),
        })),

      // Import/Export
      exportData: () => ({
        rooms: get().rooms,
        boxes: get().boxes,
        modules: get().modules,
        items: get().items,
        floorPlans: get().floorPlans,
        roomPolygons: get().roomPolygons,
        mapPositions: get().mapPositions,
      }),

      importData: (data) =>
        set({
          rooms: data.rooms,
          boxes: data.boxes,
          modules: data.modules,
          items: data.items,
          floorPlans: data.floorPlans || [],
          roomPolygons: data.roomPolygons || [],
          mapPositions: data.mapPositions || [],
          selectedRoomId: data.rooms.length > 0 ? data.rooms[0].id : null,
        }),
    }),
    {
      name: 'electric-planner-storage',
    }
  )
)
