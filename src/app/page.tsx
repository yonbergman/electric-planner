'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import RoomView from '@/components/RoomView'
import SummaryPage from '@/components/SummaryPage'
import { loadFromUrl, generateShareUrl } from '@/store/useStore'

export default function Home() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showSummary, setShowSummary] = useState(false)

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
      <main className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading...</div>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Electric Planner</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSummary(true)}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
          >
            Summary
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <RoomView />
      </div>
      {showSummary && <SummaryPage onClose={() => setShowSummary(false)} />}
    </main>
  )
}
