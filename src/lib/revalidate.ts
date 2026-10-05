import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'
import { CACHE_TAGS, COLLECTION_TAGS, type CacheTag } from './cache'

const invalidate = (tag: CacheTag) => {
  try {
    // 'max' keeps serving the previous value while the new one is generated.
    revalidateTag(tag, 'max')
  } catch {
    // Payload also runs outside a request scope (seeding, CLI, migrations),
    // where revalidation is unavailable and unnecessary.
  }
}

/** Invalidates the frontend cache tag for the collection that changed. */
export const revalidateCollection: CollectionAfterChangeHook = ({ collection, doc }) => {
  const tag = COLLECTION_TAGS[collection.slug]
  if (tag) invalidate(tag)
  return doc
}

export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({ collection, doc }) => {
  const tag = COLLECTION_TAGS[collection.slug]
  if (tag) invalidate(tag)
  return doc
}

/** Globals (settings, navigation, footer, homepage) all share one tag. */
export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  invalidate(CACHE_TAGS.globals)
  return doc
}
