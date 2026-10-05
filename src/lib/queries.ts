import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'
import type {
  Designer,
  Dress,
  Event,
  Faq,
  FormSetting,
  Footer as FooterGlobal,
  Homepage,
  Navigation,
  Page,
  Post,
  RealBride,
  SiteSetting,
  Taxonomy,
  Accessory,
} from '@/payload-types'
import { CACHE_TAGS, CMS_REVALIDATE_SECONDS } from './cache'
import { getPayloadClient } from './payload'

/**
 * Payload's Local API runs with `overrideAccess: true` by default, so public
 * reads must exclude drafts explicitly rather than relying on access control.
 */
const PUBLISHED: Where = { _status: { equals: 'published' } }

const and = (...clauses: (Where | undefined)[]): Where => {
  const filtered = clauses.filter((clause): clause is Where => Boolean(clause))
  return filtered.length === 1 ? filtered[0] : { and: filtered }
}

/** Wraps a read in the data cache under one tag, with a background refresh. */
const cached = <Args extends unknown[], Result>(
  keyParts: string[],
  tag: string,
  fn: (...args: Args) => Promise<Result>,
) => unstable_cache(fn, keyParts, { tags: [tag], revalidate: CMS_REVALIDATE_SECONDS })

/* -------------------------------------------------------------------------- */
/* Globals                                                                    */
/* -------------------------------------------------------------------------- */

export const getSiteSettings = cached(
  ['site-settings'],
  CACHE_TAGS.globals,
  async (): Promise<SiteSetting> => {
    const payload = await getPayloadClient()
    return payload.findGlobal({ slug: 'site-settings', depth: 2 })
  },
)

export const getNavigation = cached(['navigation'], CACHE_TAGS.globals, async (): Promise<Navigation> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'navigation', depth: 1 })
})

export const getFooterContent = cached(['footer'], CACHE_TAGS.globals, async (): Promise<FooterGlobal> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'footer', depth: 1 })
})

export const getHomepage = cached(['homepage'], CACHE_TAGS.globals, async (): Promise<Homepage> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'homepage', depth: 3 })
})

export const getFormSettings = cached(['form-settings'], CACHE_TAGS.globals, async (): Promise<FormSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'form-settings', depth: 1 })
})

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export const getPageBySlug = cached(
  ['page-by-slug'],
  CACHE_TAGS.pages,
  async (slug: string): Promise<Page | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'pages',
      where: and(PUBLISHED, { slug: { equals: slug } }),
      depth: 3,
      limit: 1,
    })
    return docs[0] ?? null
  },
)

export const getPageSlugs = cached(['page-slugs'], CACHE_TAGS.pages, async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    where: PUBLISHED,
    depth: 0,
    limit: 500,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug).filter(Boolean)
})

/* -------------------------------------------------------------------------- */
/* Taxonomy                                                                   */
/* -------------------------------------------------------------------------- */

export type TaxonomyKind = Taxonomy['kind']

export const getTaxonomies = cached(['taxonomies'], CACHE_TAGS.taxonomies, async (): Promise<Taxonomy[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'taxonomies',
    where: { published: { equals: true } },
    sort: ['displayOrder', 'name'],
    depth: 0,
    limit: 1000,
  })
  return docs
})

/** Terms grouped by kind, for filter panels and mega-menu columns. */
export const getTaxonomyGroups = async (): Promise<Record<string, Taxonomy[]>> => {
  const all = await getTaxonomies()
  return all.reduce<Record<string, Taxonomy[]>>((groups, term) => {
    const key = term.kind
    groups[key] = groups[key] ? [...groups[key], term] : [term]
    return groups
  }, {})
}

export const getTaxonomiesOfKind = async (kind: TaxonomyKind): Promise<Taxonomy[]> => {
  const all = await getTaxonomies()
  return all.filter((term) => term.kind === kind)
}

export const getTaxonomyBySlug = async (slug: string): Promise<Taxonomy | null> => {
  const all = await getTaxonomies()
  return all.find((term) => term.slug === slug) ?? null
}

/* -------------------------------------------------------------------------- */
/* Designers                                                                  */
/* -------------------------------------------------------------------------- */

export const getDesigners = cached(['designers'], CACHE_TAGS.designers, async (): Promise<Designer[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'designers',
    where: PUBLISHED,
    sort: ['displayOrder', 'name'],
    depth: 1,
    limit: 200,
  })
  return docs
})

export const getDesignerBySlug = cached(
  ['designer-by-slug'],
  CACHE_TAGS.designers,
  async (slug: string): Promise<Designer | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'designers',
      where: and(PUBLISHED, { slug: { equals: slug } }),
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  },
)

/* -------------------------------------------------------------------------- */
/* Dresses                                                                    */
/* -------------------------------------------------------------------------- */

/** One taxonomy filter group: a dress relationship field and chosen slugs. */
export type TaxonomyFilter = { field: string; slugs: string[] }

