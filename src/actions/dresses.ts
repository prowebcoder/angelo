'use server'

import { getDressesByIds } from '@/lib/queries'
import { designerName } from '@/lib/format'
import { resolveMedia } from '@/lib/media'

export type DressSummary = {
  id: number
  name: string
  slug: string
  designer?: string | null
  styleCode?: string | null
  image?: string | null
}

const MAX_IDS = 60

/**
 * Resolves dress IDs to display data.
 *
 * The wishlist and try-on list live in the visitor's browser, so the server
 * only learns which gowns they hold when asked. Reads are published-only and
 * bounded, so the action cannot be used to enumerate drafts.
 */
export const getDressSummaries = async (ids: number[]): Promise<DressSummary[]> => {
  const safeIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0))).slice(0, MAX_IDS)
  if (!safeIds.length) return []

  const dresses = await getDressesByIds(safeIds)

  return dresses.map((dress) => ({
    id: dress.id,
    name: dress.name,
    slug: dress.slug,
    designer: designerName(dress),
    styleCode: dress.styleCode ?? null,
    image: resolveMedia(dress.primaryImage)?.sizes?.card?.url ?? resolveMedia(dress.primaryImage)?.url ?? null,
  }))
}
