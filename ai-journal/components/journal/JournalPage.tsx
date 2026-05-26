"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MorningTab from "./MorningTab";
import MiddayTab from "./MiddayTab";
import EveningTab from "./EveningTab";
import type { JournalEntry } from "@/lib/db/schema";

interface JournalPageProps {
  date: string;
}

export default function JournalPage({ date }: JournalPageProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/journal/${date}`)
      .then((r) => r.json())
      .then((data) => setEntry(data));
  }, [date]);

  const save = useCallback(
    async (updates: Partial<JournalEntry>) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/journal/${date}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const updated = await res.json();
        setEntry(updated);
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [date],
  );

  const debouncedSave = useCallback(
    (updates: Partial<JournalEntry>) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => save(updates), 1500);
    },
    [save],
  );

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Brian's Journal
          </h1>
          <p className="text-xs text-muted-foreground">{displayDate}</p>
        </div>
        {saveStatus === "saving" && (
          <span className="text-xs text-muted-foreground animate-pulse">
            SAVING…
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-primary transition-opacity">
            SAVED ✓
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-24">
        <Tabs defaultValue="morning" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="morning">Morning</TabsTrigger>
            <TabsTrigger value="midday">Midday</TabsTrigger>
            <TabsTrigger value="evening">Evening</TabsTrigger>
          </TabsList>

          <TabsContent value="morning">
            <MorningTab
              entry={entry}
              date={date}
              onSave={save}
              onDebouncedSave={debouncedSave}
            />
          </TabsContent>

          <TabsContent value="midday">
            <MiddayTab
              entry={entry}
              date={date}
              onSave={save}
              onDebouncedSave={debouncedSave}
            />
          </TabsContent>

          <TabsContent value="evening">
            <EveningTab
              entry={entry}
              date={date}
              onSave={save}
              onDebouncedSave={debouncedSave}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
