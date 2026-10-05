import type { Where } from 'payload'
import type { Designer, Dress, Event, Page, Post, RealBride } from '@/payload-types'
import { getPayloadClient } from './payload'

/**
 * Draft reads, for the preview routes only.
 *
 * Deliberately does **not** call `draftMode()`. Reading a request-time API
 * inside a route that Next.js renders statically raises
 * `DYNAMIC_SERVER_USAGE`, which turned any unknown URL under `/` into a 500
 * and made `notFound()` cache as a soft 404 (HTTP 200 with 404 content).
 *
 * So the split is by route instead of by cookie: the public pages use the
 * cached, published-only readers in `queries.ts` and stay fully static, while
 * `/preview/[collection]/[slug]` is explicitly dynamic and uses these. That
 * keeps request-time behaviour out of the cacheable paths entirely.
 */

export type PreviewCollection = 'pages' | 'dresses' | 'designers' | 'posts' | 'events' | 'real-brides'

/** Collection slugs that may be previewed, mapped to their public path. */
export const PREVIEW_PATHS: Record<PreviewCollection, string> = {
  pages: '',
  dresses: '/dress',
  designers: '/designers',
  posts: '/journal',
  events: '/events',
  'real-brides': '/real-brides',
}

export const isPreviewCollection = (value: string): value is PreviewCollection =>
  Object.prototype.hasOwnProperty.call(PREVIEW_PATHS, value)

/**
 * Reads the newest version of a document, published or not.
 *
 * `draft: true` asks Payload for the latest version rather than the published
 * one, and `overrideAccess` is safe here because the preview route has already
 * verified an authenticated Payload session.
 */
const findDraft = async <T>(collection: PreviewCollection, slug: string): Promise<T | null> => {
  const where: Where = { slug: { equals: slug } }
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection,
    where,
    draft: true,
    depth: 3,
    limit: 1,
    overrideAccess: true,
  })
  return (docs[0] as T | undefined) ?? null
}

export const findDraftPage = (slug: string) => findDraft<Page>('pages', slug)
export const findDraftDress = (slug: string) => findDraft<Dress>('dresses', slug)
export const findDraftDesigner = (slug: string) => findDraft<Designer>('designers', slug)
export const findDraftPost = (slug: string) => findDraft<Post>('posts', slug)
export const findDraftEvent = (slug: string) => findDraft<Event>('events', slug)
export const findDraftRealBride = (slug: string) => findDraft<RealBride>('real-brides', slug)
