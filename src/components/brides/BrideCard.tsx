import Link from 'next/link'
import type { Designer, Dress, RealBride } from '@/payload-types'
import { MediaImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { formatDate } from '@/lib/format'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'

/** The gown a bride wore, as a label, when the relation is populated. */
export const brideGownLabel = (bride: RealBride): string | null => {
  const dress = isPopulated<Dress>(bride.dress) ? bride.dress : null
  const designer = isPopulated<Designer>(bride.designer)
    ? bride.designer
    : dress && isPopulated<Designer>(dress.designer)
      ? dress.designer
      : null

  if (dress && designer) return `${dress.name} by ${designer.name}`
  if (dress) return dress.name
  if (designer) return designer.name
  return null
}

export const BrideCard = ({
  bride,
  priority = false,
  sizes = IMAGE_SIZES.tile,
}: {
  bride: RealBride
  priority?: boolean
  sizes?: string
}) => {
  const gown = brideGownLabel(bride)
  const date = formatDate(bride.weddingDate, { month: 'long', year: 'numeric', day: undefined })

  return (
    <article className="group relative flex flex-col">
      <Link href={`/real-brides/${bride.slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <MediaImage
          value={bride.coverImage}
          alt={`${bride.brideName} on her wedding day`}
          ratio="tall"
          sizes={sizes}
          priority={priority}
          hoverZoom
        />
      </Link>

      <div className="pt-5">
        <h3 className="font-serif text-2xl leading-tight">
          <Link href={`/real-brides/${bride.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {bride.brideName}
          </Link>
        </h3>
        <p className="mt-1.5 space-x-2 text-sm text-ink-muted">
          {bride.location ? <span>{bride.location}</span> : null}
          {bride.location && date ? <span aria-hidden="true">·</span> : null}
          {date ? <time dateTime={bride.weddingDate ?? undefined}>{date}</time> : null}
        </p>
        {gown ? <p className="mt-2 text-sm text-ink-soft">{gown}</p> : null}
      </div>
    </article>
  )
}

export const BrideGrid = ({
  brides,
  emptyMessage = 'Bride stories are being gathered.',
}: {
  brides: RealBride[]
  emptyMessage?: string
}) => {
  if (!brides.length) {
    return <p className="py-16 text-center text-ink-muted">{emptyMessage}</p>
  }

  return (
    <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 md:gap-x-6">
      {brides.map((bride, index) => (
        <li key={bride.id}>
          <Reveal delay={Math.min(index, 6) * 70}>
            <BrideCard bride={bride} priority={index < 3} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
