'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CoffeeLog } from '@/lib/db/schema'

function formatRatio(doseG: string | null, yieldG: string | null): string {
  const dose = parseFloat(doseG ?? '')
  const yield_ = parseFloat(yieldG ?? '')
  if (!dose || !yield_) return '—'
  return `1:${(yield_ / dose).toFixed(1)}`
}

function Stars({ rating }: { rating: string | null }) {
  const n = parseInt(rating ?? '0')
  return (
    <span className="text-sm">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= n ? 'text-primary' : 'text-muted-foreground/30'}>★</span>
      ))}
    </span>
  )
}

export default function CoffeeHistory() {
  const [logs, setLogs] = useState<CoffeeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coffee')
      .then(r => r.json())
      .then(data => { setLogs(data); setLoading(false) })
  }, [])

  // Group by date
  const byDate = logs.reduce<Record<string, CoffeeLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = []
    acc[log.date].push(log)
    return acc
  }, {})

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
  if (logs.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No pulls logged yet.</p>

  return (
    <div className="space-y-4">
      {Object.entries(byDate).map(([date, entries]) => {
        const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        })
        return (
          <div key={date}>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{label}</p>
            <div className="space-y-2">
              {entries.map(log => (
                <Card key={log.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-sm font-medium">{log.beans || 'Unknown beans'}</span>
                        {log.roaster && <span className="text-xs text-muted-foreground ml-2">{log.roaster}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs capitalize">{log.slot}</Badge>
                        <Stars rating={log.rating} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {(log.doseG || log.yieldG) && (
                        <span>⚖ {log.doseG ?? '?'}g → {log.yieldG ?? '?'}g ({formatRatio(log.doseG, log.yieldG)})</span>
                      )}
                      {log.timeSec && <span>⏱ {log.timeSec}s</span>}
                      {log.grindSetting && <span>⚙ {log.grindSetting}</span>}
                      {log.brewMethod && <span className="capitalize">{log.brewMethod}</span>}
                    </div>
                    {log.tastingNotes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">"{log.tastingNotes}"</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
