import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessages, journalEntries } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  openai,
  JOURNAL_SYSTEM_PROMPT,
  buildJournalContext,
} from "@/lib/claude";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
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
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const { content } = await request.json();

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

  // Fetch chat history (excluding the message we just inserted)
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
  const systemContent = journalContext
    ? `${JOURNAL_SYSTEM_PROMPT}\n\n${journalContext}`
    : JOURNAL_SYSTEM_PROMPT;

  // Build OpenAI message array (all history including the new user message)
  const oaiMessages: { role: "user" | "assistant"; content: string }[] =
    history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const oaiStream = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: systemContent },
            ...oaiMessages,
          ],
        });

        for await (const chunk of oaiStream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        // Save assistant response
        await db.insert(chatMessages).values({
          userId: session.user.id,
          date,
          role: "assistant",
          content: fullResponse,
        });

        controller.close();
      } catch (err) {
        controller.error(err);
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
