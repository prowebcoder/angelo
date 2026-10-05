import type { Metadata } from 'next'
import { SavedListView } from '@/components/dresses/SavedListView'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: 'Your wishlist',
    fallbackDescription: 'The gowns you have saved, and the shortlist for your appointment.',
    path: '/wishlist',
    settings,
    // Personal to the visitor; nothing here belongs in an index.
    noIndex: true,
  })
}

/**
 * Wishlist and try-on list.
 *
 * Both lists live in the visitor's browser, so no sign-in is needed. They are
 * shown together because the useful move is promoting a saved gown onto the
 * try-on list the boutique will prepare.
 */
const WishlistPage = async () => (
  <>
    <Section spacing="tight">
      <div className="shell">
        <Breadcrumbs crumbs={[{ name: 'Wishlist', href: '/wishlist' }]} className="mb-6" />
        <h1 className="text-h1">Your wishlist</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Saved on this device. Add the ones you would most like to try to your try-on list, and we will have them
          ready at your appointment.
        </p>

        <div className="mt-12">
          <SavedListView
            list="wishlist"
            emptyTitle="Nothing saved yet"
            emptyBody="Tap the heart on any gown to keep it here while you decide."
          />
        </div>
      </div>
    </Section>

    <Section tone="shell">
      <div className="shell">
        <SectionHeading
          eyebrow="For your appointment"
          title="Your try-on list"
          description="These gowns are carried into the appointment form when you request a time."
          className="mb-10"
        />
        <SavedListView
          list="tryOn"
          emptyTitle="No gowns on the list"
          emptyBody="Add gowns you would like to try and they will be waiting for you in the fitting room."
        />
      </div>
    </Section>
  </>
)

export default WishlistPage
