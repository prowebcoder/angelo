import type { Metadata } from 'next'
import { EventGrid } from '@/components/events/EventCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getEvents, getSiteSettings } from '@/lib/queries'
import { groupEventsByStatus } from '@/lib/events'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: 'Events',
    fallbackDescription: 'Trunk shows, designer weekends and walk-in days at the boutique.',
    path: '/events',
    settings,
  })
}

/**
 * Events listing.
 *
 * Current and upcoming events lead; past ones fall into an archive below.
 * The split is derived from the dates on each event, so nothing has to be
 * moved by hand when a date passes.
 */
const EventsPage = async () => {
  const events = await getEvents()
  const { live, upcoming, past } = groupEventsByStatus(events)
  const current = [...live, ...upcoming]

  return (
    <>
      <Section spacing="tight">
        <div className="shell">
          <Breadcrumbs crumbs={[{ name: 'Events', href: '/events' }]} className="mb-6" />
          <h1 className="text-h1">Events</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {current.length
              ? 'Designer weekends, trunk shows and days you can simply walk in.'
              : 'There is nothing in the diary at the moment. Join the Angelo letter and we will tell you first.'}
          </p>
        </div>
      </Section>

      {current.length ? (
        <Section spacing="tight" className="pb-(--spacing-section)">
          <div className="shell">
            <EventGrid events={current} />
          </div>
        </Section>
      ) : null}

      {past.length ? (
        <Section tone="shell">
          <div className="shell">
            <SectionHeading eyebrow="Archive" title="Past events" className="mb-10" />
            <EventGrid events={past} />
          </div>
        </Section>
      ) : null}
    </>
  )
}

export default EventsPage
