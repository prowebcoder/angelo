/**
 * Cache tags for CMS-driven data.
 *
 * Every read helper caches under one of these tags; Payload `afterChange`/
 * `afterDelete` hooks invalidate the matching tag so published edits appear
 * without a redeploy. See `src/lib/revalidate.ts`.
 */
export const CACHE_TAGS = {
  globals: 'globals',
  pages: 'pages',
  dresses: 'dresses',
  designers: 'designers',
  taxonomies: 'taxonomies',
  accessories: 'accessories',
  realBrides: 'real-brides',
  events: 'events',
  posts: 'posts',
  faqs: 'faqs',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

/** Collections whose edits should invalidate a frontend cache tag. */
export const COLLECTION_TAGS: Record<string, CacheTag> = {
  pages: CACHE_TAGS.pages,
  dresses: CACHE_TAGS.dresses,
  designers: CACHE_TAGS.designers,
  taxonomies: CACHE_TAGS.taxonomies,
  accessories: CACHE_TAGS.accessories,
  'real-brides': CACHE_TAGS.realBrides,
  events: CACHE_TAGS.events,
  posts: CACHE_TAGS.posts,
  faqs: CACHE_TAGS.faqs,
  media: CACHE_TAGS.globals,
}

/**
 * How long a cached CMS read may be served before it is refreshed in the
 * background. Tag invalidation handles edits; this is only a safety net.
 */
export const CMS_REVALIDATE_SECONDS = 3600
