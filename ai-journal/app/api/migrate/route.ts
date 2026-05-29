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
import { eq, and, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/migrate — see your current stable ID and all user IDs that have journal data
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      userId: journalEntries.userId,
      entries: sql<number>`count(*)`,
    })
    .from(journalEntries)
    .groupBy(journalEntries.userId)
    .orderBy(sql`count(*) desc`);

  return NextResponse.json({
    yourCurrentId: session.user.id,
    allJournalUserIds: rows,
    instructions:
      'POST { "fromUserId": "<old-id>" } to move all data from that ID to yours.',
  });
}

// POST /api/migrate — move every row from fromUserId to the current user's ID.
// For tables with unique constraints, rows that would conflict with already-migrated
// data are dropped (your existing data takes priority).
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const to = session.user.id;
  const body = await request.json();
  const { fromUserId: from } = body as { fromUserId?: string };

  if (!from)
    return NextResponse.json({ error: "fromUserId required" }, { status: 400 });
  if (from === to)
    return NextResponse.json(
      { error: "already your current ID" },
      { status: 400 },
    );

  const moved: Record<string, number> = {};

  // ── journal_entries — unique(userId, date) ──────────────────────────────
  // Drop old rows whose dates already exist under the new ID, then migrate rest
  const myDates = (
    await db
      .select({ date: journalEntries.date })
      .from(journalEntries)
      .where(eq(journalEntries.userId, to))
  ).map((r) => r.date);

  if (myDates.length) {
    await db
      .delete(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, from),
          inArray(journalEntries.date, myDates),
        ),
      );
  }
  const je = await db
    .update(journalEntries)
    .set({ userId: to })
    .where(eq(journalEntries.userId, from))
    .returning();
  moved.journal_entries = je.length;

  // ── coffee_logs — unique(userId, date, slot) ────────────────────────────
  const mySlots = await db
    .select({ date: coffeeLogs.date, slot: coffeeLogs.slot })
    .from(coffeeLogs)
    .where(eq(coffeeLogs.userId, to));

  for (const { date, slot } of mySlots) {
    await db
      .delete(coffeeLogs)
      .where(
        and(
          eq(coffeeLogs.userId, from),
          eq(coffeeLogs.date, date),
          eq(coffeeLogs.slot, slot),
        ),
      );
  }
  const cl = await db
    .update(coffeeLogs)
    .set({ userId: to })
    .where(eq(coffeeLogs.userId, from))
    .returning();
  moved.coffee_logs = cl.length;

  // ── user_settings — unique(userId, key) ────────────────────────────────
  const myKeys = (
    await db
      .select({ key: userSettings.key })
      .from(userSettings)
      .where(eq(userSettings.userId, to))
  ).map((r) => r.key);

  if (myKeys.length) {
    await db
      .delete(userSettings)
      .where(
        and(eq(userSettings.userId, from), inArray(userSettings.key, myKeys)),
      );
  }
  const us = await db
    .update(userSettings)
    .set({ userId: to })
    .where(eq(userSettings.userId, from))
    .returning();
  moved.user_settings = us.length;

  // ── tables with no unique constraint — simple update ───────────────────
  const cm = await db
    .update(chatMessages)
    .set({ userId: to })
    .where(eq(chatMessages.userId, from))
    .returning();
  moved.chat_messages = cm.length;

  const rc = await db
    .update(recipes)
    .set({ userId: to })
    .where(eq(recipes.userId, from))
    .returning();
  moved.recipes = rc.length;

  const td = await db
    .update(todos)
    .set({ userId: to })
    .where(eq(todos.userId, from))
    .returning();
  moved.todos = td.length;

  const bl = await db
    .update(babyLogs)
    .set({ userId: to })
    .where(eq(babyLogs.userId, from))
    .returning();
  moved.baby_logs = bl.length;

  const bf = await db
    .update(babyFoods)
    .set({ userId: to })
    .where(eq(babyFoods.userId, from))
    .returning();
  moved.baby_foods = bf.length;

  const ev = await db
    .update(events)
    .set({ userId: to })
    .where(eq(events.userId, from))
    .returning();
  moved.events = ev.length;

  return NextResponse.json({
    ok: true,
    migratedFrom: from,
    migratedTo: to,
    rowsMoved: moved,
  });
}
