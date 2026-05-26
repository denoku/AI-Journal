import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { babyFoods } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const foods = await db
    .select()
    .from(babyFoods)
    .where(eq(babyFoods.userId, session.user.id))
    .orderBy(desc(babyFoods.dateTried), desc(babyFoods.createdAt));

  return NextResponse.json(foods);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [food] = await db
    .insert(babyFoods)
    .values({
      userId: session.user.id,
      name: body.name,
      dateTried: body.dateTried,
      reaction: body.reaction ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  return NextResponse.json(food);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  await db.delete(babyFoods).where(eq(babyFoods.id, id));
  return NextResponse.json({ ok: true });
}
