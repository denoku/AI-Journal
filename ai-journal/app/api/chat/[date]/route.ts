import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessages, journalEntries } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  anthropic,
  JOURNAL_SYSTEM_PROMPT,
  buildJournalContext,
} from "@/lib/claude";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.userId, session.user.id),
        eq(chatMessages.date, date),
      ),
    )
    .orderBy(asc(chatMessages.createdAt));

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const { content } = await req.json();

  // Save user message
  await db.insert(chatMessages).values({
    userId: session.user.id,
    date,
    role: "user",
    content,
  });

  // Fetch journal entry for context
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

  // Fetch full chat history (including the message just saved)
  const history = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.userId, session.user.id),
        eq(chatMessages.date, date),
      ),
    )
    .orderBy(asc(chatMessages.createdAt));

  const journalContext = entry ? buildJournalContext(entry) : "";
  const systemPrompt = journalContext
    ? `${JOURNAL_SYSTEM_PROMPT}\n\n${journalContext}`
    : JOURNAL_SYSTEM_PROMPT;

  const claudeMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: claudeMessages,
        });

        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        await db.insert(chatMessages).values({
          userId: session.user.id,
          date,
          role: "assistant",
          content: fullResponse,
        });

        controller.close();
      } catch (err) {
        // Log server-side so you can see it in `npm run dev` terminal
        console.error("[chat] stream error:", err);
        // Send a readable error through the stream instead of dropping the connection
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(new TextEncoder().encode(`(Error: ${msg})`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
