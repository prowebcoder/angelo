import Link from 'next/link'
import Image from 'next/image'
import type { Dress } from '@/payload-types'
import { designerName, formatPrice } from '@/lib/format'
import { imageFrom } from '@/lib/media'
import { WishlistButton } from './SaveButtons'

/**
 * Horizontal gown rail, as the reference uses for "Most loved".
 *
 * A scroll-snapping row rather than a wrapping grid: it reads as an edit
 * someone has chosen, and on a phone it becomes a swipeable carousel with no
 * extra JavaScript. Each card swaps to its second photograph on hover, which
 * is how the reference previews the back of a gown.
 */
export const DressRail = ({ dresses }: { dresses: Dress[] }) => {
  if (!dresses.length) return null

  return (
    <ul
      className="no-scrollbar grid auto-cols-[78vw] grid-flow-col gap-4 overflow-x-auto pb-4 md:auto-cols-[minmax(280px,30vw)]"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {dresses.map((dress, index) => {
        const designer = designerName(dress)
        const price = formatPrice(dress.price, dress.currency ?? 'EUR')
        const primary = imageFrom(dress.primaryImage, `${dress.name}${designer ? ` by ${designer}` : ''}`)
        // The second approved view, shown on hover.
        const secondary = imageFrom(dress.gallery?.[0]?.image, dress.gallery?.[0]?.alt)

        return (
          <li key={dress.id} className="min-w-0" style={{ scrollSnapAlign: 'start' }}>
            <article className="group relative">
              <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
                {primary ? (
                  <Image
                    src={primary.src}
                    alt={primary.alt}
                    fill
                    sizes="(min-width: 768px) 30vw, 78vw"
                    priority={index < 2}
                    className={`object-cover transition-opacity duration-700 ${
                      secondary ? 'group-hover:opacity-0' : ''
                    }`}
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-eyebrow tracking-[0.22em] text-ink-muted uppercase">
                    Image to follow
                  </span>
                )}

                {secondary ? (
                  <Image
                    src={secondary.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 30vw, 78vw"
                    loading="lazy"
                    aria-hidden="true"
                    className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                  />
                ) : null}

                <WishlistButton dressId={dress.id} dressName={dress.name} className="absolute top-3 right-3 z-10" />
              </div>

              <div className="pt-4">
                <h3 className="font-serif text-[1.45rem] leading-[1.15]">
                  <Link href={`/dress/${dress.slug}`} className="after:absolute after:inset-0 after:content-['']">
                    {dress.name}
                  </Link>
                </h3>
                <p className="mt-1 text-[0.6875rem] tracking-[0.14em] text-ink-muted uppercase">
                  {[designer, dress.styleCode].filter(Boolean).join(' · ')}
                </p>
                {price ? <p className="mt-1 text-sm text-ink-soft">{price}</p> : null}
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
