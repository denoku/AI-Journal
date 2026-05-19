'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import CoffeeLogForm from './CoffeeLogForm'
import CoffeeHistory from './CoffeeHistory'

export default function CoffeePage() {
  const [view, setView] = useState<'today' | 'history'>('today')
  const today = new Date().toLocaleDateString('en-CA')

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Coffee Log</h1>
            <p className="text-xs text-muted-foreground">DF64 Gen 2 · Turin</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === 'today' ? 'default' : 'ghost'}
              onClick={() => setView('today')}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={view === 'history' ? 'default' : 'ghost'}
              onClick={() => setView('history')}
            >
              History
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        {view === 'today' ? (
          <div className="space-y-4">
            <CoffeeLogForm date={today} slot="morning" label="Morning pull" />
            <CoffeeLogForm date={today} slot="afternoon" label="Afternoon pull" />
          </div>
        ) : (
          <CoffeeHistory />
        )}
      </div>
    </div>
  )
}
