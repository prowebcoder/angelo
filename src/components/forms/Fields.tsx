'use client'

import { useEffect, useId, useRef, type ReactNode, type ComponentPropsWithoutRef } from 'react'

type Tone = 'light' | 'dark'

const fieldClasses = (tone: Tone, invalid: boolean) =>
  [
    'w-full border bg-transparent px-4 py-3.5 text-[0.9375rem] transition-colors',
    'placeholder:text-ink-muted/60 focus:outline-none',
    tone === 'dark'
      ? 'border-white/25 text-on-ink placeholder:text-on-ink-muted/60 focus:border-white/60'
      : 'border-line-strong text-ink focus:border-ink',
    invalid ? 'border-danger' : '',
  ]
    .filter(Boolean)
    .join(' ')

type BaseProps = {
  label: string
  error?: string
  hint?: string
  tone?: Tone
  required?: boolean
  className?: string
}

/** Label, control, hint and error wired together with the right ARIA. */
const Field = ({
  label,
  error,
  hint,
  required,
  className,
  tone = 'light',
  children,
  id,
}: BaseProps & { children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode; id: string }) => {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`mb-2 block text-[0.625rem] font-medium tracking-[0.18em] uppercase ${
          tone === 'dark' ? 'text-on-ink-muted' : 'text-ink-muted'
        }`}
      >
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-taupe">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className={`mt-1.5 text-xs ${tone === 'dark' ? 'text-on-ink-muted' : 'text-ink-muted'}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = BaseProps & Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'id'>

export const TextField = ({ label, error, hint, tone = 'light', required, className, ...rest }: TextFieldProps) => {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required} className={className}>
      {({ describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={fieldClasses(tone, invalid)}
          {...rest}
        />
      )}
    </Field>
  )
}

type TextAreaProps = BaseProps & Omit<ComponentPropsWithoutRef<'textarea'>, 'className' | 'id'>

export const TextAreaField = ({
  label,
  error,
  hint,
  tone = 'light',
  required,
  className,
  rows = 5,
  ...rest
}: TextAreaProps) => {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required} className={className}>
      {({ describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={`${fieldClasses(tone, invalid)} resize-y`}
          {...rest}
        />
      )}
    </Field>
  )
}

type SelectProps = BaseProps & {
  options: { value: string; label: string }[]
  placeholder?: string
} & Omit<ComponentPropsWithoutRef<'select'>, 'className' | 'id' | 'children'>

export const SelectField = ({
  label,
  error,
  hint,
  tone = 'light',
  required,
  className,
  options,
  placeholder,
  ...rest
}: SelectProps) => {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required} className={className}>
      {({ describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={`${fieldClasses(tone, invalid)} appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%237c7064' stroke-width='1'/%3E%3C/svg%3E\")",
          }}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

type CheckboxProps = {
  label: ReactNode
  error?: string
  tone?: Tone
  className?: string
} & Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'id' | 'type'>

export const CheckboxField = ({ label, error, tone = 'light', className, ...rest }: CheckboxProps) => {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={`mt-0.5 h-4 w-4 shrink-0 appearance-none border transition-colors checked:bg-ink ${
            tone === 'dark' ? 'border-white/40 checked:bg-paper' : 'border-line-strong'
          } ${error ? 'border-danger' : ''}`}
          style={{
            backgroundImage: 'none',
          }}
          {...rest}
        />
        <label
          htmlFor={id}
          className={`text-sm leading-relaxed ${tone === 'dark' ? 'text-on-ink/85' : 'text-ink-soft'}`}
        >
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Records when the form became interactive.
 *
 * Read in the submit handler and sent with the submission: anything filled in
 * faster than a human could type is treated as a bot. The timestamp is taken
 * in an effect rather than during render, so rendering stays pure and the
 * value reflects the real mount on the client.
 */
export const useSpamGuard = () => {
  const mountedAt = useRef(0)

  useEffect(() => {
    mountedAt.current = Date.now()
  }, [])

  return mountedAt
}

/**
 * Hidden honeypot field.
 *
 * Positioned off-screen rather than `display:none`, since some bots skip
 * hidden inputs; `tabIndex={-1}` and `aria-hidden` keep it away from real
 * users and assistive tech.
 */
export const SpamGuardFields = () => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
    <label htmlFor="bot-field">Leave this field empty</label>
    <input id="bot-field" name="botField" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
  </div>
)

/** Success and error banners share one presentation. */
export const FormMessage = ({
  status,
  message,
  tone = 'light',
}: {
  status: 'success' | 'error'
  message: string
  tone?: Tone
}) => (
  <p
    role="status"
    aria-live="polite"
    className={`border px-4 py-3 text-sm ${
      status === 'success'
        ? 'border-success/40 bg-success/5 text-success'
        : 'border-danger/40 bg-danger/5 text-danger'
    } ${tone === 'dark' ? 'bg-white/5' : ''}`}
  >
    {message}
  </p>
)
