import Link from 'next/link'
import type { Event, Taxonomy } from '@/payload-types'
import { MediaImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { formatDateRange, truncate } from '@/lib/format'
import { ATTENDANCE_LABELS, eventStatus, eventTimeRange, EVENT_STATUS_LABELS } from '@/lib/events'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'

export const EventCard = ({
  event,
  priority = false,
  sizes = IMAGE_SIZES.tile,
}: {
  event: Event
  priority?: boolean
  sizes?: string
}) => {
  const status = eventStatus(event)
  const dates = formatDateRange(event.startDate, event.endDate)
  const times = eventTimeRange(event)
  const type = isPopulated<Taxonomy>(event.eventType) ? event.eventType.name : null

  return (
    <article className={`group relative flex flex-col ${status === 'past' ? 'opacity-80' : ''}`}>
      <Link href={`/events/${event.slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <MediaImage
          value={event.heroImage}
          alt={event.title}
          ratio="landscape"
          sizes={sizes}
          priority={priority}
          hoverZoom
        />
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        <p className="flex flex-wrap items-center gap-x-3 text-[0.625rem] font-medium tracking-[0.18em] uppercase">
          <span className={status === 'live' ? 'text-taupe' : 'text-ink-muted'}>
            {EVENT_STATUS_LABELS[status]}
          </span>
          {type ? <span className="text-ink-muted">{type}</span> : null}
        </p>

        <h3 className="mt-2 font-serif text-[1.5rem] leading-snug">
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {event.title}
          </Link>
        </h3>

        <dl className="mt-3 space-y-1 text-sm text-ink-soft">
          {dates ? (
            <div className="flex gap-2">
              <dt className="sr-only">Date</dt>
              <dd>
                <time dateTime={event.startDate}>{dates}</time>
                {times ? <span className="text-ink-muted">{` · ${times}`}</span> : null}
              </dd>
            </div>
          ) : null}
          {event.location ? (
            <div className="flex gap-2">
              <dt className="sr-only">Location</dt>
              <dd>{event.location}</dd>
            </div>
          ) : null}
          {event.attendanceType ? (
            <div className="flex gap-2">
              <dt className="sr-only">Attendance</dt>
              <dd className="text-ink-muted">{ATTENDANCE_LABELS[event.attendanceType]}</dd>
            </div>
          ) : null}
        </dl>

        {event.shortDescription ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{truncate(event.shortDescription, 150)}</p>
        ) : null}
      </div>
    </article>
  )
}

export const EventGrid = ({
  events,
  emptyMessage = 'No events are listed at the moment.',
}: {
  events: Event[]
  emptyMessage?: string
}) => {
  if (!events.length) {
    return <p className="py-12 text-ink-muted">{emptyMessage}</p>
  }

  return (
    <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event, index) => (
        <li key={event.id}>
          <Reveal delay={Math.min(index, 5) * 70}>
            <EventCard event={event} priority={index < 3} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
