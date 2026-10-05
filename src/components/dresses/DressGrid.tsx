import type { Dress } from '@/payload-types'
import { Reveal } from '@/components/ui/Reveal'
import { IMAGE_SIZES } from '@/lib/media'
import { DressCard } from './DressCard'

type Props = {
  dresses: Dress[]
  /** Columns at the largest breakpoint. */
  columns?: 2 | 3 | 4
  /** Images above the fold load eagerly; the rest stay lazy. */
  priorityCount?: number
  emptyMessage?: string
  className?: string
}

const COLUMN_CLASSES: Record<NonNullable<Props['columns']>, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
}

const COLUMN_SIZES: Record<NonNullable<Props['columns']>, string> = {
  2: '(min-width: 768px) 45vw, 50vw',
  3: IMAGE_SIZES.tile,
  4: IMAGE_SIZES.card,
}

export const DressGrid = ({
  dresses,
  columns = 4,
  priorityCount = 0,
  emptyMessage = 'No gowns match these filters yet.',
  className,
}: Props) => {
  if (!dresses.length) {
    return <p className="py-16 text-center text-ink-muted">{emptyMessage}</p>
  }

  return (
    <ul className={['grid gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14', COLUMN_CLASSES[columns], className].filter(Boolean).join(' ')}>
      {dresses.map((dress, index) => (
        <li key={dress.id}>
          {/* Stagger caps out so a long grid does not drip in slowly. */}
          <Reveal delay={Math.min(index, 7) * 60}>
            <DressCard dress={dress} priority={index < priorityCount} sizes={COLUMN_SIZES[columns]} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
