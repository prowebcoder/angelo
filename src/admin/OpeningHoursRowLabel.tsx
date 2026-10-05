'use client'

import { useRowLabel } from '@payloadcms/ui'

type Row = {
  day?: string
  closed?: boolean
  openingTime?: string
  closingTime?: string
  specialNote?: string
}

/**
 * Collapsed label for one day in Site settings → Opening hours.
 *
 * Payload otherwise labels array rows "Day 01", "Day 02", which means an
 * editor has to open every row to find Thursday. This shows the day and what
 * it currently says, so the whole week can be read at a glance and the right
 * row opened first time.
 */
const OpeningHoursRowLabel = () => {
  const { data, rowNumber } = useRowLabel<Row>()

  if (!data?.day) return <span>{`Day ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}</span>

  // Mirrors how the day is written on the site, so what you read here is
  // what a visitor reads there.
  const hours = data.specialNote
    ? data.specialNote
    : data.closed
      ? 'Closed'
      : data.openingTime && data.closingTime
        ? `${data.openingTime}–${data.closingTime}`
        : 'By appointment'

  return (
    <span>
      {data.day}
      <span style={{ opacity: 0.6 }}>{` — ${hours}`}</span>
    </span>
  )
}

export default OpeningHoursRowLabel
