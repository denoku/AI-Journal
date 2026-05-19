import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { journalEntries } from '@/lib/db/schema'
import { eq, and, like } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = request.nextUrl.searchParams.get('month') // e.g. "2025-05"
  if (!month) return NextResponse.json({ error: 'month param required' }, { status: 400 })

  const entries = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, session.user.id),
        like(journalEntries.date, `${month}%`)
      )
    )

  return NextResponse.json(entries)
}
