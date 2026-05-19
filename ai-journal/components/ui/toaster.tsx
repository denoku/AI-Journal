'use client'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'
import { useToastState } from './use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToastState()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, duration = 4000 }) => (
        <Toast
          key={id}
          open
          onOpenChange={(open) => { if (!open) dismiss(id) }}
          duration={duration}
        >
          <div className="flex-1 min-w-0">
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
