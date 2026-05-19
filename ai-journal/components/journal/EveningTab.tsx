'use client'
import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ChatPanel from './ChatPanel'
import { TRACKED_HABITS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { JournalEntry } from '@/lib/db/schema'

interface Props {
  entry: JournalEntry | null
  date: string
  onSave: (updates: Partial<JournalEntry>) => Promise<void>
  onDebouncedSave: (updates: Partial<JournalEntry>) => void
}

export default function EveningTab({ entry, date, onSave, onDebouncedSave }: Props) {
  const [doneHabits, setDoneHabits] = useState<string[]>([])
  const [eveningNote, setEveningNote] = useState('')
  const [wins, setWins] = useState('')
  const intentions = entry?.intentions ?? []

  useEffect(() => {
    if (entry) {
      setDoneHabits(entry.doneHabits ?? [])
      setEveningNote(entry.eveningNote ?? '')
      setWins(entry.wins ?? '')
    }
  }, [entry])

  const toggleHabit = (habit: string) => {
    setDoneHabits(prev => {
      const next = prev.includes(habit)
        ? prev.filter(h => h !== habit)
        : [...prev, habit]
      onSave({ doneHabits: next })
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Habits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Habits done today
            <span className="text-muted-foreground font-normal ml-2">
              {doneHabits.length}/{TRACKED_HABITS.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {TRACKED_HABITS.map(habit => {
              const done = doneHabits.includes(habit)
              return (
                <button
                  key={habit}
                  onClick={() => toggleHabit(habit)}
                  className={cn(
                    'py-3 rounded-lg text-sm font-medium border transition-all active:scale-95',
                    done
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {done ? '✓ ' : ''}{habit}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Evening Reflection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Evening reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How did the day go? What will you do differently tomorrow?"
            value={eveningNote}
            rows={4}
            onChange={e => {
              setEveningNote(e.target.value)
              onDebouncedSave({ eveningNote: e.target.value })
            }}
            onBlur={() => onSave({ eveningNote })}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Wins */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Wins today 🏆</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What went well? Big or small, write it down."
            value={wins}
            rows={3}
            onChange={e => {
              setWins(e.target.value)
              onDebouncedSave({ wins: e.target.value })
            }}
            onBlur={() => onSave({ wins })}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Intentions Recap */}
      {intentions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's intentions recap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {intentions.map(area => {
                const done = doneHabits.includes(area)
                return (
                  <Badge
                    key={area}
                    variant={done ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {area}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Chat */}
      <ChatPanel date={date} />
    </div>
  )
}
