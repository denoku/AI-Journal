'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRACKED_HABITS } from '@/lib/constants'
import type { JournalEntry, CoffeeLog } from '@/lib/db/schema'
import DayDetail from './DayDetail'

function getMonthDates(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad end to complete the last week
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({})
  const [coffeeLogs, setCoffeeLogs] = useState<CoffeeLog[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const todayStr = now.toLocaleDateString('en-CA')
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const loadMonth = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/journal?month=${monthKey}`)
    const data: JournalEntry[] = await res.json()
    const map: Record<string, JournalEntry> = {}
    data.forEach(e => { map[e.date] = e })
    setEntries(map)
    setLoading(false)
  }, [monthKey])

  useEffect(() => { loadMonth() }, [loadMonth])

  useEffect(() => {
    fetch('/api/coffee')
      .then(r => r.json())
      .then((data: CoffeeLog[]) => setCoffeeLogs(data))
  }, [])

  const coffeeByDate = coffeeLogs.reduce<Record<string, boolean>>((acc, log) => {
    acc[log.date] = true
    return acc
  }, {})

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const cells = getMonthDates(year, month)
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric'
  })

  // This week stats (last 7 days from today)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-CA')
  })
  const weekEntries = last7.map(d => entries[d] ?? null)
  const habitCounts: Record<string, number> = {}
  TRACKED_HABITS.forEach(h => { habitCounts[h] = 0 })
  weekEntries.forEach(e => {
    e?.doneHabits?.forEach(h => { if (h in habitCounts) habitCounts[h]++ })
  })

  const selectedEntry = selectedDate ? entries[selectedDate] ?? null : null
  const selectedCoffee = selectedDate ? coffeeLogs.filter(l => l.date === selectedDate) : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft size={16} />
          </Button>
          <h1 className="text-base font-semibold">{monthLabel}</h1>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="px-3 pt-3 pb-24">
        {/* Day of week header */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const ds = dateStr(year, month, day)
            const entry = entries[ds]
            const hasCoffee = coffeeByDate[ds]
            const isToday = ds === todayStr
            const isFuture = ds > todayStr
            const habitsCount = entry?.doneHabits?.length ?? 0
            const allHabits = habitsCount >= TRACKED_HABITS.length
            const hasActivity = habitsCount > 0 || !!entry?.morningNote || !!entry?.wins
            const isSelected = ds === selectedDate

            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(isSelected ? null : ds)}
                disabled={isFuture}
                className={cn(
                  'relative aspect-square rounded-lg border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 p-1',
                  isFuture && 'opacity-25 cursor-default',
                  !isFuture && !hasActivity && 'border-border/30 bg-transparent text-muted-foreground hover:border-border',
                  !isFuture && hasActivity && habitsCount < 4 && 'border-border bg-secondary text-foreground hover:border-primary/50',
                  !isFuture && habitsCount >= 4 && 'border-primary/40 bg-primary/20 text-foreground hover:bg-primary/30',
                  isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                  isSelected && 'ring-2 ring-primary',
                )}
              >
                <span>{day}</span>
                <span className="text-[9px] leading-none h-3 flex items-center gap-px">
                  {entry?.wins && '⭐'}
                  {hasCoffee && '☕'}
                  {allHabits && '💪'}
                </span>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-primary/20 border border-primary/40 inline-block" />
            4+ habits
          </span>
          <span>⭐ wins</span>
          <span>☕ coffee</span>
          <span>💪 all habits</span>
        </div>

        {/* This week stats */}
        <div className="mt-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">This week</p>
          <div className="space-y-2">
            {TRACKED_HABITS.map(habit => {
              const count = habitCounts[habit]
              const pct = count / 7
              const barColor =
                pct >= 0.7
                  ? 'bg-green-500'
                  : pct >= 0.4
                  ? 'bg-yellow-500'
                  : count > 0
                  ? 'bg-red-500'
                  : 'bg-muted'
              return (
                <div key={habit} className="flex items-center gap-2">
                  <span className="text-xs capitalize w-16 shrink-0">{habit}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', barColor)}
                      style={{ width: `${(count / 7) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}/7</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          entry={selectedEntry}
          coffeeLogs={selectedCoffee}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
