import Link from 'next/link'
import { getDesigners, queryDresses, getTaxonomyGroups } from '@/lib/queries'
import {
  FILTER_GROUPS,
  pageHref,
  parseFilters,
  toDressQuery,
  type FilterParam,
  type RawSearchParams,
} from '@/lib/filters'
import { DressFilters, DressSort, type FilterGroupData } from './DressFilters'
import { DressGrid } from './DressGrid'

type Props = {
  searchParams: RawSearchParams
  /** Path filters link back to, e.g. `/dresses` or `/dresses/lace`. */
  basePath: string
  /** Filters fixed by the route, hidden from the panel but still applied. */
  lockedParams?: FilterParam[]
  perPage?: number
}

/**
 * The single catalogue surface, reused by `/dresses`, every category route and
 * any page-builder block that needs a browsable grid.
 *
 * The reference site repeats its filter UI on unrelated pages; here one
 * component owns filtering, counting and pagination.
 */
export const CollectionExplorer = async ({ searchParams, basePath, lockedParams = [], perPage = 24 }: Props) => {
  const filters = parseFilters(searchParams)
  const [results, designers, taxonomies] = await Promise.all([
    queryDresses(toDressQuery(filters, perPage)),
    getDesigners(),
    getTaxonomyGroups(),
  ])

  const groups: FilterGroupData[] = [
    {
      param: 'designer' as const,
      label: 'Designer',
      options: designers.map((designer) => ({ value: designer.slug, label: designer.name })),
    },
    ...FILTER_GROUPS.map((group) => ({
      param: group.param,
      label: group.label,
      options: (taxonomies[group.kind] ?? []).map((term) => ({ value: term.slug, label: term.name })),
    })),
  ].filter((group) => group.options.length > 0)

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12 xl:gap-16">
      <aside aria-label="Filter gowns" className="lg:sticky lg:top-40 lg:self-start">
        <DressFilters
          groups={groups}
          filters={filters}
          searchParams={searchParams}
          basePath={basePath}
          totalCount={results.totalDocs}
          lockedParams={lockedParams}
        />
      </aside>

      <div>
        <div className="mb-8 hidden items-baseline justify-between gap-6 border-b border-line pb-4 lg:flex">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {`${results.totalDocs} ${results.totalDocs === 1 ? 'gown' : 'gowns'}`}
            {filters.search ? ` matching “${filters.search}”` : ''}
          </p>
          <DressSort filters={filters} searchParams={searchParams} basePath={basePath} />
        </div>

        <DressGrid
          dresses={results.docs}
          columns={3}
          priorityCount={3}
          emptyMessage="No gowns match these filters. Try removing one, or ask Angelo for a recommendation."
        />

        {results.totalPages > 1 ? (
          <nav aria-label="Catalogue pages" className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-6">
            {results.hasPrevPage ? (
              <Link
                href={pageHref(searchParams, results.page - 1, basePath)}
                className="link-quiet text-[0.6875rem] tracking-[0.18em] uppercase"
                rel="prev"
              >
                Previous
              </Link>
            ) : (
              <span className="text-[0.6875rem] tracking-[0.18em] text-ink-muted/50 uppercase">Previous</span>
            )}

            <p className="text-xs text-ink-muted">{`Page ${results.page} of ${results.totalPages}`}</p>

            {results.hasNextPage ? (
              <Link
                href={pageHref(searchParams, results.page + 1, basePath)}
                className="link-quiet text-[0.6875rem] tracking-[0.18em] uppercase"
                rel="next"
              >
                Next
              </Link>
            ) : (
              <span className="text-[0.6875rem] tracking-[0.18em] text-ink-muted/50 uppercase">Next</span>
            )}
          </nav>
        ) : null}
      </div>
    </div>
  )
}
