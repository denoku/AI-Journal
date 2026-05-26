"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalendarEvent, Todo } from "@/lib/db/schema";

const EVENT_ICONS: Record<string, string> = {
  reminder: "⏰",
  birthday: "🎂",
  event: "📅",
};

interface Props {
  date: string; // YYYY-MM-DD, the journal's current date
}

export default function AgendaCard({ date }: Props) {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Todo[]>([]);

  useEffect(() => {
    // Fetch events for this month
    const month = date.slice(0, 7); // YYYY-MM
    fetch(`/api/events?month=${month}`)
      .then(r => r.json())
      .then((data: CalendarEvent[]) => {
        if (!Array.isArray(data)) return;
        const mm_dd = date.slice(5); // MM-DD for recurring match
        const relevant = data.filter(e => {
          if (e.isRecurring) return e.date.slice(5) === mm_dd;
          return e.date === date;
        });
        setTodayEvents(relevant);
      })
      .catch(() => {});

    // Fetch tasks for today — show incomplete ones as "agenda"
    fetch(`/api/tasks/${date}`)
      .then(r => r.json())
      .then((data: Todo[]) => {
        if (Array.isArray(data)) {
          setUpcomingTasks(data.filter(t => !t.completed));
        }
      })
      .catch(() => {});
  }, [date]);

  if (todayEvents.length === 0 && upcomingTasks.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Today&apos;s agenda 📋</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {todayEvents.map(e => (
          <div key={e.id} className="flex items-start gap-2 text-sm">
            <span className="shrink-0">{EVENT_ICONS[e.type] ?? "📅"}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{e.title}</span>
              {e.notes && (
                <p className="text-xs text-muted-foreground">{e.notes}</p>
              )}
            </div>
          </div>
        ))}
        {upcomingTasks.length > 0 && todayEvents.length > 0 && (
          <div className="border-t border-primary/20 pt-1.5" />
        )}
        {upcomingTasks.map(t => (
          <div key={t.id} className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted-foreground">•</span>
            <span>{t.text}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