export type DressQuery = {
  designers?: string[]
  taxonomies?: TaxonomyFilter[]
  search?: string
  sampleSale?: boolean
  mostLoved?: boolean
  newArrival?: boolean
  sort?: string
  page?: number
  limit?: number
}

export type DressResults = {
  docs: Dress[]
  totalDocs: number
  totalPages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
}

const SORT_MAP: Record<string, string[]> = {
  newest: ['-createdAt'],
  name: ['name'],
  'price-asc': ['price'],
  'price-desc': ['-price'],
}

/**
 * Catalogue query. Designer and taxonomy filters arrive as slugs from the URL
 * and are resolved to IDs, so a shared link always reproduces the same results.
 */
export const queryDresses = cached(
  ['dresses-query'],
  CACHE_TAGS.dresses,
  async (query: DressQuery): Promise<DressResults> => {
    const payload = await getPayloadClient()
    const clauses: Where[] = [PUBLISHED]

    if (query.designers?.length) {
      const { docs } = await payload.find({
        collection: 'designers',
        where: { slug: { in: query.designers } },
        depth: 0,
        limit: 100,
        select: { slug: true },
      })
      // An unmatched slug must return nothing rather than silently widening.
      clauses.push({ designer: { in: docs.length ? docs.map((doc) => doc.id) : [-1] } })
    }

    if (query.taxonomies?.length) {
      const allSlugs = Array.from(new Set(query.taxonomies.flatMap((group) => group.slugs)))
      const { docs } = await payload.find({
        collection: 'taxonomies',
        where: { slug: { in: allSlugs } },
        depth: 0,
        limit: 500,
        select: { slug: true },
      })
      const idBySlug = new Map(docs.map((doc) => [doc.slug, doc.id]))

      // Across groups the filters narrow (AND); within a group any term
      // matches (OR), which is how shoppers expect facets to behave.
      for (const group of query.taxonomies) {
        const ids = group.slugs.map((slug) => idBySlug.get(slug) ?? -1)
        clauses.push({ [group.field]: { in: ids } })
      }
    }

    const term = query.search?.trim()
    if (term) {
      clauses.push({
        or: [
          { name: { like: term } },
          { styleCode: { like: term } },
          { collection: { like: term } },
          { description: { like: term } },
        ],
      })
    }

    if (query.sampleSale) clauses.push({ sampleSale: { equals: true } })
    if (query.mostLoved) clauses.push({ mostLoved: { equals: true } })
    if (query.newArrival) clauses.push({ newArrival: { equals: true } })

    const result = await payload.find({
      collection: 'dresses',
      where: and(...clauses),
      sort: SORT_MAP[query.sort ?? 'newest'] ?? SORT_MAP.newest,
      depth: 1,
      limit: query.limit ?? 24,
      page: query.page ?? 1,
    })

    return {
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? 1,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
    }
  },
)

export const getDressBySlug = cached(
  ['dress-by-slug'],
  CACHE_TAGS.dresses,
  async (slug: string): Promise<Dress | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'dresses',
      where: and(PUBLISHED, { slug: { equals: slug } }),
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  },
)

export const getDressesByIds = cached(
  ['dresses-by-ids'],
  CACHE_TAGS.dresses,
  async (ids: number[]): Promise<Dress[]> => {
    if (!ids.length) return []
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'dresses',
      where: and(PUBLISHED, { id: { in: ids } }),
      depth: 1,
      limit: ids.length,
    })
    // Preserve the caller's order: wishlist and try-on lists are ordered.
    const byId = new Map(docs.map((doc) => [doc.id, doc]))
    return ids.map((id) => byId.get(id)).filter((doc): doc is Dress => Boolean(doc))
  },
)

export const getRelatedDresses = cached(
  ['related-dresses'],
  CACHE_TAGS.dresses,
  async (dressId: number, designerId: number, limit: number = 4): Promise<Dress[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'dresses',
      where: and(PUBLISHED, { designer: { equals: designerId } }, { id: { not_equals: dressId } }),
      depth: 1,
      limit,
    })
    return docs
  },
)

export const getDressesForDesigner = cached(
  ['dresses-for-designer'],
  CACHE_TAGS.dresses,
  async (designerId: number, limit: number = 48): Promise<Dress[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'dresses',
      where: and(PUBLISHED, { designer: { equals: designerId } }),
      depth: 1,
      limit,
    })
    return docs
  },
)

export const getDressSlugs = cached(['dress-slugs'], CACHE_TAGS.dresses, async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'dresses',
    where: PUBLISHED,
    depth: 0,
    limit: 2000,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug).filter(Boolean)
})

export const getFlaggedDresses = cached(
  ['flagged-dresses'],
  CACHE_TAGS.dresses,
  async (
    flag: 'featured' | 'mostLoved' | 'newArrival' | 'sampleSale',
    limit: number = 8,
  ): Promise<Dress[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'dresses',
      where: and(PUBLISHED, { [flag]: { equals: true } }),
      depth: 1,
      limit,
    })
    return docs
  },
)

