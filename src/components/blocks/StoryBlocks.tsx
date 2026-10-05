import Link from 'next/link'
import type { Event, Post, RealBride } from '@/payload-types'
import { ButtonLink } from '@/components/ui/Button'
import { MediaImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { Section, SectionHeading } from '@/components/ui/Section'
import { BrideGrid } from '@/components/brides/BrideCard'
import { EventGrid } from '@/components/events/EventCard'
import { JournalGrid } from '@/components/journal/JournalCard'
import { getEvents, getPosts, getRealBrides } from '@/lib/queries'
import { groupEventsByStatus } from '@/lib/events'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'
import { type BlockOf, toneOf, usableLink } from './types'

/** Chosen brides, or the most recent stories when none are picked. */
export const RealBridesBlock = async ({ block }: { block: BlockOf<'real-brides'> }) => {
  const chosen = (block.brides ?? []).filter((item): item is RealBride => isPopulated<RealBride>(item))
  const brides = chosen.length ? chosen : (await getRealBrides(block.limit ?? 3)).slice(0, block.limit ?? 3)
  if (!brides.length) return null

  const link = usableLink(block.link)

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
          {link ? (
            <ButtonLink href={link.url} variant="ghost" className="shrink-0">
              {link.label}
            </ButtonLink>
          ) : null}
        </div>
        <BrideGrid brides={brides} />
      </div>
    </Section>
  )
}

/**
 * Quotes from brides.
 *
 * Only what an editor has entered is shown; there are no star ratings or
 * aggregate scores, which would be fabricated review data.
 */
export const TestimonialsBlock = ({ block }: { block: BlockOf<'testimonials'> }) => {
  const quotes = block.quotes ?? []
  if (!quotes.length) return null

  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          align="center"
          className="mb-12"
        />

        <ul
          className={`grid gap-10 ${quotes.length === 1 ? 'max-w-3xl mx-auto' : quotes.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}
        >
          {quotes.map((item, index) => (
            <li key={item.id ?? index}>
              <Reveal delay={index * 80}>
                <figure className="flex h-full flex-col gap-5 text-center">
                  <blockquote
                    className={`font-serif text-xl leading-snug italic md:text-2xl ${
                      tone === 'ink' ? 'text-on-ink' : 'text-ink'
                    }`}
                  >
                    {`“${item.quote}”`}
                  </blockquote>
                  {item.attribution || item.detail ? (
                    <figcaption
                      className={`mt-auto text-[0.625rem] font-medium tracking-[0.18em] uppercase ${
                        tone === 'ink' ? 'text-on-ink-muted' : 'text-ink-muted'
                      }`}
                    >
                      {item.attribution}
                      {item.attribution && item.detail ? ' · ' : ''}
                      {item.detail}
                    </figcaption>
                  ) : null}
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

export const AwardsBlock = ({ block }: { block: BlockOf<'awards'> }) => {
  const items = block.items ?? []
  if (!items.length) return null

  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          align="center"
          className="mb-12"
        />

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const content = (
              <>
                {item.logo ? (
                  <MediaImage value={item.logo} alt={item.title} ratio="square" sizes="120px" className="mx-auto w-24" />
                ) : null}
                <p className={`font-serif text-xl leading-snug ${tone === 'ink' ? 'text-on-ink' : 'text-ink'}`}>
                  {item.title}
                </p>
                {item.awardedBy || item.year ? (
                  <p
                    className={`text-[0.625rem] font-medium tracking-[0.18em] uppercase ${
                      tone === 'ink' ? 'text-on-ink-muted' : 'text-ink-muted'
                    }`}
                  >
                    {[item.awardedBy, item.year].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
              </>
            )

            return (
              <li key={item.id ?? index}>
                <Reveal delay={index * 70}>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-3 text-center transition-opacity hover:opacity-75"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">{content}</div>
                  )}
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

export const JournalListBlock = async ({ block }: { block: BlockOf<'journal-list'> }) => {
  const chosen = (block.posts ?? []).filter((item): item is Post => isPopulated<Post>(item))
  const posts = chosen.length ? chosen : await getPosts({ limit: block.limit ?? 3 })
  if (!posts.length) return null

  const link = usableLink(block.link)

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
          {link ? (
            <ButtonLink href={link.url} variant="ghost" className="shrink-0">
              {link.label}
            </ButtonLink>
          ) : null}
        </div>
        <JournalGrid posts={posts.slice(0, block.limit ?? 3)} />
      </div>
    </Section>
  )
}

/** Chosen events, or whatever is current and coming up. */
export const EventListBlock = async ({ block }: { block: BlockOf<'event-list'> }) => {
  const chosen = (block.events ?? []).filter((item): item is Event => isPopulated<Event>(item))
  let events = chosen

  if (!events.length) {
    const grouped = groupEventsByStatus(await getEvents())
    events = [...grouped.live, ...grouped.upcoming].slice(0, block.limit ?? 3)
  }

  if (!events.length) return null

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-10"
        />
        <EventGrid events={events} />
      </div>
    </Section>
  )
}

/**
 * Social wall built from uploaded images.
 *
 * It does not call the Instagram API: there is no connected account or token,
 * and inventing posts would be fabricating content. The shape is ready for a
 * real feed to be dropped in later.
 */
export const InstagramBlock = ({ block }: { block: BlockOf<'instagram-preview'> }) => {
  const posts = block.posts ?? []
  if (!posts.length) return null

  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <SectionHeading
            eyebrow={block.eyebrow}
            title={block.heading}
            description={block.description}
            align="center"
          />
          {block.handle ? (
            block.profileURL ? (
              <a
                href={block.profileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet text-[0.6875rem] tracking-[0.18em] uppercase"
              >
                {block.handle}
              </a>
            ) : (
              <p className="text-[0.6875rem] tracking-[0.18em] uppercase">{block.handle}</p>
            )
          ) : null}
        </div>

        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {posts.map((post, index) => {
            const image = (
              <MediaImage value={post.image} ratio="square" sizes={IMAGE_SIZES.card} hoverZoom />
            )
            return (
              <li key={post.id ?? index} className="group">
                {post.url ? (
                  <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                    {image}
                    <span className="sr-only">View this post</span>
                  </a>
                ) : (
                  image
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

/** Shared "see all" row used by listing sections. */
export const SectionLink = ({ href, label }: { href: string; label: string }) => (
  <div className="mt-12 text-center">
    <Link href={href} className="link-quiet text-[0.6875rem] tracking-[0.18em] uppercase">
      {label}
    </Link>
  </div>
)
