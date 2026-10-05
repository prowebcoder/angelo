import type { Metadata } from 'next'
import Link from 'next/link'
import { JournalGrid } from '@/components/journal/JournalCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section } from '@/components/ui/Section'
import { getPosts, getSiteSettings, getTaxonomiesOfKind } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'
import type { RawSearchParams } from '@/lib/filters'

export const revalidate = 3600

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}): Promise<Metadata> => {
  const [params, settings, categories] = await Promise.all([
    searchParams,
    getSiteSettings(),
    getTaxonomiesOfKind('journal-category'),
  ])

  const categorySlug = typeof params.category === 'string' ? params.category : undefined
  const category = categories.find((term) => term.slug === categorySlug)

  return buildMetadata({
    fallbackTitle: category ? `${category.name} — The bridal journal` : 'The bridal journal',
    fallbackDescription:
      'Practical guidance on appointments, silhouettes, fabrics and alterations, and notes from the boutique.',
    path: category ? `/journal?category=${category.slug}` : '/journal',
    settings,
    // One canonical listing; category views are navigation, not landing pages.
    noIndex: Boolean(category),
  })
}

const JournalPage = async ({ searchParams }: { searchParams: Promise<RawSearchParams> }) => {
  const params = await searchParams
  const categorySlug = typeof params.category === 'string' ? params.category : undefined

  const [posts, categories] = await Promise.all([
    getPosts({ limit: 36, categorySlug }),
    getTaxonomiesOfKind('journal-category'),
  ])

  const activeCategory = categories.find((term) => term.slug === categorySlug)

  return (
    <Section spacing="tight" className="pb-(--spacing-section)">
      <div className="shell">
        <Breadcrumbs
          crumbs={[
            { name: 'Journal', href: '/journal' },
            ...(activeCategory ? [{ name: activeCategory.name, href: `/journal?category=${activeCategory.slug}` }] : []),
          ]}
          className="mb-6"
        />
        <h1 className="text-h1">The bridal journal</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Appointments, silhouettes, fabrics and alterations — what we find ourselves explaining most often.
        </p>

        {categories.length ? (
          <nav aria-label="Journal categories" className="mt-10 border-y border-line py-3">
            <ul className="no-scrollbar flex gap-5 overflow-x-auto text-[0.6875rem] tracking-[0.18em] uppercase">
              <li>
                <Link
                  href="/journal"
                  aria-current={!categorySlug ? 'page' : undefined}
                  className={`whitespace-nowrap ${!categorySlug ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
                >
                  Everything
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/journal?category=${category.slug}`}
                    aria-current={categorySlug === category.slug ? 'page' : undefined}
                    className={`whitespace-nowrap ${
                      categorySlug === category.slug ? 'text-ink' : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-14">
          <JournalGrid
            posts={posts}
            emptyMessage={
              activeCategory
                ? `Nothing in ${activeCategory.name} yet.`
                : 'The first journal entries are being written.'
            }
          />
        </div>
      </div>
    </Section>
  )
}

export default JournalPage
