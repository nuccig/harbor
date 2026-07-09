import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './primitives.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  className,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[`button_${variant}`], className]
    .filter(Boolean)
    .join(' ')

  return <button {...props} className={classes} data-variant={variant} type={type} />
}

export interface IconButtonProps extends Omit<ButtonProps, 'aria-label' | 'children'> {
  'aria-label': string
  children: ReactNode
}

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <Button
      {...props}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
    />
  )
}
