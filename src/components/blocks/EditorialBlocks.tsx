import Link from 'next/link'
import { MediaImage, ResponsiveHeroImage } from '@/components/ui/Media'
import { HeroMedia } from './HeroMedia'
import { RichText } from '@/components/ui/RichText'
import { Reveal } from '@/components/ui/Reveal'
import { Section, SectionHeading } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { imageFrom, IMAGE_SIZES } from '@/lib/media'
import { type BlockOf, toneOf, usableLink } from './types'

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Hero heights, matching the reference: a full-screen opener with a floor so
 * it stays usable on short laptop screens.
 */
const HERO_HEIGHTS = {
  full: 'h-[100svh] min-h-[620px] md:min-h-[680px]',
  tall: 'h-[78svh] min-h-[560px]',
  medium: 'h-[58svh] min-h-[420px]',
} as const

/**
 * Copy placement. The reference anchors hero copy bottom-left, inset by a
 * fluid margin, which is what gives the pages their editorial feel.
 */
const HERO_ALIGNMENT = {
  'bottom-left': 'items-end justify-start text-left',
  left: 'items-center justify-start text-left',
  center: 'items-center justify-center text-center',
} as const

type HeroData = {
  eyebrow?: string | null
  heading?: string | null
  description?: string | null
  image?: BlockOf<'hero'>['image']
  mobileImage?: BlockOf<'hero'>['mobileImage']
  videoURL?: string | null
  height?: 'full' | 'tall' | 'medium' | null
  alignment?: 'center' | 'left' | 'bottom-left' | null
  buttons?: { label: string; url: string; id?: string | null }[] | null
}

/**
 * Full-bleed opening section.
 *
 * The image is the subject; type sits over a gradient scrim sized to the text
 * so contrast holds without dimming the whole photograph. A video, when set,
 * plays muted behind the image and is skipped under reduced-motion.
 */
