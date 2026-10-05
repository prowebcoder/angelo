import Link from 'next/link'
import type { ServerProps } from 'payload'

/**
 * Boutique dashboard, shown above Payload's own collection list.
 *
 * Written for a non-technical user: what needs attention first, then the
 * things they edit most, in the same order and under the same names as the
 * menu on the left — so the dashboard teaches the menu rather than competing
 * with it. Counts are read with the user's own permissions, so an Editor
 * never sees enquiry figures they cannot open.
 *
 * Styling lives in `src/app/(payload)/custom.css` under `.angelo-dash__*`,
 * alongside the rest of the admin theme, so this follows the palette into
 * dark mode without carrying a second copy of it.
 */

type Card = { label: string; href: string; count?: number; hint?: string }

const CountCard = ({ card }: { card: Card }) => (
  <Link href={card.href} className="angelo-dash__card">
    <span className="angelo-dash__card-label">{card.label}</span>
    {card.count != null ? <strong className="angelo-dash__card-count">{card.count}</strong> : null}
    {card.hint ? <span className="angelo-dash__card-hint">{card.hint}</span> : null}
  </Link>
)

const Section = ({ heading, cards }: { heading: string; cards: Card[] }) =>
  cards.length ? (
    <section className="angelo-dash__section">
      <h2 className="angelo-dash__heading">{heading}</h2>
      <div className="angelo-dash__grid">
        {cards.map((card) => (
          <CountCard key={card.href} card={card} />
        ))}
      </div>
    </section>
  ) : null

const Dashboard = async ({ payload, user }: ServerProps) => {
  /**
   * Counts run with the signed-in user's own access.
   *
   * `overrideAccess: false` means a Staff member sees the enquiry figures
   * they can act on, while an Editor simply does not get those cards. A
   * refused count returns `undefined` and the card is dropped, so a
   * permissions boundary never shows as an error.
   */
  const countFor = async (
    collection: Parameters<typeof payload.count>[0]['collection'],
    where?: Parameters<typeof payload.count>[0]['where'],
  ) => {
    try {
      const result = await payload.count({ collection, where, user, overrideAccess: false })
      return result.totalDocs
    } catch {
      return undefined
    }
  }

  const newOnly = { status: { equals: 'new' } }
  const draftOnly = { _status: { equals: 'draft' } }

  const [
    appointments,
    alterations,
    contacts,
    subscribers,
    draftPages,
    draftDresses,
    draftPosts,
    dresses,
    designers,
    accessories,
    brides,
    posts,
    events,
  ] = await Promise.all([
    countFor('appointments', newOnly),
    countFor('alteration-enquiries', newOnly),
    countFor('contact-submissions', newOnly),
    countFor('newsletter-subscribers', { status: { equals: 'subscribed' } }),
    countFor('pages', draftOnly),
    countFor('dresses', draftOnly),
    countFor('posts', draftOnly),
    countFor('dresses'),
    countFor('designers'),
    countFor('accessories'),
    countFor('real-brides'),
    countFor('posts'),
    countFor('events'),
  ])

  /**
   * Only counts that mean "someone should do something" appear here, and only
   * when they are above zero — a wall of zeros trains people to ignore the
   * row that matters.
   */
  const waiting: Card[] = [
    {
      label: 'New appointment requests',
      href: '/admin/collections/appointments?where[status][equals]=new',
      count: appointments,
    },
    {
      label: 'New alterations enquiries',
      href: '/admin/collections/alteration-enquiries?where[status][equals]=new',
      count: alterations,
    },
    {
      label: 'New messages',
      href: '/admin/collections/contact-submissions?where[status][equals]=new',
      count: contacts,
    },
    { label: 'Pages not yet published', href: '/admin/collections/pages?where[_status][equals]=draft', count: draftPages },
    {
      label: 'Gowns not yet published',
      href: '/admin/collections/dresses?where[_status][equals]=draft',
      count: draftDresses,
    },
    {
      label: 'Journal articles not yet published',
      href: '/admin/collections/posts?where[_status][equals]=draft',
      count: draftPosts,
    },
  ].filter((card) => (card.count ?? 0) > 0)

  const website: Card[] = [
    { label: 'Homepage', href: '/admin/globals/homepage', hint: 'The opening section and every section below it' },
    { label: 'Pages', href: '/admin/collections/pages', hint: 'About, alterations, contact and any page you add' },
    { label: 'Navigation', href: '/admin/globals/navigation', hint: 'The menu either side of the logo' },
    { label: 'Footer', href: '/admin/globals/footer', hint: 'The links and wording at the bottom of every page' },
  ]

  const catalogue: Card[] = [
    { label: 'Gowns', href: '/admin/collections/dresses', count: dresses },
    { label: 'Designers', href: '/admin/collections/designers', count: designers },
    { label: 'Accessories', href: '/admin/collections/accessories', count: accessories },
    { label: 'Filter terms', href: '/admin/collections/taxonomies', hint: 'Silhouettes, fabrics and categories' },
  ].filter((card) => card.count != null || card.hint)

  const stories: Card[] = [
    { label: 'Real brides', href: '/admin/collections/real-brides', count: brides },
    { label: 'Journal', href: '/admin/collections/posts', count: posts },
    { label: 'Events', href: '/admin/collections/events', count: events },
    { label: 'Questions and answers', href: '/admin/collections/faqs', hint: 'Shown on the questions page' },
  ].filter((card) => card.count != null || card.hint)

  const everythingElse: Card[] = [
    { label: 'Photographs', href: '/admin/collections/media', hint: 'Every image used across the site' },
    { label: 'Site settings', href: '/admin/globals/site-settings', hint: 'Address, opening hours, social links' },
    { label: 'Newsletter signups', href: '/admin/collections/newsletter-subscribers', count: subscribers },
  ].filter((card) => card.count != null || card.hint)

  return (
    <div className="angelo-dash">
      <h1>{user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Angelo Bridal'}</h1>
      <p className="angelo-dash__intro">
        Everything on the website is managed from here. Work from the menu on the left, or start with a shortcut
        below. Changes appear on the site within a minute of publishing.
      </p>

      {waiting.length ? (
        <Section heading="Waiting for you" cards={waiting} />
      ) : (
        <p className="angelo-dash__clear">
          Nothing is waiting — every enquiry has been picked up and nothing is sitting unpublished.
        </p>
      )}

      <Section heading="The website" cards={website} />
      <Section heading="Gowns &amp; designers" cards={catalogue} />
      <Section heading="Stories &amp; journal" cards={stories} />
      <Section heading="Everything else" cards={everythingElse} />
    </div>
  )
}

export default Dashboard
