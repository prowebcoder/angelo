import type { Media } from '@/payload-types'

/**
 * Payload relationship fields hold either an ID (depth 0) or the populated
 * document. These helpers keep that branching out of components.
 */
export const isPopulated = <T extends { id: number }>(value: number | T | null | undefined): value is T =>
  typeof value === 'object' && value !== null

export const resolveMedia = (value: number | Media | null | undefined): Media | null =>
  isPopulated<Media>(value) ? value : null

export type ImageSource = {
  src: string
  alt: string
  width: number
  height: number
  focal?: string
  caption?: string
}

/** Intrinsic dimensions are needed to reserve space and avoid layout shift. */
const FALLBACK_WIDTH = 1200
const FALLBACK_HEIGHT = 1500

/**
 * Builds `next/image` props from a Media document.
 *
 * Returns `null` when there is no uploaded file so callers render a graceful
 * placeholder instead of a broken image.
 */
export const imageFrom = (
  value: number | Media | null | undefined,
  altOverride?: string | null,
): ImageSource | null => {
  const media = resolveMedia(value)
  if (!media?.url) return null

  return {
    src: media.url,
    alt: altOverride?.trim() || media.alt || '',
    width: media.width ?? FALLBACK_WIDTH,
    height: media.height ?? FALLBACK_HEIGHT,
    focal:
      media.focalX != null && media.focalY != null
        ? `${media.focalX}% ${media.focalY}%`
        : undefined,
    caption: media.caption ?? undefined,
  }
}

/** First available image from a list of candidates. */
export const firstImage = (
  ...values: (number | Media | null | undefined)[]
): ImageSource | null => {
  for (const value of values) {
    const image = imageFrom(value)
    if (image) return image
  }
  return null
}

/**
 * Standard `sizes` strings. Getting these right is the single biggest lever on
 * image payload, so they live in one place rather than being guessed per call.
 */
export const IMAGE_SIZES = {
  /** Four-up grid on desktop, two-up on mobile. */
  card: '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw',
  /** Three-up editorial grid. */
  tile: '(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw',
  /** Half-width split sections. */
  half: '(min-width: 768px) 50vw, 100vw',
  /** Edge-to-edge hero. */
  full: '100vw',
  /** Small square thumbnails. */
  thumb: '96px',
} as const
