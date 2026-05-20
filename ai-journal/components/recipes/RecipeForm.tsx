"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { RECIPE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/db/schema";

interface Props {
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export default function RecipeForm({ onSave, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(RECIPE_CATEGORIES[0]);
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, ingredients, steps, notes }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const recipe = await res.json();
      onSave(recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recipe");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold">New Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-24 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Title *
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe name"
            required
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Category
          </Label>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-colors",
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Ingredients
          </Label>
          <Textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="One per line..."
            rows={5}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Steps
          </Label>
          <Textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Step by step instructions..."
            rows={6}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Notes
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tips, variations, source..."
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1"
          >
            {saving ? "Saving…" : "Save Recipe"}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
