'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { searchSite } from '@/actions/search'
import { GROUP_LABELS, type SearchGroup, type SearchHit } from '@/lib/search-shared'
import { useFocusTrap } from '@/hooks/useFocusTrap'

const DEBOUNCE_MS = 220

/**
 * Site-wide search overlay with grouped, keyboard-navigable results.
 *
 * Arrow keys move through the flat result list regardless of grouping, Enter
 * opens the active hit, and Escape closes. Results are announced politely so
 * screen-reader users hear the count change.
 */
export const SearchOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [rawHits, setRawHits] = useState<SearchHit[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [pending, startTransition] = useTransition()
  const requestId = useRef(0)

  useFocusTrap(panelRef, open, onClose)

  /**
   * Closing the overlay and typing too few characters both *hide* results
   * rather than clearing them, so neither needs an effect that writes state.
   * Stale hits can never show, because every read goes through these.
   */
  const term = open ? query.trim() : ''
  const isSearchable = term.length >= 2
  const hits = open && isSearchable ? rawHits : []

  useEffect(() => {
    if (!isSearchable) return

    const timer = setTimeout(() => {
      const id = ++requestId.current
      startTransition(async () => {
        const response = await searchSite(term)
        // Ignore responses that arrive after a newer keystroke.
        if (id !== requestId.current) return
        setRawHits(response.hits)
        setActiveIndex(response.hits.length ? 0 : -1)
      })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [term, isSearchable])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!term) return
    if (activeIndex >= 0 && hits[activeIndex]) {
      router.push(hits[activeIndex].href)
    } else {
      router.push(`/search?q=${encodeURIComponent(term)}`)
    }
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!hits.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % hits.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? hits.length - 1 : index - 1))
    }
  }

  // Preserve group order while keeping one flat index for keyboard navigation.
  const grouped = hits.reduce<{ group: SearchGroup; items: { hit: SearchHit; index: number }[] }[]>(
    (groups, hit, index) => {
      const existing = groups.find((entry) => entry.group === hit.group)
      if (existing) existing.items.push({ hit, index })
      else groups.push({ group: hit.group, items: [{ hit, index }] })
      return groups
    },
    [],
  )

  const showEmpty = isSearchable && !pending && hits.length === 0

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={open ? undefined : true}>
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        tabIndex={-1}
        className={`absolute inset-x-0 top-0 bg-paper transition-transform duration-[400ms] ease-(--ease-editorial) ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="shell py-6 md:py-8">
          <form onSubmit={submit} role="search" className="flex items-center gap-4 border-b border-line-strong pb-4">
            <Search className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" strokeWidth={1.25} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search gowns, designers, the journal…"
              aria-label="Search the site"
              autoComplete="off"
              className="flex-1 bg-transparent py-2 font-serif text-2xl placeholder:text-ink-muted/70 focus:outline-none md:text-3xl"
            />
            <button type="button" onClick={onClose} className="-mr-2 p-2 text-ink-soft hover:text-ink">
              <X className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
              <span className="sr-only">Close search</span>
            </button>
          </form>

          <div className="max-h-[65vh] overflow-y-auto overscroll-contain pt-6">
            <p aria-live="polite" className="sr-only">
              {pending ? 'Searching' : hits.length ? `${hits.length} results` : showEmpty ? 'No results' : ''}
            </p>

            {grouped.map(({ group, items }) => (
              <div key={group} className="mb-8 last:mb-0">
                <p className="mb-3 text-[0.625rem] font-medium tracking-[0.22em] text-taupe uppercase">
                  {GROUP_LABELS[group]}
                </p>
                <ul className="divide-y divide-line">
                  {items.map(({ hit, index }) => (
                    <li key={hit.id}>
                      <Link
                        href={hit.href}
                        onClick={onClose}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex items-center gap-4 py-3 transition-colors ${
                          index === activeIndex ? 'bg-ivory' : ''
                        }`}
                      >
                        {hit.image ? (
                          <Image
                            src={hit.image}
                            alt=""
                            width={48}
                            height={60}
                            className="h-15 w-12 shrink-0 object-cover"
                          />
                        ) : (
                          <span className="h-15 w-12 shrink-0 bg-ivory" aria-hidden="true" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate font-serif text-lg">{hit.title}</span>
                          {hit.meta ? (
                            <span className="block truncate text-xs tracking-wide text-ink-muted">{hit.meta}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {showEmpty ? (
              <p className="py-6 text-ink-soft">
                {`Nothing matched “${term}”. Try a designer name, a style code or a fabric.`}
              </p>
            ) : null}

            {isSearchable ? (
              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                onClick={onClose}
                className="link-quiet mt-2 inline-block text-[0.6875rem] tracking-[0.18em] uppercase"
              >
                See all results
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
