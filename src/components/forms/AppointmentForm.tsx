'use client'

import { X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { submitAppointment } from '@/actions/forms'
import type { FormState } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { useSavedLists } from '@/components/dresses/SavedListsProvider'
import { CheckboxField, FormMessage, SelectField, SpamGuardFields, TextAreaField, TextField, useSpamGuard } from './Fields'

export type AppointmentType = { label: string; description?: string | null }

/** Extra fields an administrator has added in Form settings. */
export type ConfigurableField = {
  label: string
  name: string
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'checkbox'
  required?: boolean | null
  options?: { label: string }[] | null
}

type TryOnDress = { id: number; name: string; designer?: string | null }

type Props = {
  appointmentTypes: AppointmentType[]
  extraFields?: ConfigurableField[]
  consentCopy?: string | null
  /** Resolved names for whatever is on the visitor's try-on list. */
  tryOnDresses: TryOnDress[]
  className?: string
}

/**
 * Appointment request.
 *
 * Appointment types and any extra questions come from Form settings, so staff
 * can change what they ask without a release. The gowns on the visitor's
 * try-on list are carried over and can be removed before sending.
 */
export const AppointmentForm = ({
  appointmentTypes,
  extraFields = [],
  consentCopy,
  tryOnDresses,
  className,
}: Props) => {
  const spamGuard = useSpamGuard()
  const { tryOn, remove } = useSavedLists()
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const [pending, startTransition] = useTransition()

  /**
   * The visible shortlist is derived, not stored: the stored list is the IDs
   * in `tryOn`, and `tryOnDresses` is their resolved detail. Removing a gown
   * updates the stored list and this recomputes, so the two can never
   * disagree.
   */
  const byId = new Map(tryOnDresses.map((dress) => [dress.id, dress]))
  const selected = tryOn
    .map((id) => byId.get(id))
    .filter((dress): dress is TryOnDress => Boolean(dress))

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await submitAppointment({
        ...Object.fromEntries(data),
        marketingConsent: data.get('marketingConsent') === 'on',
        renderedAt: spamGuard.current,
        selectedDresses: selected.map((dress) => dress.id),
      })
      setState(result)
      if (result.status === 'success') {
        requestAnimationFrame(() => document.getElementById('appointment-result')?.focus())
      }
    })
  }

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {}
  const typeOptions = appointmentTypes.map((type) => ({ value: type.label, label: type.label }))

  if (state.status === 'success') {
    return (
      <div id="appointment-result" tabIndex={-1} className={className}>
        <FormMessage status="success" message={state.message} />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className={`relative space-y-8 ${className ?? ''}`}>
      <SpamGuardFields />

      <fieldset className="space-y-6 border-0 p-0">
        <legend className="mb-2 font-serif text-xl">About you</legend>

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
          <TextField label="Venue" name="venue" error={errors.venue} />
        </div>
      </fieldset>

      <fieldset className="space-y-6 border-0 p-0">
        <legend className="mb-2 font-serif text-xl">Your appointment</legend>

        {typeOptions.length ? (
          <SelectField
            label="Appointment type"
            name="appointmentType"
            required
            placeholder="Please choose"
            options={typeOptions}
            hint={appointmentTypes.find((type) => type.description)?.description ?? undefined}
            error={errors.appointmentType}
          />
        ) : (
          <TextField
            label="Appointment type"
            name="appointmentType"
            required
            hint="Tell us what kind of appointment you would like."
            error={errors.appointmentType}
          />
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="Preferred date" name="preferredDate" type="date" error={errors.preferredDate} />
          <TextField
            label="Preferred time"
            name="preferredTime"
            placeholder="Morning, afternoon, or a time"
            error={errors.preferredTime}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="Your usual dress size" name="size" error={errors.size} />
          <TextField label="Designers you love" name="designerPreferences" error={errors.designerPreferences} />
        </div>

        <TextAreaField
          label="What are you hoping to find?"
          name="dressPreferences"
          rows={4}
          hint="Silhouettes, fabrics, anything you already know you like."
          error={errors.dressPreferences}
        />
      </fieldset>

      {selected.length ? (
        <fieldset className="border-0 p-0">
          <legend className="mb-3 font-serif text-xl">Your try-on list</legend>
          <p className="mb-4 text-sm text-ink-soft">
            These gowns will be ready for you. Remove any you have changed your mind about.
          </p>
          <ul className="divide-y divide-line border-t border-b border-line">
            {selected.map((dress) => (
              <li key={dress.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm">
                  <span className="font-serif text-lg">{dress.name}</span>
                  {dress.designer ? <span className="ml-2 text-ink-muted">{dress.designer}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => remove('tryOn', dress.id)}
                  className="p-1.5 text-ink-muted transition-colors hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
                  <span className="sr-only">{`Remove ${dress.name} from the try-on list`}</span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {extraFields.length ? (
        <fieldset className="space-y-6 border-0 p-0">
          <legend className="mb-2 font-serif text-xl">A little more</legend>
          {extraFields.map((field) => {
            const error = errors[field.name]
            const common = { label: field.label, name: field.name, required: Boolean(field.required), error }

            if (field.type === 'textarea') return <TextAreaField key={field.name} {...common} rows={4} />
            if (field.type === 'checkbox') return <CheckboxField key={field.name} name={field.name} label={field.label} error={error} />
            if (field.type === 'select') {
              return (
                <SelectField
                  key={field.name}
                  {...common}
                  placeholder="Please choose"
                  options={(field.options ?? []).map((option) => ({ value: option.label, label: option.label }))}
                />
              )
            }
            return <TextField key={field.name} {...common} type={field.type} />
          })}
        </fieldset>
      ) : null}

      <TextAreaField label="Anything else?" name="message" rows={4} error={errors.message} />

      <CheckboxField
        name="marketingConsent"
        label={consentCopy ?? 'Keep me posted on new gowns, trunk shows and appointment openings.'}
        error={errors.marketingConsent}
      />

      {state.status === 'error' ? <FormMessage status="error" message={state.message} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Request appointment'}
      </Button>
    </form>
  )
}
