import type { ReactNode } from 'react'
import styles from './primitives.module.css'

type SemanticIconProps =
  | {
      children: ReactNode
      decorative: true
      label?: never
    }
  | {
      children: ReactNode
      decorative?: false
      label: string
    }

export function SemanticIcon(props: SemanticIconProps) {
  if (props.decorative) {
    return (
      <span aria-hidden="true" className={styles.icon}>
        {props.children}
      </span>
    )
  }

  return (
    <span aria-label={props.label} className={styles.icon} role="img">
      {props.children}
    </span>
  )
}
