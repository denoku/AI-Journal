import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  journalEntries,
  chatMessages,
  recipes,
  coffeeLogs,
  todos,
  babyLogs,
  userSettings,
  babyFoods,
  events,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/migrate — show current user ID and available old user IDs to merge
// POST /api/migrate  body: { fromUserId: "old-uuid" } — migrate all data
//
// Usage after signing in fresh:
//   1. GET /api/migrate  → see your new stable ID + old UUIDs with entry counts
//   2. POST /api/migrate  { "fromUserId": "old-uuid-here" }  → moves all data over
//   Repeat step 2 for each old UUID you want to absorb.

const TABLES = [
  { table: journalEntries, col: journalEntries.userId },
  { table: chatMessages,   col: chatMessages.userId },
  { table: recipes,        col: recipes.userId },
  { table: coffeeLogs,     col: coffeeLogs.userId },
  { table: todos,          col: todos.userId },
  { table: babyLogs,       col: babyLogs.userId },
  { table: userSettings,   col: userSettings.userId },
  { table: babyFoods,      col: babyFoods.userId },
  { table: events,         col: events.userId },
] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.id;

  // Count rows per user_id across journal_entries so we can show what's out there
  const counts = await db.execute(
    sql`SELECT user_id, COUNT(*) as entries FROM journal_entries GROUP BY user_id ORDER BY entries DESC`
  );

  return NextResponse.json({
    yourCurrentId: myId,
    allJournalUserIds: counts.rows,
    instructions:
      'POST to this endpoint with { "fromUserId": "<old-id>" } to migrate all data from that ID to yours.',
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.id;
  const { fromUserId } = await request.json();

  if (!fromUserId || typeof fromUserId !== "string")
    return NextResponse.json({ error: "fromUserId required" }, { status: 400 });

  if (fromUserId === myId)
    return NextResponse.json({ error: "fromUserId is already your current ID" }, { status: 400 });

  const results: Record<string, number> = {};

  for (const { table, col } of TABLES) {
    const result = await db
      .update(table as typeof journalEntries)
      .set({ userId: myId } as { userId: string })
      .where(eq(col as typeof journalEntries.userId, fromUserId))
      .returning();
    results[table._.name] = result.length;
  }

  return NextResponse.json({
    ok: true,
    migratedFrom: fromUserId,
    migratedTo: myId,
    rowsMoved: results,
  });
}
