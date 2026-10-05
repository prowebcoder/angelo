import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { HeroBlock } from '@/components/blocks/EditorialBlocks'
import { ButtonLink } from '@/components/ui/Button'
import { RichText } from '@/components/ui/RichText'
import { MediaImage } from '@/components/ui/Media'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getPayloadClient } from '@/lib/payload'
import {
  findDraftDesigner,
  findDraftDress,
  findDraftEvent,
  findDraftPage,
  findDraftPost,
  findDraftRealBride,
  isPreviewCollection,
  PREVIEW_PATHS,
  type PreviewCollection,
} from '@/lib/preview'
import { availabilityLabel, designerOf, dressDetailGroups, formatDate, formatDateRange, formatPrice } from '@/lib/format'
import { IMAGE_SIZES } from '@/lib/media'
import { eventTimeRange } from '@/lib/events'

/**
 * Draft preview.
 *
 * Explicitly dynamic, and the only route that reads request state. Public
 * pages stay static because of that separation — see `src/lib/preview.ts`.
 *
 * Access is gated on a real Payload session rather than a shareable cookie:
 * forwarding this URL to someone who is not signed in to the admin shows them
 * nothing. Editors with Editor or Super Admin rights can preview; Staff, who
 * only handle submissions, cannot.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Draft preview',
  // A preview URL must never reach an index, even if it is shared.
  robots: { index: false, follow: false },
}

const EDITOR_ROLES = new Set(['super-admin', 'editor'])

const requireEditor = async () => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  const role = user && typeof user === 'object' && 'role' in user ? (user.role as string) : undefined
  return Boolean(user && role && EDITOR_ROLES.has(role))
}

const NotSignedIn = () => (
  <Section>
    <div className="shell-narrow text-center">
      <SectionHeading
        eyebrow="Preview"
        title="Sign in to view this draft"
        description="Draft previews are only visible to signed-in editors, so this link cannot be shared with anyone outside the boutique."
        align="center"
      />
      <div className="mt-8">
        <ButtonLink href="/admin">Open the admin</ButtonLink>
      </div>
    </div>
  </Section>
)

/** Banner shown above every preview, with the publication state. */
const PreviewBar = ({
  label,
  status,
  livePath,
}: {
  label: string
  status: string | null | undefined
  livePath: string | null
}) => (
  <div className="sticky top-0 z-50 bg-taupe px-4 py-2.5 text-white">
    <div className="shell flex flex-wrap items-center justify-between gap-3">
      <p className="text-[0.625rem] tracking-[0.18em] uppercase">
        {`Preview · ${label} · ${status === 'published' ? 'published' : 'draft'}`}
      </p>
      <span className="flex gap-4 text-[0.625rem] tracking-[0.18em] uppercase">
        {status === 'published' && livePath ? (
          <Link href={livePath} className="underline underline-offset-4">
            View live page
          </Link>
        ) : null}
        <Link href="/admin" className="underline underline-offset-4">
          Back to admin
        </Link>
      </span>
    </div>
  </div>
)

