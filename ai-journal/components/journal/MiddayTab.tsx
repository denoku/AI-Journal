"use client";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChatPanel from "./ChatPanel";
import TasksCard from "./TasksCard";
import VoiceInput from "./VoiceInput";
import type { JournalEntry } from "@/lib/db/schema";

interface Props {
  entry: JournalEntry | null;
  date: string;
  onSave: (updates: Partial<JournalEntry>) => Promise<void>;
  onDebouncedSave: (updates: Partial<JournalEntry>) => void;
}

export default function MiddayTab({
  entry,
  date,
  onSave,
  onDebouncedSave,
}: Props) {
  const [midCheck, setMidCheck] = useState("");
  const intentions = entry?.intentions ?? [];

  // Only reinitialize form state when the date changes (new day loaded),
  // not on every save update.
  const initDateRef = useRef<string | null>(null);
  useEffect(() => {
    if (entry && initDateRef.current !== date) {
      initDateRef.current = date;
      setMidCheck(entry.midCheck ?? "");
    }
  }, [entry, date]);

  const stateRef = useRef({ midCheck });
  stateRef.current = { midCheck };
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    const flush = () => onSaveRef.current(stateRef.current);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Today's Intentions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Today's intentions</CardTitle>
        </CardHeader>
        <CardContent>
          {intentions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No intentions set yet — add them in Morning tab.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {intentions.map((area) => (
                <Badge key={area} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks recap */}
      <TasksCard date={date} />

      {/* Midday Check-in */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Midday check-in
            <VoiceInput
              onTranscript={(t) => {
                const next = midCheck ? midCheck + " " + t : t;
                setMidCheck(next);
                onDebouncedSave({ midCheck: next });
              }}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How's your day going? Staying on track with your intentions?"
            value={midCheck}
            rows={4}
            onChange={(e) => {
              setMidCheck(e.target.value);
              onDebouncedSave({ midCheck: e.target.value });
            }}
            onBlur={() => onSave({ midCheck })}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* AI Chat */}
      <ChatPanel date={date} />
    </div>
  );
}
