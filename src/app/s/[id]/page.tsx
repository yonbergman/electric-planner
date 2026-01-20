'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useStore } from '@/store/useStore'

export default function SharePage() {
  const router = useRouter()
  const params = useParams()
  const [error, setError] = useState<string | null>(null)
  const importData = useStore((state) => state.importData)

  useEffect(() => {
    const loadShareData = async () => {
      const id = params.id as string
      if (!id) {
        setError('Invalid share link')
        return
      }

      try {
        const response = await fetch(`/api/share?id=${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('This share link has expired or does not exist')
          } else {
            setError('Failed to load shared data')
          }
          return
        }

        const data = await response.json()
        if (data.rooms && data.boxes && data.modules && data.items) {
          importData(data)
          router.replace('/')
        } else {
          setError('Invalid share data')
        }
      } catch {
        setError('Failed to load shared data')
      }
    }

    loadShareData()
  }, [params.id, importData, router])

  if (error) {
    return (
      <main className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8">
          <div className="text-slate-600 text-lg mb-4">{error}</div>
          <a
            href="/"
            className="text-silver-600 hover:text-silver-700 font-medium"
          >
            Go to home page
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-slate-400 animate-pulse">Loading shared plan...</div>
    </main>
  )
}
