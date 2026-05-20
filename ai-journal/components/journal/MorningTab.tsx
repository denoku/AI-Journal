"use client";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatPanel from "./ChatPanel";
import TasksCard from "./TasksCard";
import { ALL_LIFE_AREAS, MAX_INTENTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JournalEntry, Meals } from "@/lib/db/schema";

interface Props {
  entry: JournalEntry | null;
  date: string;
  onSave: (updates: Partial<JournalEntry>) => Promise<void>;
  onDebouncedSave: (updates: Partial<JournalEntry>) => void;
}

export default function MorningTab({
  entry,
  date,
  onSave,
  onDebouncedSave,
}: Props) {
  const [morningNote, setMorningNote] = useState("");
  const [intentions, setIntentions] = useState<string[]>([]);
  const [meals, setMeals] = useState<Meals>({});

  // Always-current refs for flush-on-unmount
  const stateRef = useRef({ morningNote, intentions, meals });
  stateRef.current = { morningNote, intentions, meals };
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (entry) {
      setMorningNote(entry.morningNote ?? "");
      setIntentions(entry.intentions ?? []);
      setMeals(entry.meals ?? {});
    }
  }, [entry]);

  // Flush on unmount (SPA nav) and visibilitychange (switch apps on phone)
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
  }, []); // intentionally empty — uses refs

  const toggleIntention = (area: string) => {
    setIntentions((prev) => {
      let next: string[];
      if (prev.includes(area)) {
        next = prev.filter((i) => i !== area);
      } else if (prev.length < MAX_INTENTIONS) {
        next = [...prev, area];
      } else {
        return prev;
      }
      onDebouncedSave({ intentions: next });
      return next;
    });
  };

  const updateMeal = (key: keyof Meals, value: string) => {
    setMeals((prev) => {
      const next = { ...prev, [key]: value };
      onDebouncedSave({ meals: next });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Morning Note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Morning note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How are you feeling this morning? What's on your mind?"
            value={morningNote}
            rows={4}
            onChange={(e) => {
              setMorningNote(e.target.value);
              onDebouncedSave({ morningNote: e.target.value });
            }}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Intentions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Intentions
            <span className="text-muted-foreground font-normal ml-2">
              {intentions.length}/{MAX_INTENTIONS}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_LIFE_AREAS.map((area) => {
              const selected = intentions.includes(area);
              const maxed = intentions.length >= MAX_INTENTIONS && !selected;
              return (
                <button
                  key={area}
                  onClick={() => toggleIntention(area)}
                  disabled={maxed}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : maxed
                        ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                        : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
                  )}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Meal Planner */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Meal plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["breakfast", "lunch", "dinner", "snacks"] as const).map((meal) => (
            <div key={meal}>
              <Label className="text-xs text-muted-foreground capitalize mb-1 block">
                {meal}
              </Label>
              <Input
                placeholder={`${meal.charAt(0).toUpperCase() + meal.slice(1)}...`}
                value={meals[meal] ?? ""}
                onChange={(e) => updateMeal(meal, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tasks */}
      <TasksCard date={date} />

      {/* AI Chat */}
      <ChatPanel date={date} />
    </div>
  );
}
