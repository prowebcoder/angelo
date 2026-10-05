'use client'

import { Check, Heart, Plus } from 'lucide-react'
import { useSavedLists } from './SavedListsProvider'

/**
 * Wishlist toggle.
 *
 * `aria-pressed` carries the state rather than a visual-only fill, and the
 * accessible name names the gown so a screen-reader user hears which card
 * they are on in a grid of buttons.
 */
export const WishlistButton = ({
  dressId,
  dressName,
  variant = 'icon',
  className,
}: {
  dressId: number
  dressName: string
  variant?: 'icon' | 'inline'
  className?: string
}) => {
  const { has, toggle, ready } = useSavedLists()
  const saved = ready && has('wishlist', dressId)

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={() => toggle('wishlist', dressId)}
        aria-pressed={saved}
        className={[
          'inline-flex items-center justify-center gap-2 border px-6 py-4 text-[0.6875rem] font-medium tracking-[0.16em] uppercase transition-colors',
          saved ? 'border-ink bg-ink text-on-ink' : 'border-line-strong text-ink hover:border-ink',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Heart className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : 'Save to wishlist'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => toggle('wishlist', dressId)}
      aria-pressed={saved}
      className={[
        'grid h-9 w-9 place-items-center bg-paper/85 text-ink backdrop-blur-sm transition-colors hover:bg-paper',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Heart
        className="h-[1.05rem] w-[1.05rem]"
        aria-hidden="true"
        strokeWidth={1.25}
        fill={saved ? 'currentColor' : 'none'}
      />
      <span className="sr-only">{saved ? `Remove ${dressName} from wishlist` : `Save ${dressName} to wishlist`}</span>
    </button>
  )
}

/**
 * Try-on list toggle.
 *
 * The try-on list is distinct from the wishlist: it is the shortlist the
 * boutique prepares for an appointment, and the appointment form reads it.
 */
export const TryOnButton = ({
  dressId,
  dressName,
  variant = 'inline',
  className,
}: {
  dressId: number
  dressName: string
  variant?: 'inline' | 'compact'
  className?: string
}) => {
  const { has, toggle, ready } = useSavedLists()
  const added = ready && has('tryOn', dressId)

  const Icon = added ? Check : Plus

  return (
    <button
      type="button"
      onClick={() => toggle('tryOn', dressId)}
      aria-pressed={added}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium tracking-[0.16em] uppercase transition-colors',
        variant === 'inline'
          ? `border px-6 py-4 text-[0.6875rem] ${added ? 'border-ink bg-ink text-on-ink' : 'border-ink text-ink hover:bg-ink hover:text-on-ink'}`
          : `text-[0.625rem] underline decoration-line-strong underline-offset-4 ${added ? 'text-taupe' : 'text-ink-soft hover:text-ink'}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className={variant === 'inline' ? 'h-4 w-4' : 'h-3 w-3'} aria-hidden="true" strokeWidth={1.5} />
      <span>{added ? 'On try-on list' : 'Add to try-on list'}</span>
      <span className="sr-only">{` — ${dressName}`}</span>
    </button>
  )
}
