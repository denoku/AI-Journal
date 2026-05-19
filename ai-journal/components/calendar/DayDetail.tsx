'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TRACKED_HABITS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { JournalEntry, CoffeeLog } from '@/lib/db/schema'

interface Props {
  date: string
  entry: JournalEntry | null
  coffeeLogs: CoffeeLog[]
  onClose: () => void
}

export default function DayDetail({ date, entry, coffeeLogs, onClose }: Props) {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const hasAnything = entry || coffeeLogs.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[70vh] overflow-y-auto">
        {/* Handle + header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            {entry?.doneHabits && (
              <p className="text-xs text-muted-foreground">
                {entry.doneHabits.length}/{TRACKED_HABITS.length} habits done
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {!hasAnything && (
            <p className="text-sm text-muted-foreground text-center py-4">Nothing logged this day.</p>
          )}

          {/* Intentions */}
          {entry?.intentions && entry.intentions.length > 0 && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Intentions</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.intentions.map(i => (
                  <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Habits */}
          {entry?.doneHabits && entry.doneHabits.length > 0 && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Habits</p>
              <div className="flex flex-wrap gap-1.5">
                {TRACKED_HABITS.map(h => (
                  <span
                    key={h}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs border capitalize',
                      entry.doneHabits?.includes(h)
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'border-border/30 text-muted-foreground/40'
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
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Morning</p>
              <p className="text-sm leading-relaxed">{entry.morningNote}</p>
            </section>
          )}

          {/* Wins */}
          {entry?.wins && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Wins ⭐</p>
              <p className="text-sm leading-relaxed">{entry.wins}</p>
            </section>
          )}

          {/* Evening note */}
          {entry?.eveningNote && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Evening</p>
              <p className="text-sm leading-relaxed">{entry.eveningNote}</p>
            </section>
          )}

          {/* Meals */}
          {entry?.meals && Object.values(entry.meals).some(Boolean) && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Meals</p>
              <div className="space-y-1">
                {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(m =>
                  entry.meals?.[m] ? (
                    <div key={m} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground capitalize w-16 shrink-0">{m}</span>
                      <span>{entry.meals[m]}</span>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* Coffee */}
          {coffeeLogs.length > 0 && (
            <section>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Coffee ☕</p>
              <div className="space-y-2">
                {coffeeLogs.map(log => (
                  <div key={log.id} className="text-sm">
                    <span className="text-muted-foreground capitalize mr-2">{log.slot}</span>
                    <span className="font-medium">{log.beans || 'Unknown beans'}</span>
                    {(log.doseG || log.yieldG) && (
                      <span className="text-muted-foreground text-xs ml-2">
                        {log.doseG}g → {log.yieldG}g{log.timeSec && ` · ${log.timeSec}s`}
                      </span>
                    )}
                    {log.rating && (
                      <span className="text-xs ml-2">{'★'.repeat(parseInt(log.rating))}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
