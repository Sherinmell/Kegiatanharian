import { useState } from '#imports'

export interface ToastMessage {
  id: number
  text: string
  tone: 'success' | 'warning' | 'info'
}

export function useAppToast() {
  const toasts = useState<ToastMessage[]>('harianku:toasts', () => [])

  function showToast(text: string, tone: ToastMessage['tone'] = 'success', duration = 2600) {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    toasts.value = [...toasts.value, { id, text, tone }]
    if (import.meta.client) {
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, duration)
    }
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    showToast,
    dismissToast,
  }
}
