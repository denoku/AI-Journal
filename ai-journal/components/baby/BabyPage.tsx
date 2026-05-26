"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BabyLog, BabyFood } from "@/lib/db/schema";
import { X, ChevronDown, ChevronUp, Plus } from "lucide-react";

// Wake window in minutes by age in weeks
function getWakeWindow(ageWeeks: number): number {
  if (ageWeeks < 8) return 60;
  if (ageWeeks < 16) return 75;
  if (ageWeeks < 24) return 120;
  if (ageWeeks < 36) return 150;
  if (ageWeeks < 52) return 180;
  if (ageWeeks < 78) return 210;
  return 240;
}

function ageLabel(dob: string): string {
  const birth = new Date(dob + "T12:00:00");
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24),
  );
  const weeks = Math.floor(days / 7);
  if (weeks < 16) return `${weeks}w old`;
  const months = Math.floor(days / 30.4);
  return `${months} months old`;
}

function ageWeeks(dob: string): number {
  const birth = new Date(dob + "T12:00:00");
  const now = new Date();
  return Math.floor(
    (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const EVENT_META: Record<
  BabyLog["type"],
  { icon: string; label: string; color: string }
> = {
  sleep_start: { icon: "💤", label: "Sleep", color: "text-blue-400" },
  sleep_end: { icon: "🌞", label: "Wake", color: "text-yellow-400" },
  feed: { icon: "🍼", label: "Feed", color: "text-green-400" },
  diaper: { icon: "🧷", label: "Diaper", color: "text-muted-foreground" },
};

export default function BabyPage() {
  const [babyDob, setBabyDob] = useState<string | null>(null);
  const [dobInput, setDobInput] = useState("");
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualType, setManualType] = useState<BabyLog["type"]>("sleep_end");
  const [manualTime, setManualTime] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [now, setNow] = useState(new Date());

  // Update clock every 30s for live nap countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const [foods, setFoods] = useState<BabyFood[]>([]);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [foodReaction, setFoodReaction] =
    useState<BabyFood["reaction"]>("liked");
  const [foodNotes, setFoodNotes] = useState("");
  const [foodDate, setFoodDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [settingsRes, logsRes, foodsRes] = await Promise.all([
        fetch("/api/baby/settings"),
        fetch("/api/baby/logs"),
        fetch("/api/baby/foods"),
      ]);
      const settings = await settingsRes.json();
      const logsData: BabyLog[] = await logsRes.json();
      const foodsData: BabyFood[] = await foodsRes.json();
      setBabyDob(settings.babyDob ?? null);
      setLogs(
        Array.isArray(logsData)
          ? logsData.map((l) => ({
              ...l,
              time: new Date(l.time),
              createdAt: new Date(l.createdAt),
            }))
          : [],
      );
      setFoods(Array.isArray(foodsData) ? foodsData : []);
    } catch (e) {
      console.error("loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveDob = async () => {
    if (!dobInput) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/baby/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babyDob: dobInput }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setBabyDob(dobInput);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Could not save — try again",
      );
    } finally {
      setSaving(false);
    }
  };

  const logEvent = async (
    type: BabyLog["type"],
    time?: Date,
    notes?: string,
  ) => {
    const eventTime = time ?? new Date();
    const res = await fetch("/api/baby/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, time: eventTime.toISOString(), notes }),
    });
    const log = await res.json();
    setLogs((prev) =>
      [
        ...prev,
        {
          ...log,
          time: new Date(log.time),
          createdAt: new Date(log.createdAt),
        },
      ].sort((a, b) => a.time.getTime() - b.time.getTime()),
    );
  };

  const addFood = async () => {
    if (!foodName.trim()) return;
    const res = await fetch("/api/baby/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: foodName.trim(),
        dateTried: foodDate,
        reaction: foodReaction,
        notes: foodNotes.trim() || null,
      }),
    });
    const food: BabyFood = await res.json();
    setFoods((prev) => [food, ...prev]);
    setFoodName("");
    setFoodNotes("");
    setShowFoodForm(false);
  };

  const deleteFood = async (id: number) => {
    await fetch(`/api/baby/foods?id=${id}`, { method: "DELETE" });
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const deleteLog = async (id: number) => {
    await fetch(`/api/baby/logs?id=${id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const logManual = async () => {
    if (!manualTime) return;
    const [hours, minutes] = manualTime.split(":").map(Number);
    const t = new Date();
    t.setHours(hours, minutes, 0, 0);
    await logEvent(manualType, t, manualNotes || undefined);
    setShowManual(false);
    setManualTime("");
    setManualNotes("");
  };

  // Compute current status from all loaded logs
  const lastLog = logs.at(-1);
  const isSleeping = lastLog?.type === "sleep_start";
  const lastWakeLog = [...logs].reverse().find((l) => l.type === "sleep_end");

  const statusDuration = lastLog ? now.getTime() - lastLog.time.getTime() : 0;
  const statusLabel = isSleeping ? "💤 Sleeping" : "🌞 Awake";

  // Nap suggestion
  let napSuggestion: {
    text: string;
    urgency: "normal" | "soon" | "overdue";
  } | null = null;
  if (!isSleeping && lastWakeLog && babyDob) {
    const wakeWindowMs = getWakeWindow(ageWeeks(babyDob)) * 60000;
    const suggestedNapTime = new Date(
      lastWakeLog.time.getTime() + wakeWindowMs,
    );
    const msUntilNap = suggestedNapTime.getTime() - now.getTime();
    const minsUntil = Math.round(msUntilNap / 60000);
    if (minsUntil > 30) {
      napSuggestion = {
        text: `Suggested nap at ${formatTime(suggestedNapTime)} (in ${formatDuration(msUntilNap)})`,
        urgency: "normal",
      };
    } else if (minsUntil > 0) {
      napSuggestion = {
        text: `Nap time soon — ${minsUntil}m window`,
        urgency: "soon",
      };
    } else {
      napSuggestion = {
        text: `Overtired zone — put her down now`,
        urgency: "overdue",
      };
    }
  }

  // Total sleep today
  let totalSleepMs = 0;
  const todayStr = now.toLocaleDateString("en-CA");
  const todayLogs = logs.filter(
    (l) => l.time.toLocaleDateString("en-CA") === todayStr,
  );
  for (let i = 0; i < todayLogs.length; i++) {
    if (todayLogs[i].type === "sleep_start") {
      const end = todayLogs.slice(i + 1).find((l) => l.type === "sleep_end");
      if (end) {
        totalSleepMs += end.time.getTime() - todayLogs[i].time.getTime();
      } else if (isSleeping) {
        totalSleepMs += now.getTime() - todayLogs[i].time.getTime();
      }
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!babyDob)
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold">Baby Tracker</h1>
          <p className="text-xs text-muted-foreground">
            Set up your daughter's profile
          </p>
        </div>
        <div className="px-4 pt-8 pb-24 max-w-sm mx-auto space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm mb-2 block">
                  Daughter's date of birth
                </Label>
                <Input
                  type="date"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={saveDob}
                disabled={!dobInput || saving}
                className="w-full"
              >
                {saving ? "Saving…" : "Start tracking"}
              </Button>
              {saveError && (
                <p className="text-xs text-destructive text-center">
                  {saveError}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Daughter</h1>
            <p className="text-xs text-muted-foreground">{ageLabel(babyDob)}</p>
          </div>
          {totalSleepMs > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Sleep today</p>
              <p className="text-sm font-semibold text-blue-400">
                {formatDuration(totalSleepMs)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Status + Nap suggestion */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-semibold">{statusLabel}</p>
                {lastLog && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    for {formatDuration(statusDuration)}
                    <span className="ml-2 text-xs">
                      since {formatTime(lastLog.time)}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {napSuggestion && (
              <p
                className={cn("text-sm mt-3 font-medium", {
                  "text-muted-foreground": napSuggestion.urgency === "normal",
                  "text-yellow-400": napSuggestion.urgency === "soon",
                  "text-red-400": napSuggestion.urgency === "overdue",
                })}
              >
                {napSuggestion.text}
              </p>
            )}
            {!isSleeping && !lastWakeLog && (
              <p className="text-xs text-muted-foreground mt-2">
                Log a wake event to get nap suggestions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick log buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => logEvent("sleep_end")}
            className="bg-yellow-500/15 border border-yellow-500/30 rounded-xl p-4 text-left active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">🌞</div>
            <div className="text-sm font-medium">Wake</div>
            <div className="text-xs text-muted-foreground">Log wake time</div>
          </button>
          <button
            onClick={() => logEvent("sleep_start")}
            className="bg-blue-500/15 border border-blue-500/30 rounded-xl p-4 text-left active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">💤</div>
            <div className="text-sm font-medium">Sleep</div>
            <div className="text-xs text-muted-foreground">Log sleep start</div>
          </button>
          <button
            onClick={() => logEvent("feed")}
            className="bg-green-500/15 border border-green-500/30 rounded-xl p-4 text-left active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">🍼</div>
            <div className="text-sm font-medium">Feed</div>
            <div className="text-xs text-muted-foreground">Log feeding</div>
          </button>
          <button
            onClick={() => logEvent("diaper")}
            className="bg-secondary border border-border rounded-xl p-4 text-left active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">🧷</div>
            <div className="text-sm font-medium">Diaper</div>
            <div className="text-xs text-muted-foreground">Log change</div>
          </button>
        </div>

        {/* Manual time entry toggle */}
        <button
          onClick={() => setShowManual((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          {showManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Log at a specific time
        </button>

        {showManual && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(["sleep_end", "sleep_start", "feed", "diaper"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setManualType(type)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs border transition-colors text-left",
                        manualType === type
                          ? "bg-primary/20 border-primary text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {EVENT_META[type].icon} {EVENT_META[type].label}
                    </button>
                  ),
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={logManual} disabled={!manualTime}>
                  Log
                </Button>
              </div>
              <Input
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="text-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* Today's timeline */}
        {todayLogs.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today's timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayLogs.map((log, i) => {
                const meta = EVENT_META[log.type];
                const prev = todayLogs[i - 1];
                const sincePrev = prev
                  ? log.time.getTime() - prev.time.getTime()
                  : null;
                return (
                  <div key={log.id} className="flex items-start gap-3 group">
                    <span className="text-lg leading-none mt-0.5">
                      {meta.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={cn("text-sm font-medium", meta.color)}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(log.time)}
                        </span>
                        {sincePrev !== null && sincePrev > 0 && (
                          <span className="text-xs text-muted-foreground">
                            · {formatDuration(sincePrev)} after prev
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteLog(log.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No events logged today yet — tap a button above to start.
          </p>
        )}

        {/* Foods tried */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Foods tried 🥕{" "}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({foods.length})
                </span>
              </CardTitle>
              <button
                onClick={() => setShowFoodForm((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showFoodForm && (
              <div className="space-y-3 border border-border rounded-lg p-3">
                <div>
                  <Label className="text-xs mb-1 block">Food name</Label>
                  <Input
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Sweet potato"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Date tried</Label>
                  <Input
                    type="date"
                    value={foodDate}
                    onChange={(e) => setFoodDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Reaction</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "loved", emoji: "❤️", label: "Loved" },
                        { value: "liked", emoji: "😊", label: "Liked" },
                        { value: "neutral", emoji: "😐", label: "Neutral" },
                        { value: "disliked", emoji: "😕", label: "Disliked" },
                        { value: "allergic", emoji: "⚠️", label: "Allergic" },
                      ] as const
                    ).map(({ value, emoji, label }) => (
                      <button
                        key={value}
                        onClick={() => setFoodReaction(value)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs border transition-colors",
                          foodReaction === value
                            ? "bg-primary/20 border-primary text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Notes (optional)</Label>
                  <Input
                    value={foodNotes}
                    onChange={(e) => setFoodNotes(e.target.value)}
                    placeholder="Any observations…"
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addFood}
                    disabled={!foodName.trim()}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFoodForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {foods.length === 0 && !showFoodForm && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No foods logged yet — tap + to add one.
              </p>
            )}
            {foods.map((food) => {
              const reactionEmoji =
                food.reaction === "loved"
                  ? "❤️"
                  : food.reaction === "liked"
                    ? "😊"
                    : food.reaction === "neutral"
                      ? "😐"
                      : food.reaction === "disliked"
                        ? "😕"
                        : food.reaction === "allergic"
                          ? "⚠️"
                          : "•";
              return (
                <div key={food.id} className="flex items-start gap-3 group">
                  <span className="text-lg leading-none mt-0.5">
                    {reactionEmoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium">{food.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {food.dateTried}
                      </span>
                      {food.reaction && (
                        <span className="text-xs text-muted-foreground capitalize">
                          · {food.reaction}
                        </span>
                      )}
                    </div>
                    {food.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {food.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteFood(food.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Change DOB escape hatch */}
        <button
          onClick={() => setBabyDob(null)}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground text-center w-full transition-colors"
        >
          Change birth date
        </button>
      </div>
    </div>
  );
}
