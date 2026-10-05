import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CollectionExplorer } from '@/components/dresses/CollectionExplorer'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section } from '@/components/ui/Section'
import { getDressCount, getSiteSettings } from '@/lib/queries'
import { hasActiveFilters, parseFilters, type RawSearchParams } from '@/lib/filters'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}): Promise<Metadata> => {
  const [params, settings] = await Promise.all([searchParams, getSiteSettings()])
  const filters = parseFilters(params)

  return buildMetadata({
    fallbackTitle: 'Wedding dresses',
    fallbackDescription:
      'Browse the gowns in the boutique by designer, silhouette, fabric and detail, and save the ones you would like to try.',
    path: '/dresses',
    settings,
    // Filter permutations are endless; only the clean listing is indexed, and
    // the canonical above always points back to it.
    noIndex: hasActiveFilters(filters),
  })
}

const DressesPage = async ({ searchParams }: { searchParams: Promise<RawSearchParams> }) => {
  const [params, total] = await Promise.all([searchParams, getDressCount()])

  return (
    <>
      <Section spacing="tight">
        <div className="shell">
          <Breadcrumbs crumbs={[{ name: 'Wedding dresses', href: '/dresses' }]} className="mb-6" />
          <h1 className="text-h1">Wedding dresses</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {total > 0
              ? `${total} gowns in the boutique. Filter by designer, silhouette or fabric, and save the ones you would like to try.`
              : 'The collection is being added. Come back shortly, or book an appointment and we will show you what is in store.'}
          </p>
        </div>
      </Section>

      <div className="shell pb-(--spacing-section)">
        {/*
          Filters live in the URL, so this subtree re-renders per query. The
          boundary keeps the heading above it static.
        */}
        <Suspense fallback={<p className="py-16 text-center text-ink-muted">Loading the collection…</p>}>
          <CollectionExplorer searchParams={params} basePath="/dresses" />
        </Suspense>
      </div>
    </>
  )
}

export default DressesPage
