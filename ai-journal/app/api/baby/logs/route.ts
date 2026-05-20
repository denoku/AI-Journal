import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { babyLogs } from '@/lib/db/schema'
import { eq, and, gte, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Return last 48 hours of logs for context
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const logs = await db.select().from(babyLogs)
    .where(and(eq(babyLogs.userId, session.user.id), gte(babyLogs.time, cutoff)))
    .orderBy(asc(babyLogs.time))

  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, time, notes } = await req.json()
  const [log] = await db.insert(babyLogs).values({
    userId: session.user.id,
    type,
    time: new Date(time),
    notes,
  }).returning()
  return NextResponse.json(log, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.delete(babyLogs).where(and(eq(babyLogs.id, parseInt(id)), eq(babyLogs.userId, session.user.id)))
  return NextResponse.json({ success: true })
}
