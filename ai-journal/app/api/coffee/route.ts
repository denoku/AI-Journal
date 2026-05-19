import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { coffeeLogs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const logs = await db
    .select()
    .from(coffeeLogs)
    .where(eq(coffeeLogs.userId, session.user.id))
    .orderBy(desc(coffeeLogs.date), desc(coffeeLogs.createdAt))
    .limit(60)

  return NextResponse.json(logs)
}
