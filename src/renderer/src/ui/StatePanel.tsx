import type { ReactNode } from 'react'
import styles from './primitives.module.css'

export interface EmptyStatePanelProps {
  action?: ReactNode
  guidance: string
  title: string
}

export function EmptyStatePanel({ action, guidance, title }: EmptyStatePanelProps) {
  return (
    <section className={styles.statePanel} data-state="empty">
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateCopy}>{guidance}</p>
      {action === undefined ? null : <div className={styles.stateAction}>{action}</div>}
    </section>
  )
}

export interface ErrorStatePanelProps {
  action: ReactNode
  cause: string
  title: string
}

export function ErrorStatePanel({ action, cause, title }: ErrorStatePanelProps) {
  return (
    <section className={styles.statePanel} data-state="error" role="alert">
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateCopy}>{cause}</p>
      <div className={styles.stateAction}>{action}</div>
    </section>
  )
}
