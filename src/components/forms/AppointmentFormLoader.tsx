'use client'

import { useEffect, useState } from 'react'
import { getDressSummaries, type DressSummary } from '@/actions/dresses'
import { useSavedLists } from '@/components/dresses/SavedListsProvider'
import { AppointmentForm, type AppointmentType, type ConfigurableField } from './AppointmentForm'

type Props = {
  appointmentTypes: AppointmentType[]
  extraFields?: ConfigurableField[]
  consentCopy?: string | null
  className?: string
}

/**
 * Bridges the browser-held try-on list and the server.
 *
 * The list is only IDs in localStorage, so the gown names have to be fetched
 * once on mount. The form renders immediately and the list fills in — nothing
 * blocks on it.
 */
export const AppointmentFormLoader = ({ appointmentTypes, extraFields, consentCopy, className }: Props) => {
  const { tryOn, ready } = useSavedLists()
  const [fetched, setFetched] = useState<DressSummary[]>([])

  // An empty stored list needs no lookup, so it is derived rather than written
  // back into state.
  const dresses = tryOn.length ? fetched : []

  useEffect(() => {
    if (!ready || !tryOn.length) return

    let active = true
    getDressSummaries(tryOn)
      .then((result) => {
        if (active) setFetched(result)
      })
      .catch(() => {
        // A failed lookup only costs the convenience of pre-filled names; the
        // visitor can still describe the gowns in the message field.
      })

    return () => {
      active = false
    }
  }, [ready, tryOn])

  return (
    <AppointmentForm
      appointmentTypes={appointmentTypes}
      extraFields={extraFields}
      consentCopy={consentCopy}
      tryOnDresses={dresses}
      className={className}
    />
  )
}