const PreviewPage = async ({ params }: { params: Promise<{ collection: string; slug: string }> }) => {
  const { collection, slug } = await params

  if (!isPreviewCollection(collection)) notFound()
  if (!(await requireEditor())) return <NotSignedIn />

  const kind = collection as PreviewCollection
  const livePath = `${PREVIEW_PATHS[kind]}/${slug}`.replace('//', '/')

  /* ---------------------------------------------------------------- */
  /* Pages — rendered with the real page builder                      */
  /* ---------------------------------------------------------------- */
  if (kind === 'pages') {
    const page = await findDraftPage(slug)
    if (!page) notFound()
    const hero = page.hero
    const hasHero = Boolean(hero?.heading || hero?.image || hero?.videoURL)

    return (
      <>
        <PreviewBar label={page.title} status={page._status} livePath={livePath} />
        {hasHero && hero ? <HeroBlock data={hero} priority /> : null}
        {!hasHero ? (
          <Section spacing="tight">
            <div className="shell">
              <h1 className="text-h1">{page.title}</h1>
              {hero?.description ? (
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{hero.description}</p>
              ) : null}
            </div>
          </Section>
        ) : null}
        <RenderBlocks blocks={page.sections} basePath="/dresses" />
      </>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Gowns                                                            */
  /* ---------------------------------------------------------------- */
  if (kind === 'dresses') {
    const dress = await findDraftDress(slug)
    if (!dress) notFound()
    const designer = designerOf(dress)
    const price = formatPrice(dress.price, dress.currency ?? 'EUR')

    return (
      <>
        <PreviewBar label={dress.name} status={dress._status} livePath={livePath} />
        <Section spacing="tight">
          <div className="shell grid gap-10 lg:grid-cols-2 lg:gap-16">
            <MediaImage value={dress.primaryImage} alt={dress.name} ratio="portrait" sizes={IMAGE_SIZES.half} priority />
            <div>
              {designer ? <p className="eyebrow">{designer.name}</p> : null}
              <h1 className="mt-3 text-h2">{dress.name}</h1>
              {dress.styleCode ? <p className="mt-2 text-sm text-ink-muted">{`Style ${dress.styleCode}`}</p> : null}
              {price ? <p className="mt-5 text-xl">{price}</p> : null}
              {dress.description ? (
                <p className="mt-6 leading-relaxed text-ink-soft">{dress.description}</p>
              ) : null}
              <dl className="mt-8 divide-y divide-line border-t border-b border-line text-sm">
                <div className="flex gap-6 py-3">
                  <dt className="w-32 shrink-0 text-ink-muted">Availability</dt>
                  <dd className="text-ink-soft">{availabilityLabel(dress)}</dd>
                </div>
                {dressDetailGroups(dress).map((group) => (
                  <div key={group.label} className="flex gap-6 py-3">
                    <dt className="w-32 shrink-0 text-ink-muted">{group.label}</dt>
                    <dd className="text-ink-soft">{group.values.join(', ')}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Section>
        {dress.designStory ? (
          <Section tone="shell">
            <div className="shell-narrow">
              <SectionHeading eyebrow="The gown" title="Its story" className="mb-8" />
              <RichText data={dress.designStory} />
            </div>
          </Section>
        ) : null}
      </>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Designers                                                        */
  /* ---------------------------------------------------------------- */
  if (kind === 'designers') {
    const designer = await findDraftDesigner(slug)
    if (!designer) notFound()

    return (
      <>
        <PreviewBar label={designer.name} status={designer._status} livePath={livePath} />
        <Section spacing="tight">
          <div className="shell">
            <p className="eyebrow">Designer</p>
            <h1 className="mt-3 text-h1">{designer.name}</h1>
            {designer.description ? (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{designer.description}</p>
            ) : null}
            {designer.longDescription ? (
              <div className="mt-8 max-w-2xl">
                <RichText data={designer.longDescription} />
              </div>
            ) : null}
          </div>
        </Section>
      </>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Journal                                                          */
  /* ---------------------------------------------------------------- */
  if (kind === 'posts') {
    const post = await findDraftPost(slug)
    if (!post) notFound()

    return (
      <>
        <PreviewBar label={post.title} status={post._status} livePath={livePath} />
        <Section spacing="tight">
          <div className="shell-narrow">
            <h1 className="text-h2">{post.title}</h1>
            <p className="mt-4 text-sm text-ink-muted">
              {[post.author, formatDate(post.publishedAt ?? post.createdAt)].filter(Boolean).join(' · ')}
            </p>
            {post.excerpt ? (
              <p className="mt-6 font-serif text-xl leading-relaxed text-ink-soft">{post.excerpt}</p>
            ) : null}
          </div>
        </Section>
        <div className="shell">
          <MediaImage value={post.featuredImage} alt={post.title} ratio="landscape" sizes={IMAGE_SIZES.full} priority />
        </div>
        <Section spacing="tight">
          <div className="shell-narrow">
            <RichText data={post.content} />
          </div>
        </Section>
      </>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Events                                                           */
  /* ---------------------------------------------------------------- */
  if (kind === 'events') {
    const event = await findDraftEvent(slug)
    if (!event) notFound()
    const dates = formatDateRange(event.startDate, event.endDate)
    const times = eventTimeRange(event)

    return (
      <>
        <PreviewBar label={event.title} status={event._status} livePath={livePath} />
        <Section spacing="tight">
          <div className="shell">
            <p className="eyebrow">Event</p>
            <h1 className="mt-3 text-h1">{event.title}</h1>
            <p className="mt-4 text-ink-soft">{[dates, times, event.location].filter(Boolean).join(' · ')}</p>
            {event.shortDescription ? (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{event.shortDescription}</p>
            ) : null}
            {event.description ? (
              <div className="mt-8 max-w-2xl">
                <RichText data={event.description} />
              </div>
            ) : null}
          </div>
        </Section>
      </>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Real brides                                                      */
  /* ---------------------------------------------------------------- */
  const bride = await findDraftRealBride(slug)
  if (!bride) notFound()

  return (
    <>
      <PreviewBar label={bride.brideName} status={bride._status} livePath={livePath} />
      <Section spacing="tight">
        <div className="shell">
          <p className="eyebrow">Real bride</p>
          <h1 className="mt-3 text-h1">{bride.brideName}</h1>
          <p className="mt-3 text-ink-soft">
            {[bride.location, formatDate(bride.weddingDate)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </Section>
      <div className="shell">
        <MediaImage
          value={bride.coverImage}
          alt={`${bride.brideName} on her wedding day`}
          ratio="landscape"
          sizes={IMAGE_SIZES.full}
          priority
        />
      </div>
      {bride.story ? (
        <Section spacing="tight">
          <div className="shell-narrow">
            <RichText data={bride.story} />
          </div>
        </Section>
      ) : null}
    </>
  )
}

export default PreviewPage
