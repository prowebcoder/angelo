import Image from 'next/image'
import type { Media as MediaDoc } from '@/payload-types'
import { imageFrom, IMAGE_SIZES } from '@/lib/media'

type Ratio = 'portrait' | 'tall' | 'square' | 'landscape' | 'wide' | 'none'

const RATIOS: Record<Ratio, string> = {
  portrait: 'aspect-[4/5]',
  tall: 'aspect-[3/4]',
  square: 'aspect-square',
  landscape: 'aspect-[3/2]',
  wide: 'aspect-[16/9]',
  none: '',
}

type Props = {
  value: number | MediaDoc | null | undefined
  /** Overrides the media library alt text where context demands it. */
  alt?: string | null
  sizes?: string
  ratio?: Ratio
  className?: string
  imageClassName?: string
  priority?: boolean
  /** Subtle zoom on hover; set by cards, not by editorial images. */
  hoverZoom?: boolean
  /**
   * Overrides the media library's focal point, for sections that need a
   * specific crop regardless of how the image is usually framed.
   */
  objectPosition?: string
}

/**
 * Figure wrapper for CMS images.
 *
 * Reserves the aspect ratio before the image loads to avoid layout shift, uses
 * the stored focal point for cropping, and falls back to a quiet placeholder
 * rather than a broken image when no file has been uploaded yet.
 */
export const MediaImage = ({
  value,
  alt,
  sizes = IMAGE_SIZES.card,
  ratio = 'portrait',
  className,
  imageClassName,
  priority = false,
  hoverZoom = false,
  objectPosition,
}: Props) => {
  const image = imageFrom(value, alt)
  const frame = ['relative overflow-hidden bg-ivory', RATIOS[ratio], className].filter(Boolean).join(' ')

  if (!image) {
    return (
      <div className={frame} aria-hidden="true">
        <span className="absolute inset-0 grid place-items-center text-eyebrow uppercase tracking-[0.22em] text-ink-muted">
          Image to follow
        </span>
      </div>
    )
  }

  return (
    <div className={frame}>
      <Image
        src={image.src}
        alt={image.alt}
        fill={ratio !== 'none'}
        width={ratio === 'none' ? image.width : undefined}
        height={ratio === 'none' ? image.height : undefined}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={[
          'object-cover',
          hoverZoom ? 'transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]' : '',
          imageClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          objectPosition || image.focal ? { objectPosition: objectPosition ?? image.focal } : undefined
        }
      />
    </div>
  )
}

/**
 * Hero images take a separate mobile crop when the editor supplies one, so a
 * wide landscape hero does not become an unreadable sliver on a phone.
 */
export const ResponsiveHeroImage = ({
  desktop,
  mobile,
  alt,
  priority = true,
  className,
}: {
  desktop: number | MediaDoc | null | undefined
  mobile?: number | MediaDoc | null | undefined
  alt?: string | null
  priority?: boolean
  className?: string
}) => {
  const desktopImage = imageFrom(desktop, alt)
  const mobileImage = imageFrom(mobile, alt)

  if (!desktopImage && !mobileImage) {
    return <div className={['bg-ivory', className].filter(Boolean).join(' ')} aria-hidden="true" />
  }

  const primary = desktopImage ?? mobileImage
  if (!primary) return null

  return (
    <>
      {mobileImage ? (
        <Image
          src={mobileImage.src}
          alt={mobileImage.alt}
          fill
          sizes="100vw"
          priority={priority}
          className={['object-cover md:hidden', className].filter(Boolean).join(' ')}
          style={mobileImage.focal ? { objectPosition: mobileImage.focal } : undefined}
        />
      ) : null}
      <Image
        src={primary.src}
        alt={mobileImage ? '' : primary.alt}
        aria-hidden={mobileImage ? true : undefined}
        fill
        sizes="100vw"
        priority={priority}
        className={['object-cover', mobileImage ? 'hidden md:block' : '', className].filter(Boolean).join(' ')}
        style={primary.focal ? { objectPosition: primary.focal } : undefined}
      />
    </>
  )
}
