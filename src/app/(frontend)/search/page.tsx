import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { searchSite } from '@/actions/search'
import { GROUP_LABELS, type SearchGroup, type SearchHit } from '@/lib/search-shared'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'
import type { RawSearchParams } from '@/lib/filters'

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: 'Search',
    fallbackDescription: 'Search gowns, designers, accessories, events and the journal.',
    path: '/search',
    settings,
    // A results page has nothing stable to index.
    noIndex: true,
  })
}

/**
 * Search results page.
 *
 * The overlay handles quick look-ups; this is the shareable, deep-linkable
 * view with more results per group.
 */
const SearchPage = async ({ searchParams }: { searchParams: Promise<RawSearchParams> }) => {
  const params = await searchParams
  const query = (typeof params.q === 'string' ? params.q : '').trim()
  const { hits } = query ? await searchSite(query, 20) : { hits: [] as SearchHit[] }

  const grouped = hits.reduce<{ group: SearchGroup; items: SearchHit[] }[]>((groups, hit) => {
    const existing = groups.find((entry) => entry.group === hit.group)
    if (existing) existing.items.push(hit)
    else groups.push({ group: hit.group, items: [hit] })
    return groups
  }, [])

  return (
    <Section spacing="tight" className="pb-(--spacing-section)">
      <div className="shell">
        <Breadcrumbs crumbs={[{ name: 'Search', href: '/search' }]} className="mb-6" />

        <h1 className="text-h2">{query ? `Results for “${query}”` : 'Search'}</h1>
        <p className="mt-4 text-ink-muted" aria-live="polite">
          {query
            ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}`
            : 'Use the search icon in the header to look for a gown, a designer or an article.'}
        </p>

        {/* A plain form keeps the page usable without JavaScript. */}
        <form action="/search" role="search" className="mt-8 flex max-w-xl items-center gap-4 border-b border-line-strong pb-3">
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Gowns, designers, the journal…"
            className="flex-1 bg-transparent py-2 font-serif text-xl placeholder:text-ink-muted/70 focus:outline-none"
          />
          <button type="submit" className="text-[0.625rem] font-medium tracking-[0.18em] uppercase">
            Search
          </button>
        </form>

        {grouped.length ? (
          <div className="mt-14 space-y-14">
            {grouped.map(({ group, items }) => (
              <section key={group}>
                <h2 className="mb-5 text-[0.625rem] font-medium tracking-[0.22em] text-taupe uppercase">
                  {GROUP_LABELS[group]}
                </h2>
                <ul className="divide-y divide-line border-t border-line">
                  {items.map((hit) => (
                    <li key={hit.id}>
                      <Link href={hit.href} className="group flex items-center gap-5 py-4">
                        {hit.image ? (
                          <Image
                            src={hit.image}
                            alt=""
                            width={64}
                            height={80}
                            className="h-20 w-16 shrink-0 object-cover"
                          />
                        ) : (
                          <span className="h-20 w-16 shrink-0 bg-ivory" aria-hidden="true" />
                        )}
                        <span className="min-w-0">
                          <span className="block font-serif text-xl group-hover:text-taupe">{hit.title}</span>
                          {hit.meta ? (
                            <span className="block text-xs tracking-wide text-ink-muted">{hit.meta}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : query ? (
          <div className="mt-14 max-w-xl">
            <p className="text-ink-soft">
              {`Nothing matched “${query}”. Try a designer name, a style code, or a fabric such as lace or satin.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/dresses">Browse all gowns</ButtonLink>
              <ButtonLink href="/designers" variant="secondary">
                See the designers
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  )
}

export default SearchPage
