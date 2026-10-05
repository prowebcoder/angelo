'use client'

import { useState, useTransition } from 'react'
import { submitContact } from '@/actions/forms'
import type { FormState } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { FormMessage, SpamGuardFields, TextAreaField, TextField, useSpamGuard } from './Fields'

export const ContactForm = ({ className }: { className?: string }) => {
  const spamGuard = useSpamGuard()
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const [pending, startTransition] = useTransition()

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await submitContact({ ...Object.fromEntries(data), renderedAt: spamGuard.current })
      setState(result)
      if (result.status === 'success') {
        // Move focus to the confirmation so it is announced and reachable.
        requestAnimationFrame(() => document.getElementById('contact-result')?.focus())
      }
    })
  }

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {}

  if (state.status === 'success') {
    return (
      <div id="contact-result" tabIndex={-1} className={className}>
        <FormMessage status="success" message={state.message} />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className={`relative space-y-6 ${className ?? ''}`}>
      <SpamGuardFields />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Your name" name="name" required autoComplete="name" error={errors.name} />
        <TextField label="Email" name="email" type="email" required autoComplete="email" error={errors.email} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
        <TextField label="Subject" name="subject" error={errors.subject} />
      </div>

      <TextAreaField label="Message" name="message" required rows={6} error={errors.message} />

      {state.status === 'error' ? <FormMessage status="error" message={state.message} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  )
}
