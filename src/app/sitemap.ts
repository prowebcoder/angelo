import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { absoluteURL } from '@/lib/env'
import { INDEXABLE_CATEGORIES } from '@/lib/filters'

export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

/** Reads slugs plus last-modified dates for one collection. */
const collectionEntries = async (
  collection: 'pages' | 'dresses' | 'designers' | 'posts' | 'events' | 'real-brides',
  pathPrefix: string,
  options: { priority: number; changeFrequency: Entry['changeFrequency'] },
): Promise<Entry[]> => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection,
    where: { _status: { equals: 'published' } },
    depth: 0,
    limit: 5000,
    select: { slug: true, updatedAt: true },
  })

  return docs
    .filter((doc) => Boolean(doc.slug))
    .map((doc) => ({
      url: absoluteURL(`${pathPrefix}${doc.slug}`),
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      changeFrequency: options.changeFrequency,
      priority: options.priority,
    }))
}

/**
 * Dynamic sitemap.
 *
 * Covers every published entity plus the curated catalogue categories. Filter
 * permutations under `/dresses?…` are left out on purpose — they are
 * canonicalised to the plain listing and marked `noindex`, so advertising
 * them here would work against that.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const staticEntries: Entry[] = [
    { url: absoluteURL('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteURL('/dresses'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteURL('/designers'), changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteURL('/accessories'), changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteURL('/real-brides'), changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteURL('/events'), changeFrequency: 'weekly', priority: 0.6 },
    { url: absoluteURL('/journal'), changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteURL('/gift-card'), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const categoryEntries: Entry[] = Object.keys(INDEXABLE_CATEGORIES).map((category) => ({
    url: absoluteURL(`/dresses/${category}`),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const [pages, dresses, designers, posts, events, brides] = await Promise.all([
    collectionEntries('pages', '/', { priority: 0.7, changeFrequency: 'monthly' }),
    collectionEntries('dresses', '/dress/', { priority: 0.8, changeFrequency: 'weekly' }),
    collectionEntries('designers', '/designers/', { priority: 0.8, changeFrequency: 'monthly' }),
    collectionEntries('posts', '/journal/', { priority: 0.6, changeFrequency: 'monthly' }),
    collectionEntries('events', '/events/', { priority: 0.5, changeFrequency: 'weekly' }),
    collectionEntries('real-brides', '/real-brides/', { priority: 0.5, changeFrequency: 'monthly' }),
  ])

  // `home` is served at `/`, which is already listed above.
  const cmsPages = pages.filter((entry) => entry.url !== absoluteURL('/home'))

  return [...staticEntries, ...categoryEntries, ...cmsPages, ...dresses, ...designers, ...posts, ...events, ...brides]
}

export default sitemap
