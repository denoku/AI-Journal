'use client'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trash2 } from 'lucide-react'
import type { Recipe } from '@/lib/db/schema'

interface Props {
  recipe: Recipe
  onBack: () => void
  onDelete: (id: number) => void
}

export default function RecipeDetail({ recipe, onBack, onDelete }: Props) {
  const handleDelete = async () => {
    await fetch(`/api/recipes?id=${recipe.id}`, { method: 'DELETE' })
    onDelete(recipe.id)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{recipe.title}</h1>
        </div>
        <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-5">
        <Badge variant="outline">{recipe.category}</Badge>

        {recipe.ingredients && (
          <section>
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Ingredients</h2>
            <div className="text-sm whitespace-pre-line leading-relaxed">{recipe.ingredients}</div>
          </section>
        )}

        {recipe.steps && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Steps</h2>
              <div className="text-sm whitespace-pre-line leading-relaxed">{recipe.steps}</div>
            </section>
          </>
        )}

        {recipe.notes && (
          <>
            <Separator />
            <section>
              <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Notes</h2>
              <div className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{recipe.notes}</div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
