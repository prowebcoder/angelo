import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { CollectionExplorer } from '@/components/dresses/CollectionExplorer'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section } from '@/components/ui/Section'
import { getSiteSettings } from '@/lib/queries'
import {
  categoryFiltersToSearchParams,
  INDEXABLE_CATEGORIES,
  type FilterParam,
  type RawSearchParams,
} from '@/lib/filters'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

/**
 * Curated, indexable category pages.
 *
 * Only the combinations defined in `INDEXABLE_CATEGORIES` get a real URL — the
 * rest of the filter space stays behind query parameters on `/dresses`, which
 * are canonicalised and not indexed. That keeps a crawlable, finite set of
 * landing pages instead of an unbounded one.
 */
export const generateStaticParams = async () =>
  Object.keys(INDEXABLE_CATEGORIES).map((category) => ({ category }))

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> => {
  const { category } = await params
  const entry = INDEXABLE_CATEGORIES[category]
  if (!entry) return {}

  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: entry.title,
    fallbackDescription: entry.description,
    path: `/dresses/${category}`,
    settings,
  })
}

const CategoryPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<RawSearchParams>
}) => {
  const [{ category }, query] = await Promise.all([params, searchParams])
  const entry = INDEXABLE_CATEGORIES[category]

  if (!entry) notFound()

  // The route's own filters are fixed; anything else the visitor picks is
  // layered on top from the query string.
  const fixed = categoryFiltersToSearchParams(category)
  const merged: RawSearchParams = { ...query, ...fixed }
  const lockedParams = Object.keys(entry.filters) as FilterParam[]

  return (
    <>
      <Section spacing="tight">
        <div className="shell">
          <Breadcrumbs
            crumbs={[
              { name: 'Wedding dresses', href: '/dresses' },
              { name: entry.title, href: `/dresses/${category}` },
            ]}
            className="mb-6"
          />
          <h1 className="text-h1">{entry.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{entry.description}</p>
        </div>
      </Section>

      <div className="shell pb-(--spacing-section)">
        <Suspense fallback={<p className="py-16 text-center text-ink-muted">Loading the collection…</p>}>
          <CollectionExplorer
            searchParams={merged}
            basePath={`/dresses/${category}`}
            lockedParams={lockedParams}
          />
        </Suspense>
      </div>
    </>
  )
}

export default CategoryPage
