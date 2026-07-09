import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  PropsWithChildren
} from 'react'
import styles from './primitives.module.css'

export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string
}

export function SkipLink({
  children = 'Skip to main content',
  className,
  targetId = 'main-content',
  ...props
}: PropsWithChildren<SkipLinkProps>) {
  return (
    <a
      {...props}
      className={[styles.skipLink, className].filter(Boolean).join(' ')}
      href={`#${targetId}`}
    >
      {children}
    </a>
  )
}

export interface SkipTargetProps extends HTMLAttributes<HTMLElement> {
  id?: string
}

export function SkipTarget({
  className,
  id = 'main-content',
  tabIndex = -1,
  ...props
}: SkipTargetProps) {
  return (
    <main
      {...props}
      className={[styles.skipTarget, className].filter(Boolean).join(' ')}
      id={id}
      tabIndex={tabIndex}
    />
  )
}
