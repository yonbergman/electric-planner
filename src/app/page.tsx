'use client'

import { useEffect, useState } from 'react'
import { Menu, X, Share2, FileText } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import RoomView from '@/components/RoomView'
import SummaryPage from '@/components/SummaryPage'
import { loadFromUrl, generateShareUrl } from '@/store/useStore'

export default function Home() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <header className="bg-gradient-to-r from-copper-600 to-copper-700 text-white px-4 py-3 flex justify-between items-center shadow-lg shadow-copper-500/20 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">Boxwise</h1>
        </div>
        <div className="flex gap-2">
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
      </div>

      {showSummary && <SummaryPage onClose={() => setShowSummary(false)} />}
    </main>
  )
}
