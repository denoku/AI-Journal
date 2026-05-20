"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecipeForm from "./RecipeForm";
import RecipeDetail from "./RecipeDetail";
import { RECIPE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/db/schema";
import { Plus, Trash2 } from "lucide-react";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("All");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setRecipes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    category === "All"
      ? recipes
      : recipes.filter((r) => r.category === category);

  const handleAdd = (recipe: Recipe) => {
    setRecipes((prev) => [...prev, recipe]);
    setShowForm(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  if (selected) {
    return (
      <RecipeDetail
        recipe={selected}
        onBack={() => setSelected(null)}
        onDelete={(id: number) => {
          setRecipes((prev) => prev.filter((r) => r.id !== id));
          setSelected(null);
        }}
      />
    );
  }

  if (showForm) {
    return (
      <RecipeForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Recipes</h1>
          <p className="text-xs text-muted-foreground">
            {recipes.length} recipes
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Category filter */}
      <div className="px-4 pt-3 pb-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {(["All", ...RECIPE_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-colors whitespace-nowrap",
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

      <div className="px-4 pb-24 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {category === "All"
              ? "No recipes yet."
              : `No ${category} recipes yet.`}
          </p>
        ) : (
          filtered.map((recipe) => (
            <Card
              key={recipe.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelected(recipe)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {recipe.title}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {recipe.category}
                    </Badge>
                  </div>
                  <button
                    onClick={(e) => handleDelete(recipe.id, e)}
                    className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
