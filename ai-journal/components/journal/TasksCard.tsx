"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/db/schema";

interface Props {
  date: string;
}

export default function TasksCard({ date }: Props) {
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/tasks/${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      });
  }, [date]);

  const addTask = async () => {
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/tasks/${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const todo = await res.json();
        setTasks((prev) => [...prev, todo]);
        setNewText("");
        inputRef.current?.focus();
      }
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (id: number) => {
    const res = await fetch(`/api/tasks/${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const remove = async (id: number) => {
    await fetch(`/api/tasks/${date}?id=${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const incomplete = tasks.filter((t) => !t.completed);
  const complete = tasks.filter((t) => t.completed);
  const allDone = tasks.length > 0 && incomplete.length === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Today's tasks</span>
          {tasks.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {complete.length}/{tasks.length} done
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Empty state */}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground py-1">
            No tasks yet — add one below.
          </p>
        )}

        {/* All done celebration */}
        {allDone && <p className="text-xs text-primary py-1">All done! 🎉</p>}

        {/* Incomplete tasks */}
        {incomplete.map((task) => (
          <div key={task.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(task.id)}
              className="shrink-0 w-5 h-5 rounded border border-border flex items-center justify-center text-xs hover:border-primary transition-colors"
            >
              <span className="opacity-0 group-hover:opacity-50">✓</span>
            </button>
            <span className="flex-1 text-sm">{task.text}</span>
            <button
              onClick={() => remove(task.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Divider between incomplete and complete */}
        {complete.length > 0 && incomplete.length > 0 && (
          <div className="border-t border-border/50 pt-2" />
        )}

        {/* Completed tasks */}
        {complete.map((task) => (
          <div key={task.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggle(task.id)}
              className="shrink-0 w-5 h-5 rounded border border-primary/50 bg-primary/10 flex items-center justify-center text-xs text-primary"
            >
              ✓
            </button>
            <span className="flex-1 text-sm text-muted-foreground line-through">
              {task.text}
            </span>
            <button
              onClick={() => remove(task.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Add task input */}
        <div className="flex gap-2 pt-1">
          <Input
            ref={inputRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTask();
              }
            }}
            placeholder="Add a task…"
            className="text-sm h-8"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={addTask}
            disabled={!newText.trim() || adding}
            className="shrink-0 h-8 w-8 p-0"
          >
            <Plus size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
