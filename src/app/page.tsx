'use client'

import MapView from '@/components/MapView'
import { PlugZapIcon } from '@/components/PlugZap'
import RoomView from '@/components/RoomView'
import Sidebar from '@/components/Sidebar'
import SummaryPage from '@/components/SummaryPage'
import { generateShareUrl, loadFromUrl } from '@/store/useStore'
import { FileText, Map, Menu, Share2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type ViewMode = 'rooms' | 'map'

export default function Home() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('rooms')

  useEffect(() => {
    loadFromUrl().finally(() => setLoading(false))
  }, [])

  const handleShare = async () => {
    try {
      const url = await generateShareUrl()
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-400 animate-pulse">Loading...</div>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="brushed-silver text-white px-4 py-3 flex justify-between items-center shadow-lg shadow-silver-700/30 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <PlugZapIcon size={24} className="flex items-center gap-2 cursor-default group" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'rooms' ? 'map' : 'rooms')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            <Map size={16} />
            <span className="hidden sm:inline">{viewMode === 'rooms' ? 'Map View' : 'Room View'}</span>
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">Summary</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {viewMode === 'rooms' && (
          <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/30 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div className={`
              fixed lg:relative inset-y-0 left-0 z-30 lg:z-0
              transform transition-transform duration-200 ease-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <RoomView />
          </>
        )}

        {viewMode === 'map' && <MapView />}
      </div>

      {showSummary && <SummaryPage onClose={() => setShowSummary(false)} />}
    </main>
  )
}
