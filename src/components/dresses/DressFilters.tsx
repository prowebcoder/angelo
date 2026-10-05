'use client'

import Link from 'next/link'
import { SlidersHorizontal, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import {
  activeFilterCount,
  DRESS_SORT_OPTIONS,
  toggleFilterHref,
  type CatalogueFilters,
  type FilterParam,
  type RawSearchParams,
} from '@/lib/filters'

export type FilterOption = { value: string; label: string }
export type FilterGroupData = { param: FilterParam; label: string; options: FilterOption[] }

type Props = {
  groups: FilterGroupData[]
  filters: CatalogueFilters
  searchParams: RawSearchParams
  basePath: string
  totalCount: number
  /** Params fixed by a category route and therefore not offered as filters. */
  lockedParams?: FilterParam[]
}

/**
 * Catalogue filters.
 *
 * Every control is a real link, so filtering works without JavaScript, each
 * combination is shareable, and the back button behaves. Desktop shows a
 * sidebar; mobile uses a full-height sheet with focus trapping.
 */
export const DressFilters = ({ groups, filters, searchParams, basePath, totalCount, lockedParams = [] }: Props) => {
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  useFocusTrap(sheetRef, sheetOpen, () => setSheetOpen(false))

  const active = activeFilterCount(filters)
  const visibleGroups = groups.filter((group) => !lockedParams.includes(group.param) && group.options.length > 0)

  const body = (
    <div className="space-y-8">
      {visibleGroups.map((group) => {
        const selected = filters.selected[group.param] ?? []

        return (
          <fieldset key={group.param} className="border-0 p-0">
            <legend className="mb-3 text-[0.625rem] font-medium tracking-[0.22em] text-taupe uppercase">
              {group.label}
            </legend>
            <ul className="space-y-2">
              {group.options.map((option) => {
                const isOn = selected.includes(option.value)
                return (
                  <li key={option.value}>
                    <Link
                      href={toggleFilterHref(searchParams, group.param, option.value, basePath)}
                      scroll={false}
                      aria-pressed={isOn}
                      className="group flex items-center gap-3 py-0.5 text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-4 w-4 shrink-0 place-items-center border transition-colors ${
                          isOn ? 'border-ink bg-ink text-on-ink' : 'border-line-strong group-hover:border-ink'
                        }`}
                      >
                        {isOn ? (
                          <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden="true">
                            <path d="M1 3.5L3.5 6 8 1" fill="none" stroke="currentColor" strokeWidth="1.25" />
                          </svg>
                        ) : null}
                      </span>
                      <span className={isOn ? 'text-ink' : 'text-ink-soft group-hover:text-ink'}>{option.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )
      })}

      <fieldset className="border-0 p-0">
        <legend className="mb-3 text-[0.625rem] font-medium tracking-[0.22em] text-taupe uppercase">
          The boutique
        </legend>
        <ul className="space-y-2">
          {(
            [
              { param: 'sample-sale' as const, label: 'Sample sale and off the rack', on: filters.sampleSale },
              { param: 'most-loved' as const, label: 'Most loved', on: filters.mostLoved },
              { param: 'new-arrivals' as const, label: 'New arrivals', on: filters.newArrival },
            ]
          ).map((item) => (
            <li key={item.param}>
              <Link
                href={toggleFilterHref(searchParams, item.param, '1', basePath)}
                scroll={false}
                aria-pressed={item.on}
                className="group flex items-center gap-3 py-0.5 text-sm"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-4 w-4 shrink-0 place-items-center border transition-colors ${
                    item.on ? 'border-ink bg-ink text-on-ink' : 'border-line-strong group-hover:border-ink'
                  }`}
                >
                  {item.on ? (
                    <svg width="9" height="7" viewBox="0 0 9 7" aria-hidden="true">
                      <path d="M1 3.5L3.5 6 8 1" fill="none" stroke="currentColor" strokeWidth="1.25" />
                    </svg>
                  ) : null}
                </span>
                <span className={item.on ? 'text-ink' : 'text-ink-soft group-hover:text-ink'}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  )

  return (
    <>
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between gap-4 border-y border-line py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-2 text-[0.6875rem] font-medium tracking-[0.18em] uppercase"
          aria-expanded={sheetOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
          Filter
          {active > 0 ? <span className="bg-ink px-1.5 py-0.5 text-[0.5625rem] text-on-ink">{active}</span> : null}
        </button>
        <p className="text-sm text-ink-muted" aria-live="polite">
          {`${totalCount} ${totalCount === 1 ? 'gown' : 'gowns'}`}
        </p>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <p className="text-[0.6875rem] font-medium tracking-[0.18em] uppercase">Filter</p>
          {active > 0 ? (
            <Link href={basePath} scroll={false} className="link-quiet text-xs text-ink-muted hover:text-ink">
              Clear all
            </Link>
          ) : null}
        </div>
        {body}
      </div>

      {/* Mobile sheet */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sheetOpen ? '' : 'pointer-events-none'}`} aria-hidden={sheetOpen ? undefined : true}>
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSheetOpen(false)}
        />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filter gowns"
          tabIndex={-1}
          className={`absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col bg-paper transition-transform duration-[400ms] ease-(--ease-editorial) ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="font-serif text-xl">Filter</p>
            <button type="button" onClick={() => setSheetOpen(false)} className="-mr-2 p-2">
              <X className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
              <span className="sr-only">Close filters</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">{body}</div>

          <div className="flex items-center gap-3 border-t border-line px-5 py-4">
            <Link
              href={basePath}
              scroll={false}
              onClick={() => setSheetOpen(false)}
              className="flex-1 border border-line-strong py-3.5 text-center text-[0.625rem] font-medium tracking-[0.16em] uppercase"
            >
              Clear all
            </Link>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="flex-1 bg-ink py-3.5 text-center text-[0.625rem] font-medium tracking-[0.16em] text-on-ink uppercase"
            >
              {`Show ${totalCount}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/** Sort control; a form so it submits without JavaScript. */
export const DressSort = ({
  filters,
  searchParams,
  basePath,
}: {
  filters: CatalogueFilters
  searchParams: RawSearchParams
  basePath: string
}) => (
  <form action={basePath} className="flex items-center gap-2">
    {Object.entries(searchParams).map(([key, value]) =>
      key === 'sort' || key === 'page'
        ? null
        : (Array.isArray(value) ? value : [value])
            .filter((item): item is string => Boolean(item))
            .map((item) => <input key={`${key}-${item}`} type="hidden" name={key} value={item} />),
    )}
    <label htmlFor="dress-sort" className="text-[0.625rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
      Sort
    </label>
    <select
      id="dress-sort"
      name="sort"
      defaultValue={filters.sort}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="border-0 bg-transparent py-1 text-sm focus:outline-none"
    >
      {DRESS_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <noscript>
      <button type="submit" className="text-xs underline">
        Apply
      </button>
    </noscript>
  </form>
)
