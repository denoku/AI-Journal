'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TRACKED_HABITS } from '@/lib/constants'
import { cn } from '@/lib/utils'

function getLast7Dates(): string[] {
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toLocaleDateString('en-CA'))
  }
  return dates
}

function computeStreak(dates: string[], doneMap: Record<string, boolean>): number {
  let streak = 0
  const sortedDates = [...dates].reverse() // most recent first
  for (const date of sortedDates) {
    if (doneMap[date]) streak++
    else break
  }
  return streak
}

export default function HabitsPage() {
  const [doneMap, setDoneMap] = useState<Record<string, Record<string, boolean>>>({})
  // doneMap[date][habit] = true|false
  const [loading, setLoading] = useState(true)
  const dates = getLast7Dates()

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        dates.map(date =>
          fetch(`/api/journal/${date}`).then(r => r.json()).catch(() => null)
        )
      )
      const map: Record<string, Record<string, boolean>> = {}
      results.forEach((entry, i) => {
        map[dates[i]] = {}
        if (entry?.doneHabits) {
          entry.doneHabits.forEach((h: string) => { map[dates[i]][h] = true })
        }
      })
      setDoneMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const dayLabels = dates.map(d => {
    const day = new Date(d + 'T12:00:00')
    return day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">Habit Tracker</h1>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : (
          TRACKED_HABITS.map(habit => {
            const habitDoneMap: Record<string, boolean> = {}
            dates.forEach(d => { habitDoneMap[d] = doneMap[d]?.[habit] ?? false })
            const streak = computeStreak(dates, habitDoneMap)
            const streakColor = streak >= 7 ? 'text-yellow-400' : streak >= 3 ? 'text-green-400' : 'text-muted-foreground'

            return (
              <Card key={habit}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm capitalize">{habit}</span>
                    <span className={cn('text-sm font-semibold', streakColor)}>
                      {streak > 0 ? `${streak} day streak${streak >= 7 ? ' 🏆' : streak >= 3 ? ' 🔥' : ''}` : 'No streak'}
                    </span>
                  </div>

                  {/* 7-day grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {dates.map((date, i) => {
                      const done = habitDoneMap[date]
                      return (
                        <div key={date} className="flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'w-full aspect-square rounded-sm',
                              done ? 'bg-primary' : 'bg-secondary'
                            )}
                          />
                          <span className="text-xs text-muted-foreground">{dayLabels[i]}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
