'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface ChatPanelProps {
  date: string
}

export default function ChatPanel({ date }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/chat/${date}`)
      .then(r => r.json())
      .then((data: { role: 'user' | 'assistant'; content: string }[]) => {
        setMessages(data.map(m => ({ role: m.role, content: m.content })))
      })
  }, [date])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || loading) return

    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content }])

    // Add placeholder for streaming response
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch(`/api/chat/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: text, streaming: true }
          return next
        })
      }

      // Mark as done
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: text }
        return next
      })
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: 'Error: could not get response.' }
        return next
      })
    } finally {
      setLoading(false)
    }
  }, [date, input, loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">AI assistant</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Message list */}
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto px-4 py-2 space-y-3"
        >
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Ask me anything about your day, plans, or habits.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="inline-block w-1 h-3 bg-current ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-3 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message… (Enter to send)"
            rows={1}
            className="text-sm resize-none min-h-[38px] max-h-32 flex-1"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="shrink-0 h-9 w-9"
          >
            <Send size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
