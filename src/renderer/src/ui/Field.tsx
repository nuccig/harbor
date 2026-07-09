import { useId, type InputHTMLAttributes } from 'react'
import styles from './primitives.module.css'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-describedby'> {
  label: string
  hint?: string
  error?: string
  'aria-describedby'?: string
}

export function TextField({
  'aria-describedby': externalDescription,
  'aria-invalid': ariaInvalid,
  className,
  error,
  hint,
  id: providedId,
  label,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = providedId ?? generatedId
  const hintId = hint === undefined ? undefined : `${inputId}-hint`
  const errorId = error === undefined ? undefined : `${inputId}-error`
  const describedBy = [externalDescription, hintId, errorId].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={describedBy || undefined}
        aria-invalid={error === undefined ? ariaInvalid : true}
        className={[styles.fieldControl, className].filter(Boolean).join(' ')}
        id={inputId}
      />
      {hint === undefined ? null : (
        <span className={styles.fieldHint} id={hintId}>
          {hint}
        </span>
      )}
      {error === undefined ? null : (
        <span className={styles.fieldError} id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
