'use client'

import { useState, useTransition } from 'react'
import { submitAlterationsEnquiry } from '@/actions/forms'
import type { FormState } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { FormMessage, SelectField, SpamGuardFields, TextAreaField, TextField, useSpamGuard } from './Fields'

const GOWN_STATUS_OPTIONS = [
  { value: 'Bought at Angelo Bridal', label: 'Bought at Angelo Bridal' },
  { value: 'Bought elsewhere', label: 'Bought elsewhere' },
  { value: 'Still looking', label: 'Still looking for a gown' },
  { value: 'Inherited or vintage', label: 'Inherited or vintage' },
]

/**
 * Alterations enquiry.
 *
 * Photographs are requested by reply rather than uploaded here: accepting
 * public file uploads straight into the media library would need virus
 * scanning and storage limits that are not in place.
 */
export const AlterationsForm = ({ className }: { className?: string }) => {
  const spamGuard = useSpamGuard()
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const [pending, startTransition] = useTransition()

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await submitAlterationsEnquiry({ ...Object.fromEntries(data), renderedAt: spamGuard.current })
      setState(result)
      if (result.status === 'success') {
        requestAnimationFrame(() => document.getElementById('alterations-result')?.focus())
      }
    })
  }

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {}

  if (state.status === 'success') {
    return (
      <div id="alterations-result" tabIndex={-1} className={className}>
        <FormMessage status="success" message={state.message} />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className={`relative space-y-6 ${className ?? ''}`}>
      <SpamGuardFields />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="First name" name="firstName" required autoComplete="given-name" error={errors.firstName} />
        <TextField label="Last name" name="lastName" required autoComplete="family-name" error={errors.lastName} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Email" name="email" type="email" required autoComplete="email" error={errors.email} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Wedding date" name="weddingDate" type="date" error={errors.weddingDate} />
        <TextField
          label="Travel date"
          name="travelDate"
          type="date"
          hint="If you travel before the wedding."
          error={errors.travelDate}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="Where you bought your gown" name="purchaseLocation" error={errors.purchaseLocation} />
        <SelectField
          label="Gown status"
          name="gownStatus"
          placeholder="Please choose"
          options={GOWN_STATUS_OPTIONS}
          error={errors.gownStatus}
        />
      </div>

      <TextAreaField
        label="What would you like done?"
        name="description"
        required
        rows={6}
        hint="Hem length, bodice fit, straps, a train loop — as much detail as you have."
        error={errors.description}
      />

      <p className="text-xs text-ink-muted">
        If photographs would help, reply to our email with them attached and they will reach your fitter.
      </p>

      {state.status === 'error' ? <FormMessage status="error" message={state.message} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send enquiry'}
      </Button>
    </form>
  )
}
