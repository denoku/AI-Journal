import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, and, like, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/events?month=YYYY-MM
// Returns all one-time events in the given month PLUS all yearly-recurring events
// (the client matches recurring events to the correct year).
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month"); // e.g. "2025-06"

  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.userId, session.user.id),
        month
          ? or(
              like(events.date, `${month}%`),   // exact month match
              eq(events.isRecurring, true),       // all recurring (birthday etc)
            )
          : undefined,
      ),
    )
    .orderBy(events.date);

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date, title, notes, type, isRecurring } = body;

  if (!date || !title?.trim())
    return NextResponse.json({ error: "date and title required" }, { status: 400 });

  const [row] = await db
    .insert(events)
    .values({
      userId: session.user.id,
      date,
      title: title.trim(),
      notes: notes?.trim() || null,
      type: type ?? "reminder",
      isRecurring: Boolean(isRecurring),
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
