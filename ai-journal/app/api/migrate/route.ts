import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const TABLES = [
  "journal_entries",
  "chat_messages",
  "recipes",
  "coffee_logs",
  "todos",
  "baby_logs",
  "user_settings",
  "baby_foods",
  "events",
] as const;

// GET /api/migrate — see your current stable ID and all user IDs that have journal data
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.execute(
    sql`SELECT user_id, COUNT(*) as entries FROM journal_entries GROUP BY user_id ORDER BY entries DESC`,
  );

  return NextResponse.json({
    yourCurrentId: session.user.id,
    allJournalUserIds: rows.rows,
    instructions:
      'POST { "fromUserId": "<old-id>" } to move all data from that ID to yours.',
  });
}

// POST /api/migrate — move every row from fromUserId to the current user's ID
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.id;
  const body = await request.json();
  const { fromUserId } = body as { fromUserId?: string };

  if (!fromUserId)
    return NextResponse.json({ error: "fromUserId required" }, { status: 400 });

  if (fromUserId === myId)
    return NextResponse.json(
      { error: "fromUserId is already your current ID" },
      { status: 400 },
    );

  const results: Record<string, number> = {};

  for (const table of TABLES) {
    // sql.identifier safely quotes the table name; values are parameterised
    const result = await db.execute(
      sql`UPDATE ${sql.identifier(table)} SET user_id = ${myId} WHERE user_id = ${fromUserId}`,
    );
    results[table] = result.rowCount ?? 0;
  }

  return NextResponse.json({
    ok: true,
    migratedFrom: fromUserId,
    migratedTo: myId,
    rowsMoved: results,
  });
}
