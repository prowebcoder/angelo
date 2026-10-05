import Link from 'next/link'
import type { Dress } from '@/payload-types'
import { MediaImage } from '@/components/ui/Media'
import { designerName, formatPrice } from '@/lib/format'
import { IMAGE_SIZES } from '@/lib/media'
import { TryOnButton, WishlistButton } from './SaveButtons'

/**
 * Catalogue card.
 *
 * A fixed 4:5 frame keeps every row aligned however tall the source images
 * are, and `object-cover` plus the stored focal point means nothing stretches.
 * Only facts recorded in the CMS are shown — no placeholder prices.
 */
export const DressCard = ({
  dress,
  priority = false,
  sizes = IMAGE_SIZES.card,
}: {
  dress: Dress
  priority?: boolean
  sizes?: string
}) => {
  const designer = designerName(dress)
  const price = formatPrice(dress.price, dress.currency ?? 'EUR')
  const badge = dress.sampleSale ? 'Sample sale' : dress.newArrival ? 'New arrival' : null

  return (
    <article className="group relative flex flex-col">
      <div className="relative">
        <Link href={`/dress/${dress.slug}`} className="block" tabIndex={-1} aria-hidden="true">
          <MediaImage
            value={dress.primaryImage}
            alt={`${dress.name}${designer ? ` by ${designer}` : ''}`}
            ratio="portrait"
            sizes={sizes}
            priority={priority}
            hoverZoom
          />
        </Link>

        {badge ? (
          <span className="absolute top-3 left-3 bg-paper/90 px-3 py-1.5 text-[0.5625rem] font-medium tracking-[0.18em] uppercase backdrop-blur-sm">
            {badge}
          </span>
        ) : null}

        <WishlistButton dressId={dress.id} dressName={dress.name} className="absolute top-3 right-3" />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {designer ? (
          <p className="text-[0.625rem] font-medium tracking-[0.18em] text-ink-muted uppercase">{designer}</p>
        ) : null}

        <h3 className="mt-1.5 font-serif text-[1.375rem] leading-tight">
          {/* The whole card is clickable via this stretched link. */}
          <Link href={`/dress/${dress.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {dress.name}
          </Link>
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 text-sm text-ink-muted">
          {dress.styleCode ? <span>{dress.styleCode}</span> : null}
          {price ? <span className="text-ink-soft">{price}</span> : null}
        </div>

        {/* Sits above the stretched link so it stays clickable. */}
        <div className="relative z-10 mt-3">
          <TryOnButton dressId={dress.id} dressName={dress.name} variant="compact" />
        </div>
      </div>
    </article>
  )
}
