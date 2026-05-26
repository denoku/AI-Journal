"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRACKED_HABITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
  JournalEntry,
  CoffeeLog,
  CalendarEvent,
  Todo,
} from "@/lib/db/schema";

interface Props {
  date: string;
  entry: JournalEntry | null;
  coffeeLogs: CoffeeLog[];
  calEvents: CalendarEvent[];
  dayTasks: Todo[];
  onEventAdded: () => void;
  onEventDeleted: () => void;
  onTaskAdded: () => void;
  onClose: () => void;
}

const EVENT_ICON: Record<CalendarEvent["type"], string> = {
  reminder: "⏰",
  birthday: "🎂",
  event: "📅",
};

export default function DayDetail({
  date,
  entry,
  coffeeLogs,
  calEvents,
  dayTasks,
  onEventAdded,
  onEventDeleted,
  onTaskAdded,
  onClose,
}: Props) {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const isFuture = date > todayStr;

  // ── shared event form state ──────────────────────────────────────────────
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<CalendarEvent["type"]>("reminder");
  const [eventNotes, setEventNotes] = useState("");
  const [eventRecurring, setEventRecurring] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  // ── task form state (future days only) ───────────────────────────────────
  const [taskText, setTaskText] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const addEvent = async () => {
    if (!eventTitle.trim()) return;
    setSavingEvent(true);
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          title: eventTitle.trim(),
          notes: eventNotes.trim() || null,
          type: eventType,
          isRecurring: eventRecurring,
        }),
      });
      setEventTitle("");
      setEventNotes("");
      setEventRecurring(false);
      setShowAddEvent(false);
      onEventAdded();
    } finally {
      setSavingEvent(false);
    }
  };

  const deleteEvent = async (id: number) => {
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    onEventDeleted();
  };

  const addTask = async () => {
    const text = taskText.trim();
    if (!text) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/tasks/${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setTaskText("");
        onTaskAdded();
      }
    } finally {
      setAddingTask(false);
    }
  };

  const label = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Shared JSX fragments for the event list and add form.
  // Kept as plain variables (not inner components) so React never unmounts
  // the inputs on re-render, which would steal focus on every keystroke.
  const eventList = (
    <div className="space-y-1.5 mb-2">
      {calEvents.map((e) => (
        <div key={e.id} className="flex items-start gap-2 text-sm group">
          <span className="shrink-0">{EVENT_ICON[e.type]}</span>
          <div className="flex-1 min-w-0">
            <span className="font-medium">{e.title}</span>
            {e.isRecurring && (
              <span className="ml-1 text-xs text-muted-foreground">
                (yearly)
              </span>
            )}
            {e.notes && (
              <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>
            )}
          </div>
          <button
            onClick={() => deleteEvent(e.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 pt-0.5"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );

  const eventForm = (
    <div className="space-y-2 border-t border-border pt-3 mt-1">
      <Input
        value={eventTitle}
        onChange={(e) => setEventTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addEvent();
          }
        }}
        placeholder="e.g. Make pizza dough, Mom's birthday…"
        className="text-sm"
      />
      <div className="flex gap-2 flex-wrap">
        {(["reminder", "event", "birthday"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setEventType(t);
              setEventRecurring(t === "birthday");
            }}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs border transition-colors capitalize",
              eventType === t
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50",
            )}
          >
            {EVENT_ICON[t]} {t}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={eventRecurring}
          onChange={(e) => setEventRecurring(e.target.checked)}
          className="rounded"
        />
        Repeats every year (birthday / anniversary)
      </label>
      <Input
        value={eventNotes}
        onChange={(e) => setEventNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="text-sm"
      />
      <Button
        size="sm"
        onClick={addEvent}
        disabled={!eventTitle.trim() || savingEvent}
        className="w-full"
      >
        Save reminder
      </Button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════
  // FUTURE DAY — planning view
  // ════════════════════════════════════════════════════════════════════════
  if (isFuture) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Plan for {label}</p>
              <p className="text-xs text-muted-foreground">
                {dayTasks.length > 0 || calEvents.length > 0
                  ? `${dayTasks.length} task${dayTasks.length !== 1 ? "s" : ""} · ${calEvents.length} reminder${calEvents.length !== 1 ? "s" : ""}`
                  : "Nothing planned yet"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-4 py-4 space-y-5">
            {/* ── Tasks ── */}
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Tasks
              </p>
              {dayTasks.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {dayTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs",
                          t.completed
                            ? "bg-primary/10 border-primary/50 text-primary"
                            : "border-border",
                        )}
                      >
                        {t.completed ? "✓" : ""}
                      </span>
                      <span
                        className={cn(
                          t.completed && "line-through text-muted-foreground",
                        )}
                      >
                        {t.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Quick-add task */}
              <div className="flex gap-2">
                <Input
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTask();
                    }
                  }}
                  placeholder="Add a task for this day…"
                  className="text-sm h-9"
                />
                <Button
                  size="sm"
                  onClick={addTask}
                  disabled={!taskText.trim() || addingTask}
                  className="shrink-0 h-9 px-4"
                >
                  Add
                </Button>
              </div>
            </section>

            <div className="border-t border-border/50" />

            {/* ── Reminders & Events ── */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Reminders &amp; Events
                </p>
                <button
                  onClick={() => setShowAddEvent((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {showAddEvent ? "Cancel" : "+ Add"}
                </button>
              </div>
              {calEvents.length === 0 && !showAddEvent && (
                <p className="text-xs text-muted-foreground">
                  Nothing planned.
                </p>
              )}
              {eventList}
              {showAddEvent && eventForm}
            </section>
          </div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAST / TODAY — history view
  // ════════════════════════════════════════════════════════════════════════
  const hasAnything = entry || coffeeLogs.length > 0 || calEvents.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[70vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            {entry?.doneHabits && (
              <p className="text-xs text-muted-foreground">
                {entry.doneHabits.length}/{TRACKED_HABITS.length} habits done
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {!hasAnything && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nothing logged this day.
            </p>
          )}

          {/* Intentions */}
          {entry?.intentions && entry.intentions.length > 0 && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Intentions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.intentions.map((i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {i}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Habits */}
          {entry?.doneHabits && entry.doneHabits.length > 0 && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Habits
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TRACKED_HABITS.map((h) => (
                  <span
                    key={h}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs border capitalize",
                      entry.doneHabits?.includes(h)
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "border-border/30 text-muted-foreground/40",
                    )}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Morning note */}
          {entry?.morningNote && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Morning
              </p>
              <p className="text-sm leading-relaxed">{entry.morningNote}</p>
            </section>
          )}

          {/* Wins */}
          {entry?.wins && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Wins ⭐
              </p>
              <p className="text-sm leading-relaxed">{entry.wins}</p>
            </section>
          )}

          {/* Evening note */}
          {entry?.eveningNote && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Evening
              </p>
              <p className="text-sm leading-relaxed">{entry.eveningNote}</p>
            </section>
          )}

          {/* Meals */}
          {entry?.meals && Object.values(entry.meals).some(Boolean) && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Meals
              </p>
              <div className="space-y-1">
                {(["breakfast", "lunch", "dinner", "snacks"] as const).map(
                  (m) =>
                    entry.meals?.[m] ? (
                      <div key={m} className="flex gap-2 text-sm">
                        <span className="text-muted-foreground capitalize w-20 shrink-0">
                          {m}
                        </span>
                        <span>{entry.meals[m]}</span>
                      </div>
                    ) : null,
                )}
              </div>
            </section>
          )}

          {/* Coffee */}
          {coffeeLogs.length > 0 && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Coffee ☕
              </p>
              <div className="space-y-2">
                {coffeeLogs.map((log) => (
                  <div key={log.id} className="text-sm">
                    <span className="text-muted-foreground capitalize mr-2">
                      {log.slot}
                    </span>
                    <span className="font-medium">
                      {log.beans || "Unknown beans"}
                    </span>
                    {(log.doseG || log.yieldG) && (
                      <span className="text-muted-foreground text-xs ml-2">
                        {log.doseG}g → {log.yieldG}g
                        {log.timeSec && ` · ${log.timeSec}s`}
                      </span>
                    )}
                    {log.rating && (
                      <span className="text-xs ml-2">
                        {"★".repeat(parseInt(log.rating))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Events — collapsible add on past days */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Reminders &amp; Events
              </p>
              <button
                onClick={() => setShowAddEvent((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showAddEvent ? "Cancel" : "+ Add"}
              </button>
            </div>
            {calEvents.length === 0 && !showAddEvent && (
              <p className="text-xs text-muted-foreground">Nothing planned.</p>
            )}
            {eventList}
            {showAddEvent && eventForm}
          </section>
        </div>
      </div>
    </>
  );
}
