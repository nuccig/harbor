import { CheckCircle, Clock, Minus, Warning } from '@phosphor-icons/react'
import styles from './primitives.module.css'

export interface StatusChipProps {
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  label: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const defaultIconsByTone = {
  success: CheckCircle,
  warning: Clock,
  danger: Warning,
  neutral: Minus
} as const

export function StatusChip({ tone, label, icon }: StatusChipProps) {
  const Icon = icon ?? defaultIconsByTone[tone]
  return (
    <span className={`${styles.statusChip} ${styles[`statusChip_${tone}`]}`}>
      <span aria-hidden="true" className={styles.statusDot} />
      <Icon aria-hidden="true" className={styles.statusIcon} weight="regular" />
      <span className={styles.statusLabel}>{label}</span>
    </span>
  )
}
