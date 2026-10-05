import type { Event } from '@/payload-types'

export type EventStatus = 'upcoming' | 'live' | 'past'

const startOfDay = (value: Date): number =>
  Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())

/**
 * Event status is derived from its dates so past events archive themselves,
 * unless an editor has set an explicit override in the CMS.
 *
 * Comparison is day-granular: an event is still "live" for the whole of its
 * end date rather than expiring at midnight UTC.
 */
export const eventStatus = (event: Event, now: Date = new Date()): EventStatus => {
  if (event.statusOverride && event.statusOverride !== 'automatic') {
    return event.statusOverride
  }

  const today = startOfDay(now)
  const start = event.startDate ? startOfDay(new Date(event.startDate)) : null
  if (start == null || Number.isNaN(start)) return 'upcoming'

  const rawEnd = event.endDate ? startOfDay(new Date(event.endDate)) : null
  const end = rawEnd != null && !Number.isNaN(rawEnd) ? rawEnd : start

  if (today < start) return 'upcoming'
  if (today > end) return 'past'
  return 'live'
}

/** Splits events into the three groups the events page renders. */
export const groupEventsByStatus = (
  events: Event[],
  now: Date = new Date(),
): Record<EventStatus, Event[]> => {
  const groups: Record<EventStatus, Event[]> = { live: [], upcoming: [], past: [] }
  for (const event of events) {
    groups[eventStatus(event, now)].push(event)
  }
  // Past events read best newest-first; forthcoming ones soonest-first.
  groups.past.reverse()
  return groups
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  live: 'Happening now',
  upcoming: 'Upcoming',
  past: 'Past event',
}

export const ATTENDANCE_LABELS: Record<NonNullable<Event['attendanceType']>, string> = {
  appointment: 'By appointment',
  'walk-in': 'Walk-ins welcome',
  RSVP: 'RSVP required',
  'external-registration': 'Register externally',
}

/** Formats the editor-entered time strings into a single readable range. */
export const eventTimeRange = (event: Event): string | null => {
  if (!event.startTime) return null
  return event.endTime ? `${event.startTime} – ${event.endTime}` : event.startTime
}
