import type { Accessory, Taxonomy } from '@/payload-types'
import { MediaImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { formatPrice } from '@/lib/format'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'

const AVAILABILITY_LABELS: Record<NonNullable<Accessory['availability']>, string> = {
  available: 'In the boutique',
  unavailable: 'Currently unavailable',
  'confirm-with-boutique': 'Confirm with the boutique',
}

export const accessoryCategory = (accessory: Accessory): string | null =>
  isPopulated<Taxonomy>(accessory.category) ? accessory.category.name : null

/**
 * Accessory card.
 *
 * There is no basket yet, so the card ends in an enquiry rather than an
 * "add to bag" that would not work. The data model already carries SKU, price
 * and availability, so a checkout can be layered on later.
 */
export const AccessoryCard = ({
  accessory,
  priority = false,
  sizes = IMAGE_SIZES.card,
}: {
  accessory: Accessory
  priority?: boolean
  sizes?: string
}) => {
  const price = formatPrice(accessory.price, accessory.currency ?? 'EUR')
  const category = accessoryCategory(accessory)

  return (
    <article id={accessory.slug} className="group flex scroll-mt-40 flex-col">
      <MediaImage
        value={accessory.image}
        alt={accessory.name}
        ratio="square"
        sizes={sizes}
        priority={priority}
        hoverZoom
      />

      <div className="flex flex-1 flex-col pt-4">
        {category ? (
          <p className="text-[0.625rem] font-medium tracking-[0.18em] text-ink-muted uppercase">{category}</p>
        ) : null}
        <h3 className="mt-1.5 font-serif text-xl leading-tight">
          {accessory.name}
          {/* The reference prints the reference code alongside the name. */}
          {accessory.sku ? <span className="ml-2 text-sm text-ink-muted">{accessory.sku}</span> : null}
        </h3>
        {accessory.description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{accessory.description}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 text-sm">
          {price ? <span className="text-ink">{price}</span> : null}
          <span className="text-xs text-ink-muted">
            {AVAILABILITY_LABELS[accessory.availability ?? 'confirm-with-boutique']}
          </span>
        </div>
      </div>
    </article>
  )
}

export const AccessoryGrid = ({
  accessories,
  emptyMessage = 'Accessories are being added to the boutique listing.',
}: {
  accessories: Accessory[]
  emptyMessage?: string
}) => {
  if (!accessories.length) {
    return <p className="py-16 text-center text-ink-muted">{emptyMessage}</p>
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {accessories.map((accessory, index) => (
        <li key={accessory.id}>
          <Reveal delay={Math.min(index, 7) * 60}>
            <AccessoryCard accessory={accessory} priority={index < 4} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
