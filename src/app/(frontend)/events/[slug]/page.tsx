import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Media, Taxonomy } from '@/payload-types'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { JsonLd } from '@/components/ui/JsonLd'
import { MediaImage, ResponsiveHeroImage } from '@/components/ui/Media'
import { RichText } from '@/components/ui/RichText'
import { Section } from '@/components/ui/Section'
import { getEventBySlug, getEventSlugs, getSiteSettings } from '@/lib/queries'
import { ATTENDANCE_LABELS, eventStatus, eventTimeRange, EVENT_STATUS_LABELS } from '@/lib/events'
import { formatDateRange } from '@/lib/format'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'
import { absoluteImage, buildMetadata, eventSchema } from '@/lib/seo'

export const revalidate = 3600

export const generateStaticParams = async () => {
  const slugs = await getEventSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const [event, settings] = await Promise.all([getEventBySlug(slug), getSiteSettings()])
  if (!event) return {}

  return buildMetadata({
    seo: event.seo,
    fallbackTitle: event.title,
    fallbackDescription: event.shortDescription,
    fallbackImage: event.heroImage,
    path: `/events/${slug}`,
    settings,
  })
}

const EventPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) notFound()

  const status = eventStatus(event)
  const dates = formatDateRange(event.startDate, event.endDate)
  const times = eventTimeRange(event)
  const type = isPopulated<Taxonomy>(event.eventType) ? event.eventType.name : null
  const gallery = (event.gallery ?? []).filter((item): item is Media => isPopulated<Media>(item))
  const isPast = status === 'past'

  return (
    <>
      {event.heroImage ? (
        <section className="relative flex h-[42svh] items-end overflow-hidden bg-ink md:h-[55svh]">
          <ResponsiveHeroImage desktop={event.heroImage} alt={event.title} priority />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
          <div className="relative z-10 shell pb-10 md:pb-14">
            <p className="text-[0.6875rem] font-medium tracking-[0.22em] text-on-ink/80 uppercase">
              {[EVENT_STATUS_LABELS[status], type].filter(Boolean).join(' · ')}
            </p>
            <h1 className="mt-3 text-h1 text-on-ink">{event.title}</h1>
          </div>
        </section>
      ) : null}

      <div className="shell pt-8">
        <Breadcrumbs
          crumbs={[
            { name: 'Events', href: '/events' },
            { name: event.title, href: `/events/${slug}` },
          ]}
        />
      </div>

      <Section spacing="tight">
        <div className="shell">
          {!event.heroImage ? (
            <>
              <p className="eyebrow">{[EVENT_STATUS_LABELS[status], type].filter(Boolean).join(' · ')}</p>
              <h1 className="mt-3 text-h1">{event.title}</h1>
            </>
          ) : null}

          <div className="mt-6 grid gap-10 md:grid-cols-[2fr_1fr] md:gap-16">
            <div>
              {event.shortDescription ? (
                <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">{event.shortDescription}</p>
              ) : null}
              {event.description ? (
                <div className="mt-8">
                  <RichText data={event.description} />
                </div>
              ) : null}
            </div>

            <aside className="md:pt-1">
              <dl className="space-y-5 border-t border-line pt-5 text-sm">
                {dates ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">When</dt>
                    <dd className="mt-1 text-ink-soft">
                      <time dateTime={event.startDate}>{dates}</time>
                      {times ? <span className="block text-ink-muted">{times}</span> : null}
                      {event.recurring ? <span className="block text-ink-muted">Repeats</span> : null}
                    </dd>
                  </div>
                ) : null}

                {event.location || event.address ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">Where</dt>
                    <dd className="mt-1 text-ink-soft">
                      {event.location ? <span className="block">{event.location}</span> : null}
                      {event.address ? <span className="block whitespace-pre-line">{event.address}</span> : null}
                    </dd>
                  </div>
                ) : null}

                {event.attendanceType ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
                      How to attend
                    </dt>
                    <dd className="mt-1 text-ink-soft">{ATTENDANCE_LABELS[event.attendanceType]}</dd>
                  </div>
                ) : null}
              </dl>

              {/* A past event keeps its page for the record, but not its CTA. */}
              {isPast ? (
                <p className="mt-8 border border-line px-4 py-3 text-sm text-ink-muted">
                  This event has finished. See what is coming up next.
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3">
                {isPast ? (
                  <ButtonLink href="/events" variant="secondary">
                    Upcoming events
                  </ButtonLink>
                ) : (
                  <>
                    {event.rsvpURL ? <ButtonLink href={event.rsvpURL}>RSVP</ButtonLink> : null}
                    <ButtonLink
                      href={event.appointmentURL || '/your-appointment'}
                      variant={event.rsvpURL ? 'secondary' : 'primary'}
                    >
                      Book an appointment
                    </ButtonLink>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </Section>

      {gallery.length ? (
        <Section tone="shell">
          <div className="shell">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {gallery.map((image) => (
                <li key={image.id}>
                  <MediaImage value={image} ratio="square" sizes={IMAGE_SIZES.card} />
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}

      <JsonLd
        data={eventSchema({
          name: event.title,
          description: event.shortDescription,
          image: absoluteImage(event.heroImage),
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          address: event.address,
          url: `/events/${slug}`,
        })}
      />
    </>
  )
}

export default EventPage
