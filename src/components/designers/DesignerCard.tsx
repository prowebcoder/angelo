import Link from 'next/link'
import type { Designer } from '@/payload-types'
import { MediaImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { IMAGE_SIZES } from '@/lib/media'
import { truncate } from '@/lib/format'

export const DesignerCard = ({
  designer,
  priority = false,
  sizes = IMAGE_SIZES.tile,
}: {
  designer: Designer
  priority?: boolean
  sizes?: string
}) => (
  <article className="group relative flex flex-col">
    <Link href={`/designers/${designer.slug}`} className="block" tabIndex={-1} aria-hidden="true">
      <MediaImage
        value={designer.heroImage ?? designer.logo}
        alt={designer.name}
        ratio="tall"
        sizes={sizes}
        priority={priority}
        hoverZoom
      />
    </Link>

    <div className="pt-5">
      <h3 className="font-serif text-2xl leading-tight">
        <Link href={`/designers/${designer.slug}`} className="after:absolute after:inset-0 after:content-['']">
          {designer.name}
        </Link>
      </h3>
      {designer.description ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{truncate(designer.description, 140)}</p>
      ) : null}
      <span className="mt-4 inline-block text-[0.625rem] font-medium tracking-[0.18em] text-taupe uppercase">
        View the collection
      </span>
    </div>
  </article>
)

export const DesignerGrid = ({
  designers,
  columns = 3,
  emptyMessage = 'Designer collections are being added.',
}: {
  designers: Designer[]
  columns?: 2 | 3 | 4
  emptyMessage?: string
}) => {
  if (!designers.length) {
    return <p className="py-16 text-center text-ink-muted">{emptyMessage}</p>
  }

  const columnClass =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <ul className={`grid gap-x-5 gap-y-12 ${columnClass} md:gap-x-6`}>
      {designers.map((designer, index) => (
        <li key={designer.id}>
          <Reveal delay={Math.min(index, 6) * 70}>
            <DesignerCard designer={designer} priority={index < 3} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
