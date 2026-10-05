'use server'

import type { Where } from 'payload'
import { getPayloadClient } from '@/lib/payload'
import { resolveMedia } from '@/lib/media'
import { designerName } from '@/lib/format'
import type { SearchHit, SearchResponse } from '@/lib/search-shared'

const PUBLISHED: Where = { _status: { equals: 'published' } }
const MIN_QUERY_LENGTH = 2

/**
 * Global search across the published catalogue and editorial content.
 *
 * A Server Action rather than a route handler: Payload already owns `/api/*`,
 * and this keeps one typed call site for the overlay and the results page.
 */
export const searchSite = async (rawQuery: string, limitPerGroup = 5): Promise<SearchResponse> => {
  const query = rawQuery.trim().slice(0, 100)
  if (query.length < MIN_QUERY_LENGTH) return { query, hits: [], total: 0 }

  const payload = await getPayloadClient()
  const limit = Math.min(Math.max(limitPerGroup, 1), 20)

  const [dresses, designers, posts, accessories, events] = await Promise.all([
    payload.find({
      collection: 'dresses',
      where: {
        and: [
          PUBLISHED,
          {
            or: [
              { name: { like: query } },
              { styleCode: { like: query } },
              { collection: { like: query } },
              { description: { like: query } },
            ],
          },
        ],
      },
      depth: 1,
      limit,
    }),
    payload.find({
      collection: 'designers',
      where: { and: [PUBLISHED, { or: [{ name: { like: query } }, { description: { like: query } }] }] },
      depth: 1,
      limit,
    }),
    payload.find({
      collection: 'posts',
      where: { and: [PUBLISHED, { or: [{ title: { like: query } }, { excerpt: { like: query } }] }] },
      depth: 1,
      limit,
    }),
    payload.find({
      collection: 'accessories',
      where: { and: [PUBLISHED, { or: [{ name: { like: query } }, { description: { like: query } }] }] },
      depth: 1,
      limit,
    }),
    payload.find({
      collection: 'events',
      where: { and: [PUBLISHED, { or: [{ title: { like: query } }, { shortDescription: { like: query } }] }] },
      depth: 1,
      limit,
    }),
  ])

  const hits: SearchHit[] = [
    ...dresses.docs.map((dress) => ({
      id: `dress-${dress.id}`,
      group: 'dresses' as const,
      title: dress.name,
      meta: [designerName(dress), dress.styleCode].filter(Boolean).join(' · ') || undefined,
      href: `/dress/${dress.slug}`,
      image: resolveMedia(dress.primaryImage)?.sizes?.thumbnail?.url ?? resolveMedia(dress.primaryImage)?.url ?? undefined,
    })),
    ...designers.docs.map((designer) => ({
      id: `designer-${designer.id}`,
      group: 'designers' as const,
      title: designer.name,
      href: `/designers/${designer.slug}`,
      image: resolveMedia(designer.logo ?? designer.heroImage)?.url ?? undefined,
    })),
    ...accessories.docs.map((accessory) => ({
      id: `accessory-${accessory.id}`,
      group: 'accessories' as const,
      title: accessory.name,
      href: `/accessories#${accessory.slug}`,
      image: resolveMedia(accessory.image)?.sizes?.thumbnail?.url ?? resolveMedia(accessory.image)?.url ?? undefined,
    })),
    ...posts.docs.map((post) => ({
      id: `post-${post.id}`,
      group: 'journal' as const,
      title: post.title,
      href: `/journal/${post.slug}`,
      image: resolveMedia(post.featuredImage)?.sizes?.thumbnail?.url ?? undefined,
    })),
    ...events.docs.map((event) => ({
      id: `event-${event.id}`,
      group: 'events' as const,
      title: event.title,
      href: `/events/${event.slug}`,
      image: resolveMedia(event.heroImage)?.sizes?.thumbnail?.url ?? undefined,
    })),
  ]

  return {
    query,
    hits,
    total:
      dresses.totalDocs + designers.totalDocs + posts.totalDocs + accessories.totalDocs + events.totalDocs,
  }
}
