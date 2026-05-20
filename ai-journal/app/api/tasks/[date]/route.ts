import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/tasks/[date] — list todos for a date
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { date } = await params;
  const items = await db
    .select()
    .from(todos)
    .where(and(eq(todos.userId, session.user.id), eq(todos.date, date)))
    .orderBy(asc(todos.createdAt));
  return NextResponse.json(items);
}

// POST /api/tasks/[date] — create a todo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { date } = await params;
  const { text } = await req.json();
  if (!text?.trim())
    return NextResponse.json({ error: "text required" }, { status: 400 });
  const [todo] = await db
    .insert(todos)
    .values({ userId: session.user.id, date, text: text.trim() })
    .returning();
  return NextResponse.json(todo, { status: 201 });
}

// PUT /api/tasks/[date] — toggle a todo by id (body: { id })
export async function PUT(
  req: NextRequest,
  _ctx: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const [todo] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, session.user.id)))
    .limit(1);
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [updated] = await db
    .update(todos)
    .set({
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date() : null,
    })
    .where(eq(todos.id, id))
    .returning();
  return NextResponse.json(updated);
}

// DELETE /api/tasks/[date]?id=N — delete a todo by id
export async function DELETE(
  req: NextRequest,
  _ctx: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db
    .delete(todos)
    .where(and(eq(todos.id, parseInt(id)), eq(todos.userId, session.user.id)));
  return NextResponse.json({ success: true });
}
