'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TRACKED_HABITS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { JournalEntry } from '@/lib/db/schema'

function getLast7Dates(): string[] {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toLocaleDateString('en-CA'))
  }
  return dates
}

export default function WeeklyPage() {
  const [entries, setEntries] = useState<(JournalEntry | null)[]>([])
  const [loading, setLoading] = useState(true)
  const dates = getLast7Dates()

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        dates.map(date =>
          fetch(`/api/journal/${date}`).then(r => r.json()).catch(() => null)
        )
      )
      setEntries(results)
      setLoading(false)
    }
    load()
  }, [])

  // Compute stats
  const intentionCounts: Record<string, number> = {}
  let mealsLoggedCount = 0
  const habitDoneCounts: Record<string, number> = {}
  TRACKED_HABITS.forEach(h => { habitDoneCounts[h] = 0 })

  entries.forEach(entry => {
    if (!entry) return
    // Intentions
    entry.intentions?.forEach(i => {
      intentionCounts[i] = (intentionCounts[i] ?? 0) + 1
    })
    // Meals
    if (entry.meals) {
      const m = entry.meals
      if (m.breakfast || m.lunch || m.dinner || m.snacks) mealsLoggedCount++
    }
    // Habits
    entry.doneHabits?.forEach(h => {
      if (h in habitDoneCounts) habitDoneCounts[h]++
    })
  })

  const topIntentions = Object.entries(intentionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const wins = entries
    .filter(e => e?.wins)
    .map(e => ({ date: e!.date, wins: e!.wins! }))

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Weekly Summary</h1>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : (
          <>
            {/* 7-Day Grid */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">7-Day Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {dates.map((date, i) => {
                    const entry = entries[i]
                    const hasWins = !!entry?.wins
                    const hasContent = entry && (entry.morningNote || entry.midCheck || entry.eveningNote)
                    const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)

                    return (
                      <div key={date} className="flex flex-col items-center gap-1">
                        <div className={cn(
                          'w-full aspect-square rounded-sm flex items-center justify-center text-xs',
                          hasContent ? 'bg-secondary' : 'bg-muted/30',
                        )}>
                          {hasWins ? '⭐' : hasContent ? <span className="text-muted-foreground">·</span> : ''}
                        </div>
                        <span className="text-xs text-muted-foreground">{dayLabel}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">⭐ = wins logged</p>
              </CardContent>
            </Card>

            {/* Habits */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Habit completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {TRACKED_HABITS.map(habit => {
                  const count = habitDoneCounts[habit]
                  const pct = count / 7
                  const barColor = pct >= 0.7 ? 'bg-green-500' : pct >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'

                  return (
                    <div key={habit}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{habit}</span>
                        <span className="text-muted-foreground">{count}/7</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', barColor)}
                          style={{ width: `${(count / 7) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Intentions */}
            {topIntentions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top intentions this week</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topIntentions.map(([intention, count]) => (
                    <div key={intention} className="flex justify-between text-sm">
                      <span className="capitalize">{intention}</span>
                      <span className="text-muted-foreground">{count}x</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-semibold">{mealsLoggedCount}</div>
                  <div className="text-xs text-muted-foreground">days with meals planned</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-semibold">{wins.length}</div>
                  <div className="text-xs text-muted-foreground">days with wins</div>
                </CardContent>
              </Card>
            </div>

            {/* Wins */}
            {wins.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Wins this week 🏆</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {wins.map(({ date, wins: w }) => {
                    const dayLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                    return (
                      <div key={date}>
                        <p className="text-xs text-muted-foreground mb-1">{dayLabel}</p>
                        <p className="text-sm">{w}</p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
