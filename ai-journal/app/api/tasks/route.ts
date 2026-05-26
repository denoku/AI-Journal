import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/tasks?month=YYYY-MM
// Returns all todos for the authenticated user in the given month.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month");
  if (!month)
    return NextResponse.json({ error: "month required" }, { status: 400 });

  const items = await db
    .select()
    .from(todos)
    .where(
      and(eq(todos.userId, session.user.id), like(todos.date, `${month}%`)),
    )
    .orderBy(todos.date, todos.createdAt);

  return NextResponse.json(items);
}
