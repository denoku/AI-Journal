import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { seedRecipesForUser } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Seed starter recipes on first visit (idempotent)
  await seedRecipesForUser(session.user.id).catch(() => {});

  const userRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, session.user.id))
    .orderBy(recipes.createdAt);

  return NextResponse.json(userRecipes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: session.user.id,
      ...body,
    })
    .returning();

  return NextResponse.json(recipe, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(recipes)
    .where(
      and(eq(recipes.id, parseInt(id)), eq(recipes.userId, session.user.id)),
    );

  return NextResponse.json({ success: true });
}
