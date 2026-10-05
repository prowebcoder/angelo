import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Accessory, Dress } from '@/payload-types'
import { AccessoryGrid } from '@/components/accessories/AccessoryCard'
import { DressDisclosures } from '@/components/dresses/DressDisclosures'
import { DressExplorer, type Chapter } from '@/components/dresses/DressExplorer'
import { DressGallery, type GalleryImage } from '@/components/dresses/DressGallery'
import { DressRail } from '@/components/dresses/DressRail'
import { TryOnButton, WishlistButton } from '@/components/dresses/SaveButtons'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { JsonLd } from '@/components/ui/JsonLd'
import { MediaImage } from '@/components/ui/Media'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getDressBySlug, getDressSlugs, getRelatedDresses, getSiteSettings } from '@/lib/queries'
import { designerOf, formatPrice } from '@/lib/format'
import { imageFrom, isPopulated, IMAGE_SIZES } from '@/lib/media'
import { absoluteImage, buildMetadata, productSchema } from '@/lib/seo'

export const revalidate = 3600

export const generateStaticParams = async () => {
  const slugs = await getDressSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const [dress, settings] = await Promise.all([getDressBySlug(slug), getSiteSettings()])
  if (!dress) return {}

  const designer = designerOf(dress)

  return buildMetadata({
    seo: dress.seo,
    fallbackTitle: designer ? `${dress.name} by ${designer.name}` : dress.name,
    fallbackDescription: dress.description,
    fallbackImage: dress.primaryImage,
    path: `/dress/${slug}`,
    settings,
  })
}

/** Gallery images: the main photograph first, then the editor's order. */
const galleryFrom = (dress: Dress): GalleryImage[] => {
  const images: GalleryImage[] = []

  const primary = imageFrom(dress.primaryImage, dress.name)
  if (primary) {
    images.push({ src: primary.src, alt: primary.alt, width: primary.width, height: primary.height })
  }

  for (const item of dress.gallery ?? []) {
    const image = imageFrom(item.image, item.alt)
    if (!image || images.some((existing) => existing.src === image.src)) continue
    images.push({
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
      caption: item.caption ?? undefined,
    })
  }

  return images
}

/**
 * Chapter titles for the scroll explorer.
 *
 * The headings are fixed editorial framing — they describe the act of looking,
 * not the gown — while the body text is the boutique's own description,
 * sentence by sentence. Chapters beyond the number of photographs are dropped
 * by the explorer, so a gown with two views never implies a third.
 */
const chaptersFor = (dress: Dress): Chapter[] => {
  const sentences = (dress.description ?? '')
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const frames: { label: string; heading: string }[] = [
    { label: 'The silhouette', heading: 'A considered first impression.' },
    { label: 'The bodice', heading: 'The shape begins here.' },
    { label: 'Crafted in detail', heading: 'Details, brought into focus.' },
    { label: 'In motion', heading: 'Designed to be seen from more than one view.' },
  ]

  return frames.map((frame, index) => ({
    ...frame,
    body: sentences[index] ?? sentences[sentences.length - 1] ?? null,
  }))
}

const DressPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const dress = await getDressBySlug(slug)

  if (!dress) notFound()

  const designer = designerOf(dress)
  const [related, settings] = await Promise.all([
    designer ? getRelatedDresses(dress.id, designer.id, 6) : Promise.resolve([]),
    getSiteSettings(),
  ])

  const images = galleryFrom(dress)
  const price = formatPrice(dress.price, dress.currency ?? 'EUR')
  const accessories = (dress.accessories ?? []).filter((item): item is Accessory => isPopulated<Accessory>(item))

  return (
    <>
      {/*
        Opening section: the gown against its own photograph, with the two
        actions that matter — try it on, and book a time to do so.
      */}
      <section data-hero className="relative grid min-h-[86svh] bg-[#141311] lg:grid-cols-2">
        <div className="relative min-h-[60svh] lg:min-h-full">
          <MediaImage
            value={dress.primaryImage}
            alt={`${dress.name}${designer ? ` by ${designer.name}` : ''}`}
            ratio="none"
            sizes={IMAGE_SIZES.half}
            className="h-full w-full"
            imageClassName="h-full w-full"
            priority
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 lg:hidden"
            style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.45))' }}
          />
        </div>

        <div
          className="flex flex-col justify-center text-white"
          style={{ padding: 'clamp(2rem, 5vw, 5rem)' }}
        >
          <Breadcrumbs
            crumbs={[
              { name: 'Wedding dresses', href: '/dresses' },
              ...(designer ? [{ name: designer.name, href: `/designers/${designer.slug}` }] : []),
              { name: dress.name, href: `/dress/${slug}` },
            ]}
            className="mb-8 [&_*]:text-white/60 [&_a:hover]:text-white"
          />

          {designer ? (
            <Link href={`/designers/${designer.slug}`} className="eyebrow link-quiet">
              {designer.name}
            </Link>
          ) : null}

          <h1 className="mt-3 text-h2-sm">{dress.name}</h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 text-sm text-white/70">
            {dress.styleCode ? <span>{`Style ${dress.styleCode}`}</span> : null}
            {dress.collection ? <span>{dress.collection}</span> : null}
          </div>

          {price ? <p className="mt-5 text-xl">{price}</p> : null}

          {dress.description ? (
            <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-white/85">{dress.description}</p>
          ) : null}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <TryOnButton dressId={dress.id} dressName={dress.name} className="flex-1 border-white text-white hover:bg-white hover:text-ink" />
            <ButtonLink href="/your-appointment" variant="inverse" className="flex-1">
              Book an appointment
            </ButtonLink>
          </div>

          <div className="mt-4">
            <WishlistButton
              dressId={dress.id}
              dressName={dress.name}
              variant="inline"
              className="w-full border-white/40 text-white hover:border-white"
            />
          </div>

          {images.length > 1 ? (
            <a
              href="#explore-dress"
              className="mt-8 self-start text-[0.57rem] font-semibold tracking-[0.14em] text-white/70 uppercase underline decoration-white/30 underline-offset-[0.4em] hover:text-white"
            >
              Explore the dress ↓
            </a>
          ) : null}
        </div>
      </section>

      {/* Scroll-driven walk through each approved photograph. */}
      <DressExplorer
        images={images}
        chapters={chaptersFor(dress)}
        dressName={dress.name}
        eyebrow="Explore the dress"
        heading="Every supplied view, at your pace."
      />

      {/* Manual gallery, for anyone who would rather click than scroll. */}
      {images.length > 1 ? (
        <Section tone="paper">
          <div className="shell">
            <SectionHeading
              eyebrow="Look closer"
              title="Explore each genuine view."
              description={`${images.length} approved photograph${images.length === 1 ? '' : 's'}. Use the thumbnails, the arrows or swipe to move through the gallery.`}
              size="compact"
              className="mb-10"
            />
            <DressGallery images={images} dressName={dress.name} />
          </div>
        </Section>
      ) : null}

      {/* Product details */}
      <Section tone="shell" as="section">
        <div className="shell-narrow">
          <SectionHeading eyebrow="The gown" title="Product details" size="compact" className="mb-4" />
          <p className="mb-8 text-sm text-ink-muted">
            Only information approved in the supplied Angelo Bridal catalogue is shown here.
          </p>
          <DressDisclosures dress={dress} photographCount={images.length} />
        </div>
      </Section>

      {/* Request to try */}
      <Section tone="paper">
        <div className="shell-narrow text-center">
          <p className="eyebrow">Your private appointment</p>
          <h2 className="mt-3 text-h2-sm">{`Would you like to try ${dress.name}?`}</h2>
          <p className="mx-auto mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">
            Add this gown to your try-on list and include it in your appointment request. Where possible the
            Angelo team will prepare selected gowns for your visit; availability is confirmed by the boutique.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TryOnButton dressId={dress.id} dressName={dress.name} />
            <ButtonLink href="/your-appointment">Request an appointment</ButtonLink>
          </div>
          {settings.contact?.phone ? (
            <p className="mt-6 text-sm text-ink-muted">
              {'Or call the boutique on '}
              <a href={`tel:${settings.contact.phone.replace(/\s+/g, '')}`} className="link-quiet text-ink-soft">
                {settings.contact.phone}
              </a>
              .
            </p>
          ) : null}
        </div>
      </Section>

      {/* Complete the look */}
      {accessories.length ? (
        <Section tone="shell">
          <div className="shell">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Styled at Angelo" title="Complete the look" size="compact" />
              <ButtonLink href="/accessories" variant="ghost" className="shrink-0">
                Explore accessories
              </ButtonLink>
            </div>
            <AccessoryGrid accessories={accessories} />
          </div>
        </Section>
      ) : null}

      {/* You may also love */}
      {related.length ? (
        <Section tone="paper">
          <div className="shell">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Continue discovering" title="You may also love" size="compact" />
              <ButtonLink href="/dresses" variant="ghost" className="shrink-0">
                View all dresses
              </ButtonLink>
            </div>
            <DressRail dresses={related} />
          </div>
        </Section>
      ) : null}

      <JsonLd
        data={productSchema({
          name: dress.name,
          description: dress.description,
          image: absoluteImage(dress.primaryImage),
          brand: designer?.name,
          sku: dress.styleCode,
          price: dress.price,
          currency: dress.currency,
          url: `/dress/${slug}`,
        })}
      />
    </>
  )
}

export default DressPage