export const HeroBlock = ({ data, priority = true }: { data: HeroData; priority?: boolean }) => {
  const hasContent = Boolean(data.heading || data.description || data.eyebrow || data.buttons?.length)
  const hasImage = Boolean(data.image || data.mobileImage)
  if (!hasContent && !hasImage) return null

  const height = HERO_HEIGHTS[data.height ?? 'full']
  const alignment = HERO_ALIGNMENT[data.alignment ?? 'bottom-left']

  return (
    // `data-hero` tells the header it may render transparently over this.
    <section data-hero className={`relative flex overflow-hidden bg-[#161514] ${height} ${alignment}`}>
      {/*
        A film, when the editor has set one, replaces the still on desktop and
        brings its own pause control. Phones keep the still either way.
      */}
      {data.videoURL ? (
        <HeroMedia
          videoURL={data.videoURL}
          poster={imageFrom(data.image, data.heading ?? '')}
          mobileImage={imageFrom(data.mobileImage, data.heading ?? '')}
        />
      ) : hasImage ? (
        <div className="absolute inset-0">
          <ResponsiveHeroImage
            desktop={data.image}
            mobile={data.mobileImage}
            alt={data.heading ?? ''}
            priority={priority}
          />
        </div>
      ) : null}

      {hasContent ? (
        <>
          {/*
            The reference scrim: dark at the very top so the overlaid header
            stays legible, clear through the middle so the photograph reads,
            dark again at the bottom behind the copy.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.68) 100%)',
            }}
          />
          <div
            className={`relative z-10 w-full ${
              (data.alignment ?? 'bottom-left') === 'center' ? 'px-(--spacing-gutter) py-20' : ''
            }`}
            style={
              (data.alignment ?? 'bottom-left') === 'bottom-left'
                ? {
                    paddingLeft: 'clamp(1.2rem, 6vw, 7rem)',
                    paddingRight: 'clamp(1.2rem, 6vw, 7rem)',
                    paddingBottom: 'clamp(5rem, 11vh, 8rem)',
                  }
                : undefined
            }
          >
            <div
              className={`flex max-w-[760px] flex-col text-white ${
                (data.alignment ?? 'bottom-left') === 'center' ? 'mx-auto items-center' : 'items-start'
              }`}
            >
              {data.eyebrow ? (
                <p className="text-[0.57rem] font-semibold tracking-[0.18em] text-white/85 uppercase md:text-[0.68rem]">
                  {data.eyebrow}
                </p>
              ) : null}
              {data.heading ? <h1 className="mt-2 text-h1">{data.heading}</h1> : null}
              {data.description ? (
                <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-white/85 md:text-base">
                  {data.description}
                </p>
              ) : null}
              {data.buttons?.length ? (
                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                  {data.buttons.map((button, index) => (
                    <ButtonLink
                      key={button.id ?? `${button.url}-${index}`}
                      href={button.url}
                      variant={index === 0 ? 'inverse' : 'ghost'}
                      className={index === 0 ? '' : 'text-white decoration-white/40'}
                    >
                      {button.label}
                    </ButtonLink>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

export const RichTextBlock = ({ block }: { block: BlockOf<'rich-text'> }) => (
  <Section tone={toneOf(block.tone)}>
    <div className={block.width === 'wide' ? 'shell' : 'shell-narrow'}>
      <Reveal>
        <SectionHeading eyebrow={block.eyebrow} title={block.heading} className="mb-8" />
        <RichText data={block.content} className={block.tone === 'ink' ? 'text-on-ink/85' : undefined} />
      </Reveal>
    </div>
  </Section>
)

export const TwoColumnTextBlock = ({ block }: { block: BlockOf<'two-column-text'> }) => (
  <Section tone={toneOf(block.tone)}>
    <div className="shell">
      <Reveal>
        <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} className="mb-10" />
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <RichText data={block.leftColumn} />
          <RichText data={block.rightColumn} />
        </div>
      </Reveal>
    </div>
  </Section>
)

/* -------------------------------------------------------------------------- */
/* Image and text                                                             */
/* -------------------------------------------------------------------------- */

export const SplitContentBlock = ({ block }: { block: BlockOf<'split-content'> }) => {
  const button = usableLink(block.button)
  const imageFirst = (block.imageSide ?? 'left') === 'left'

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className={imageFirst ? 'md:order-1' : 'md:order-2'}>
            <MediaImage value={block.image} alt={block.heading} ratio="tall" sizes={IMAGE_SIZES.half} />
          </Reveal>

          <Reveal delay={120} className={imageFirst ? 'md:order-2' : 'md:order-1'}>
            <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
            {block.body ? (
              <div className="mt-6">
                <RichText data={block.body} className={block.tone === 'ink' ? 'text-on-ink/85' : undefined} />
              </div>
            ) : null}
            {button ? (
              <div className="mt-8">
                <ButtonLink href={button.url} variant={block.tone === 'ink' ? 'inverse' : 'secondary'}>
                  {button.label}
                </ButtonLink>
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Full-bleed image                                                           */
/* -------------------------------------------------------------------------- */

const FULL_IMAGE_HEIGHTS = {
  tall: 'h-[70svh] md:h-[80svh]',
  medium: 'h-[50svh] md:h-[60svh]',
  short: 'h-[35svh] md:h-[42svh]',
} as const

export const FullWidthImageBlock = ({ block }: { block: BlockOf<'full-width-image'> }) => {
  const button = usableLink(block.button)
  const height = FULL_IMAGE_HEIGHTS[block.height ?? 'medium']

  return (
    <figure className="relative">
      <div className={`relative overflow-hidden bg-ivory ${height}`}>
        <ResponsiveHeroImage
          desktop={block.image}
          mobile={block.mobileImage}
          alt={block.overlayHeading ?? ''}
          priority={false}
        />

        {block.overlayHeading || button ? (
          <>
            <div aria-hidden="true" className="absolute inset-0 bg-ink/25" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="shell flex flex-col items-center gap-6 text-center text-on-ink">
                {block.overlayHeading ? <p className="text-h2">{block.overlayHeading}</p> : null}
                {button ? (
                  <ButtonLink href={button.url} variant="inverse">
                    {button.label}
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {block.caption ? (
        <figcaption className="shell pt-3 text-xs text-ink-muted">{block.caption}</figcaption>
      ) : null}
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export const GalleryBlock = ({ block }: { block: BlockOf<'gallery'> }) => {
  const images = block.images ?? []
  if (!images.length) return null

  const scrolling = block.layout === 'scroll'

  return (
    <Section>
      <div className="shell">
        <SectionHeading title={block.heading} description={block.description} className="mb-10" />
      </div>

      {scrolling ? (
        // Side-scrolling row: full-bleed on purpose, so it reads as a filmstrip.
        <ul className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:gap-6 md:px-10">
          {images.map((item, index) => (
            <li key={item.id ?? index} className="w-[76vw] shrink-0 snap-center md:w-[32vw]">
              <figure>
                <MediaImage value={item.image} ratio="tall" sizes="(min-width: 768px) 32vw, 76vw" />
                {item.caption ? <figcaption className="pt-2 text-xs text-ink-muted">{item.caption}</figcaption> : null}
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <div className="shell">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {images.map((item, index) => (
              <li key={item.id ?? index}>
                <Reveal delay={Math.min(index, 6) * 60}>
                  <figure>
                    <MediaImage value={item.image} ratio="tall" sizes={IMAGE_SIZES.tile} />
                    {item.caption ? (
                      <figcaption className="pt-2 text-xs text-ink-muted">{item.caption}</figcaption>
                    ) : null}
                  </figure>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Video                                                                      */
/* -------------------------------------------------------------------------- */

export const VideoBlock = ({ block }: { block: BlockOf<'video-hero'> }) => {
  const button = usableLink(block.button)

  return (
    <Section spacing="flush">
      <div className="relative h-[60svh] overflow-hidden bg-ink md:h-[75svh]">
        {/* The poster is the fallback under reduced-motion and before load. */}
        <div className="absolute inset-0 motion-reduce:block hidden">
          <MediaImage value={block.posterImage} ratio="none" className="h-full w-full" sizes={IMAGE_SIZES.full} />
        </div>
        <video
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          <source src={block.videoURL} type="video/mp4" />
        </video>

        {block.heading || block.description || button ? (
          <>
            <div aria-hidden="true" className="absolute inset-0 bg-ink/35" />
            <div className="relative z-10 flex h-full items-center">
              <div className="shell flex max-w-2xl flex-col gap-5 text-on-ink">
                {block.heading ? <h2 className="text-h1">{block.heading}</h2> : null}
                {block.description ? <p className="text-lg text-on-ink/85">{block.description}</p> : null}
                {button ? (
                  <ButtonLink href={button.url} variant="inverse" className="self-start">
                    {button.label}
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Call to action                                                             */
/* -------------------------------------------------------------------------- */

export const CTABlock = ({ block }: { block: BlockOf<'call-to-action'> }) => {
  const tone = toneOf(block.tone)
  const hasImage = Boolean(block.image)

  if (hasImage) {
    return (
      <Section spacing="flush">
        <div className="relative overflow-hidden bg-ink">
          <div className="absolute inset-0">
            <MediaImage value={block.image} ratio="none" className="h-full w-full" sizes={IMAGE_SIZES.full} />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
          <div className="relative z-10 shell py-(--spacing-section)">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center text-on-ink">
              {block.eyebrow ? (
                <p className="text-[0.6875rem] font-medium tracking-[0.22em] uppercase">{block.eyebrow}</p>
              ) : null}
              <h2 className="text-h2">{block.heading}</h2>
              {block.description ? <p className="text-lg text-on-ink/85">{block.description}</p> : null}
              {block.buttons?.length ? (
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {block.buttons.map((button, index) => (
                    <ButtonLink
                      key={button.id ?? `${button.url}-${index}`}
                      href={button.url}
                      variant={index === 0 ? 'inverse' : 'secondary'}
                      className={index === 0 ? '' : 'border-white/50 text-on-ink hover:border-white hover:bg-white/10'}
                    >
                      {button.label}
                    </ButtonLink>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section tone={tone}>
      <div className="shell">
        <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
            <h2 className="text-h2">{block.heading}</h2>
            {block.description ? (
              <p className={`text-lg ${tone === 'ink' ? 'text-on-ink/85' : 'text-ink-soft'}`}>{block.description}</p>
            ) : null}
            {block.buttons?.length ? (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {block.buttons.map((button, index) => (
                  <ButtonLink
                    key={button.id ?? `${button.url}-${index}`}
                    href={button.url}
                    variant={index === 0 ? (tone === 'ink' ? 'inverse' : 'primary') : 'secondary'}
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Spacer                                                                     */
/* -------------------------------------------------------------------------- */

const SPACER_SIZES = { small: 'h-10 md:h-14', medium: 'h-16 md:h-24', large: 'h-24 md:h-40' } as const

export const SpacerBlock = ({ block }: { block: BlockOf<'spacer'> }) => (
  <div className={SPACER_SIZES[block.size ?? 'medium']}>
    {block.divider ? (
      <div className="shell flex h-full items-center">
        <hr className="w-full border-0 border-t border-line" />
      </div>
    ) : null}
  </div>
)

/* -------------------------------------------------------------------------- */
/* Category links                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Picture links into the collection — the "find the silhouette that feels
 * like yours" pattern.
 */
export const CategoryLinksBlock = ({ block }: { block: BlockOf<'category-links'> }) => {
  const links = block.links ?? []
  if (!links.length) return null

  return (
    <Section>
      <div className="shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
          <ButtonLink href="/dresses" variant="ghost" className="shrink-0">
            View all dresses
          </ButtonLink>
        </div>
      </div>

      {/*
        The reference's mosaic: an uneven desktop grid that reads as an
        editorial spread, collapsing to a swipeable row on phones. Full-bleed
        on purpose, so the tiles run to the edge as they do on the reference.
      */}
      <ul
        className="no-scrollbar flex gap-[0.7rem] overflow-x-auto px-5 md:grid md:gap-4 md:overflow-visible md:px-10"
        style={{
          scrollSnapType: 'x mandatory',
          gridTemplateColumns: '1.2fr 0.8fr 0.7fr',
          gridTemplateRows: 'minmax(0, 32vw) minmax(0, 27vw)',
        }}
      >
        {links.map((link, index) => (
          <li
            key={link.id ?? `${link.url}-${index}`}
            className="h-[68svh] flex-[0_0_82vw] md:h-auto md:flex-none"
            style={{
              scrollSnapAlign: 'center',
              // The first tile spans both rows, as in the reference.
              ...(index === 0 ? { gridRow: 'span 2' } : {}),
            }}
          >
            <Link href={link.url} className="group relative block h-full overflow-hidden bg-ivory">
              <MediaImage
                value={link.image}
                alt={link.label}
                ratio="none"
                sizes="(min-width: 768px) 40vw, 82vw"
                className="h-full w-full"
                imageClassName="h-full w-full"
                hoverZoom
              />
              <span aria-hidden="true" className="absolute inset-0 bg-ink/20 transition-colors group-hover:bg-ink/30" />
              <span className="absolute bottom-6 left-6 z-10 font-serif text-[clamp(1.5rem,2.2vw,2.2rem)] leading-none text-white">
                {link.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  )
}