export const getDressCount = cached(['dress-count'], CACHE_TAGS.dresses, async (): Promise<number> => {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.count({ collection: 'dresses', where: PUBLISHED })
  return totalDocs
})

/* -------------------------------------------------------------------------- */
/* Accessories                                                                */
/* -------------------------------------------------------------------------- */

export const getAccessories = cached(
  ['accessories'],
  CACHE_TAGS.accessories,
  async (limit: number = 60): Promise<Accessory[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'accessories',
      where: PUBLISHED,
      depth: 2,
      limit,
      sort: ['name'],
    })
    return docs
  },
)

export const getFeaturedAccessories = cached(
  ['featured-accessories'],
  CACHE_TAGS.accessories,
  async (limit: number = 4): Promise<Accessory[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'accessories',
      where: and(PUBLISHED, { featured: { equals: true } }),
      depth: 1,
      limit,
    })
    return docs
  },
)

/* -------------------------------------------------------------------------- */
/* Real brides                                                                */
/* -------------------------------------------------------------------------- */

export const getRealBrides = cached(
  ['real-brides'],
  CACHE_TAGS.realBrides,
  async (limit: number = 60): Promise<RealBride[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'real-brides',
      where: PUBLISHED,
      sort: ['-weddingDate'],
      depth: 1,
      limit,
    })
    return docs
  },
)

export const getRealBrideBySlug = cached(
  ['real-bride-by-slug'],
  CACHE_TAGS.realBrides,
  async (slug: string): Promise<RealBride | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'real-brides',
      where: and(PUBLISHED, { slug: { equals: slug } }),
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  },
)

export const getRealBrideSlugs = cached(
  ['real-bride-slugs'],
  CACHE_TAGS.realBrides,
  async (): Promise<string[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'real-brides',
      where: PUBLISHED,
      depth: 0,
      limit: 500,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter(Boolean)
  },
)

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export const getEvents = cached(['events'], CACHE_TAGS.events, async (limit: number = 100): Promise<Event[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: PUBLISHED,
    sort: ['startDate'],
    depth: 1,
    limit,
  })
  return docs
})

export const getEventBySlug = cached(
  ['event-by-slug'],
  CACHE_TAGS.events,
  async (slug: string): Promise<Event | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'events',
      where: and(PUBLISHED, { slug: { equals: slug } }),
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  },
)

export const getEventSlugs = cached(['event-slugs'], CACHE_TAGS.events, async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: PUBLISHED,
    depth: 0,
    limit: 500,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug).filter(Boolean)
})

/* -------------------------------------------------------------------------- */
/* Journal                                                                    */
/* -------------------------------------------------------------------------- */

export const getPosts = cached(
  ['posts'],
  CACHE_TAGS.posts,
  async (options: { limit?: number; categorySlug?: string } = {}): Promise<Post[]> => {
    const payload = await getPayloadClient()
    const clauses: Where[] = [PUBLISHED]

    if (options.categorySlug) {
      const { docs } = await payload.find({
        collection: 'taxonomies',
        where: { slug: { equals: options.categorySlug } },
        depth: 0,
        limit: 1,
      })
      clauses.push({ category: { equals: docs[0]?.id ?? -1 } })
    }

    const { docs } = await payload.find({
      collection: 'posts',
      where: and(...clauses),
      sort: ['-publishedAt', '-createdAt'],
      depth: 1,
      limit: options.limit ?? 24,
    })
    return docs
  },
)

export const getPostBySlug = cached(
  ['post-by-slug'],
  CACHE_TAGS.posts,
  async (slug: string): Promise<Post | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'posts',
      where: and(PUBLISHED, { slug: { equals: slug } }),
      depth: 2,
      limit: 1,
    })
    return docs[0] ?? null
  },
)

export const getPostSlugs = cached(['post-slugs'], CACHE_TAGS.posts, async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: PUBLISHED,
    depth: 0,
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((doc) => doc.slug).filter(Boolean)
})

/* -------------------------------------------------------------------------- */
/* FAQs                                                                       */
/* -------------------------------------------------------------------------- */

export const getFaqs = cached(['faqs'], CACHE_TAGS.faqs, async (): Promise<Faq[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faqs',
    where: PUBLISHED,
    sort: ['displayOrder'],
    depth: 1,
    limit: 200,
  })
  return docs
})

export const getFaqsByIds = cached(['faqs-by-ids'], CACHE_TAGS.faqs, async (ids: number[]): Promise<Faq[]> => {
  if (!ids.length) return []
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faqs',
    where: and(PUBLISHED, { id: { in: ids } }),
    sort: ['displayOrder'],
    depth: 1,
    limit: ids.length,
  })
  return docs
})
