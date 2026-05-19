import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, session.user.id),
        eq(journalEntries.date, date),
      ),
    )
    .limit(1);

  return NextResponse.json(entry ?? null);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const body = await request.json();

  const [entry] = await db
    .insert(journalEntries)
    .values({
      userId: session.user.id,
      date,
      ...body,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [journalEntries.userId, journalEntries.date],
      set: {
        ...body,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(entry);
}
