import { useState, useEffect, useCallback } from 'react'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  duration?: number
}

type ToastListener = (toast: ToastMessage) => void
const listeners: ToastListener[] = []

let count = 0
function genId() { return String(++count) }

// Call this from anywhere to fire a toast
export function toast(message: Omit<ToastMessage, 'id'>) {
  const t: ToastMessage = { ...message, id: genId() }
  listeners.forEach(l => l(t))
}

// Used by the Toaster component
export function useToastState() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener: ToastListener = (t) => {
      setToasts(prev => [...prev, t])
    }
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, dismiss }
}
