import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [setting] = await db.select().from(userSettings)
    .where(and(eq(userSettings.userId, session.user.id), eq(userSettings.key, 'babyDob')))
    .limit(1)

  return NextResponse.json({ babyDob: setting?.value ?? null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { babyDob } = await req.json()
  await db.insert(userSettings)
    .values({ userId: session.user.id, key: 'babyDob', value: babyDob, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [userSettings.userId, userSettings.key],
      set: { value: babyDob, updatedAt: new Date() },
    })

  return NextResponse.json({ success: true })
}
