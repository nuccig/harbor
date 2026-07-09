import type { HTMLAttributes } from 'react'
import styles from './primitives.module.css'

export interface StatusMessageProps extends HTMLAttributes<HTMLDivElement> {
  atomic?: boolean
}

export function StatusMessage({
  atomic = true,
  className,
  ...props
}: StatusMessageProps) {
  return (
    <div
      {...props}
      aria-atomic={atomic}
      aria-live="polite"
      className={[styles.status, className].filter(Boolean).join(' ')}
      role="status"
    />
  )
}
