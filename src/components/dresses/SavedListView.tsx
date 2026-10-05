'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDressSummaries, type DressSummary } from '@/actions/dresses'
import { ButtonLink } from '@/components/ui/Button'
import { useSavedLists, type ListName } from './SavedListsProvider'

type Props = {
  list: ListName
  emptyTitle: string
  emptyBody: string
}

/**
 * Renders a saved list held in the browser.
 *
 * The page itself is static; this reads the stored IDs after mount and asks
 * the server for the matching gowns. Until that resolves it shows a quiet
 * placeholder rather than an "empty" message that would be wrong.
 */
export const SavedListView = ({ list, emptyTitle, emptyBody }: Props) => {
  const { wishlist, tryOn, ready, remove, toggle, has } = useSavedLists()
  const ids = list === 'wishlist' ? wishlist : tryOn
  const [fetched, setFetched] = useState<DressSummary[] | null>(null)

  /**
   * The rendered list is derived from the stored IDs and the fetched detail,
   * in the stored order — so removing a gown updates immediately without
   * waiting for another round trip, and an empty list needs no fetch at all.
   */
  const byId = new Map((fetched ?? []).map((dress) => [dress.id, dress]))
  const dresses = ids.length
    ? ids.map((id) => byId.get(id)).filter((dress): dress is DressSummary => Boolean(dress))
    : []

  useEffect(() => {
    if (!ready || !ids.length) return

    let active = true
    getDressSummaries(ids)
      .then((result) => {
        if (active) setFetched(result)
      })
      .catch(() => {
        if (active) setFetched([])
      })

    return () => {
      active = false
    }
  }, [ready, ids])

  // Distinguish "not looked up yet" from "nothing saved".
  if (!ready || (ids.length > 0 && fetched === null)) {
    return (
      <div className="py-16 text-center text-ink-muted" aria-busy="true">
        Loading your list…
      </div>
    )
  }

  if (!dresses.length) {
    return (
      <div className="max-w-xl py-10">
        <h2 className="font-serif text-2xl">{emptyTitle}</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">{emptyBody}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/dresses">Browse the collection</ButtonLink>
          <ButtonLink href="/designers" variant="secondary">
            See the designers
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {dresses.map((dress) => {
          const onTryOn = has('tryOn', dress.id)

          return (
            <li key={dress.id}>
              <article className="group relative flex flex-col">
                <div className="relative">
                  <Link href={`/dress/${dress.slug}`} className="block">
                    {dress.image ? (
                      <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
                        <Image
                          src={dress.image}
                          alt={dress.name}
                          fill
                          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
                          className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/5] bg-ivory" aria-hidden="true" />
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() => remove(list, dress.id)}
                    className="absolute top-3 right-3 grid h-9 w-9 place-items-center bg-paper/85 backdrop-blur-sm transition-colors hover:bg-paper"
                  >
                    <X className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />
                    <span className="sr-only">{`Remove ${dress.name} from this list`}</span>
                  </button>
                </div>

                <div className="pt-4">
                  {dress.designer ? (
                    <p className="text-[0.625rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
                      {dress.designer}
                    </p>
                  ) : null}
                  <h3 className="mt-1.5 font-serif text-xl leading-tight">
                    <Link href={`/dress/${dress.slug}`}>{dress.name}</Link>
                  </h3>

                  {list === 'wishlist' ? (
                    <button
                      type="button"
                      onClick={() => toggle('tryOn', dress.id)}
                      aria-pressed={onTryOn}
                      className={`mt-3 inline-flex items-center gap-2 text-[0.625rem] font-medium tracking-[0.16em] uppercase underline decoration-line-strong underline-offset-4 ${
                        onTryOn ? 'text-taupe' : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      <Heart className="h-3 w-3" aria-hidden="true" strokeWidth={1.5} fill={onTryOn ? 'currentColor' : 'none'} />
                      {onTryOn ? 'On try-on list' : 'Add to try-on list'}
                    </button>
                  ) : null}
                </div>
              </article>
            </li>
          )
        })}
      </ul>

      <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <ButtonLink href="/your-appointment">
          {list === 'tryOn' ? 'Book with this list' : 'Book an appointment'}
        </ButtonLink>
        <ButtonLink href="/dresses" variant="secondary">
          Keep looking
        </ButtonLink>
      </div>
    </>
  )
}
