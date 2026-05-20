"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CoffeeLog } from "@/lib/db/schema";

interface Props {
  date: string;
  slot: "morning" | "afternoon";
  label: string;
}

const BREW_METHODS = ["espresso", "pour over", "aeropress", "other"] as const;

export default function CoffeeLogForm({ date, slot, label }: Props) {
  const [log, setLog] = useState<Partial<CoffeeLog>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-current refs so flush-on-unmount closure isn't stale
  const logRef = useRef<Partial<CoffeeLog>>({});
  logRef.current = log;

  useEffect(() => {
    fetch(`/api/coffee/${date}`)
      .then((r) => r.json())
      .then((logs: CoffeeLog[]) => {
        const entry = logs.find((l) => l.slot === slot);
        if (entry) setLog(entry);
      });
  }, [date, slot]);

  const save = useCallback(
    async (updates: Partial<CoffeeLog>) => {
      setSaveStatus("saving");
      try {
        await fetch(`/api/coffee/${date}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, ...updates }),
        });
        // Do NOT setLog(updated) here — that would overwrite in-progress edits
        setSaveStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [date, slot],
  );

  // Stable ref so the unmount effect doesn't need save in its deps
  const saveRef = useRef(save);
  saveRef.current = save;

  // Flush on unmount (SPA nav) and on visibilitychange (switch apps on phone)
  useEffect(() => {
    const flush = () => saveRef.current(logRef.current);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []); // intentionally empty — uses refs

  const debouncedSave = useCallback(
    (updates: Partial<CoffeeLog>) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => save(updates), 400);
    },
    [save],
  );

  const field = (key: keyof CoffeeLog, value: string) => {
    const updates = { ...logRef.current, [key]: value };
    setLog(updates);
    debouncedSave(updates);
  };

  const rating = parseInt(log.rating ?? "0");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm capitalize">{label}</CardTitle>
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground animate-pulse">
              SAVING…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-primary">SAVED ✓</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Beans + Roaster */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Beans
            </Label>
            <Input
              value={log.beans ?? ""}
              onChange={(e) => field("beans", e.target.value)}
              placeholder="Ethiopia Yirgacheffe"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Roaster
            </Label>
            <Input
              value={log.roaster ?? ""}
              onChange={(e) => field("roaster", e.target.value)}
              placeholder="Onyx"
              className="text-sm"
            />
          </div>
        </div>

        {/* Brew method pills */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Method
          </Label>
          <div className="flex flex-wrap gap-2">
            {BREW_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => {
                  const updates = { ...logRef.current, brewMethod: method };
                  setLog(updates);
                  save(updates);
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-colors capitalize",
                  log.brewMethod === method
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Dose / Yield / Time */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Dose (g)
            </Label>
            <Input
              value={log.doseG ?? ""}
              onChange={(e) => field("doseG", e.target.value)}
              placeholder="18"
              className="text-sm"
              inputMode="decimal"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Yield (g)
            </Label>
            <Input
              value={log.yieldG ?? ""}
              onChange={(e) => field("yieldG", e.target.value)}
              placeholder="36"
              className="text-sm"
              inputMode="decimal"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Time (sec)
            </Label>
            <Input
              value={log.timeSec ?? ""}
              onChange={(e) => field("timeSec", e.target.value)}
              placeholder="28"
              className="text-sm"
              inputMode="decimal"
            />
          </div>
        </div>

        {/* Grind setting */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Grind setting
          </Label>
          <Input
            value={log.grindSetting ?? ""}
            onChange={(e) => field("grindSetting", e.target.value)}
            placeholder="15"
            className="text-sm w-32"
          />
        </div>

        {/* Rating stars */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Rating
          </Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  const updates = { ...logRef.current, rating: String(star) };
                  setLog(updates);
                  save(updates);
                }}
                className="text-2xl leading-none transition-transform active:scale-110"
              >
                <span
                  className={
                    star <= rating ? "text-primary" : "text-muted-foreground/30"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasting notes */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Tasting notes
          </Label>
          <Textarea
            value={log.tastingNotes ?? ""}
            onChange={(e) => field("tastingNotes", e.target.value)}
            placeholder="Bright, citrus, light body. Maybe a touch under-extracted..."
            rows={3}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
