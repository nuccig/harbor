import type { HTMLAttributes } from 'react'
import styles from './primitives.module.css'

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: string
}

export function Skeleton({ className, style, width = '100%', ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ ...style, width }}
    />
  )
}
