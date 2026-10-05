'use client'

import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/actions/forms'
import type { FormState } from '@/lib/validation'
import { CheckboxField, FormMessage, SpamGuardFields, useSpamGuard } from './Fields'

/**
 * Newsletter sign-up. Used in the footer and as a page-builder block, so it
 * takes a `tone` for the dark footer ground and a `source` for attribution.
 */
export const NewsletterForm = ({
  source,
  consentCopy,
  tone = 'light',
}: {
  source: string
  consentCopy?: string | null
  tone?: 'light' | 'dark'
}) => {
  const spamGuard = useSpamGuard()
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const [pending, startTransition] = useTransition()

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const form = event.currentTarget

    startTransition(async () => {
      const result = await subscribeToNewsletter({
        email: String(formData.get('email') ?? ''),
        consent: formData.get('consent') === 'on',
        source,
        botField: String(formData.get('botField') ?? ''),
        renderedAt: spamGuard.current,
      })
      setState(result)
      if (result.status === 'success') form.reset()
    })
  }

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined

  if (state.status === 'success') {
    return <FormMessage status="success" message={state.message} tone={tone} />
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <SpamGuardFields />

      <div className="flex items-stretch border-b border-current/30">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-invalid={fieldErrors?.email ? true : undefined}
          aria-describedby={fieldErrors?.email ? 'newsletter-email-error' : undefined}
          className={`min-w-0 flex-1 bg-transparent py-3 text-sm focus:outline-none ${
            tone === 'dark' ? 'placeholder:text-on-ink-muted/70' : 'placeholder:text-ink-muted/70'
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 pl-4 text-[0.625rem] font-medium tracking-[0.18em] uppercase disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Join'}
        </button>
      </div>

      {fieldErrors?.email ? (
        <p id="newsletter-email-error" className="mt-2 text-xs text-danger">
          {fieldErrors.email}
        </p>
      ) : null}

      <CheckboxField
        name="consent"
        tone={tone}
        className="mt-4"
        error={fieldErrors?.consent}
        label={consentCopy ?? 'Yes, send me occasional notes on new gowns, trunk shows and appointment openings.'}
      />

      {state.status === 'error' && !fieldErrors ? (
        <div className="mt-4">
          <FormMessage status="error" message={state.message} tone={tone} />
        </div>
      ) : null}
    </form>
  )
}
