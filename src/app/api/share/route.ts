import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { redis, SHARE_TTL, SHARE_KEY_PREFIX } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = nanoid(10)
    const key = `${SHARE_KEY_PREFIX}${id}`

    await redis.set(key, JSON.stringify(data), 'EX', SHARE_TTL)

    return NextResponse.json({ id, path: `/s/${id}` })
  } catch {
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const key = `${SHARE_KEY_PREFIX}${id}`
    const data = await redis.get(key)

    if (!data) {
      return NextResponse.json({ error: 'Share link expired or not found' }, { status: 404 })
    }

    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch share data' }, { status: 500 })
  }
}
