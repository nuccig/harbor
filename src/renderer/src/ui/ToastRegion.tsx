import { useEffect, useRef } from 'react'
import type { ToastMessage } from '../app/experience-model'
import styles from './primitives.module.css'

export const DEFAULT_TOAST_DURATION_MS = 4_000

export interface ToastRegionProps {
  duration?: number
  onDismiss: () => void
  toast: ToastMessage | null
}

export function ToastRegion({
  duration = DEFAULT_TOAST_DURATION_MS,
  onDismiss,
  toast
}: ToastRegionProps) {
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (toast === null) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      dismissRef.current()
    }, duration)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [duration, toast])

  if (toast === null) {
    return null
  }

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={styles.toast}
      data-tone={toast.tone}
      role="status"
    >
      <strong className={styles.toastTitle}>{toast.title}</strong>
      <span className={styles.toastMessage}>{toast.message}</span>
    </div>
  )
}
