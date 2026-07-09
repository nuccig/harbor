import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactElement
} from 'react'
import styles from './primitives.module.css'

type HeadingElement = 'h1' | 'h2' | 'h3'

export interface FocusHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingElement
  focusKey?: string | number
  focusOnMount?: boolean
}

export function FocusHeading({
  as: Heading = 'h1',
  className,
  focusKey,
  focusOnMount = false,
  tabIndex = -1,
  ...props
}: FocusHeadingProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusOnMount) {
      headingRef.current?.focus()
    }
  }, [focusKey, focusOnMount])

  return (
    <Heading
      {...props}
      className={[styles.focusHeading, className].filter(Boolean).join(' ')}
      ref={headingRef}
      tabIndex={tabIndex}
    />
  )
}
