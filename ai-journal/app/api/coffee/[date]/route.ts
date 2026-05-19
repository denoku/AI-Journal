import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { coffeeLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await params
  const logs = await db
    .select()
    .from(coffeeLogs)
    .where(and(eq(coffeeLogs.userId, session.user.id), eq(coffeeLogs.date, date)))

  return NextResponse.json(logs)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await params
  const body = await req.json()
  const { slot, ...fields } = body

  const [log] = await db
    .insert(coffeeLogs)
    .values({ userId: session.user.id, date, slot, ...fields, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [coffeeLogs.userId, coffeeLogs.date, coffeeLogs.slot],
      set: { ...fields, updatedAt: new Date() },
    })
    .returning()

  return NextResponse.json(log)
}
