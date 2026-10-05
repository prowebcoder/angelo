'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'

export type ListName = 'wishlist' | 'tryOn'

const STORAGE_KEYS: Record<ListName, string> = {
  wishlist: 'angelo.wishlist',
  tryOn: 'angelo.tryOn',
}

type SavedListsValue = {
  /** Dress IDs, most recently added last. */
  wishlist: number[]
  tryOn: number[]
  /** False during server render and the first client paint. */
  ready: boolean
  has: (list: ListName, id: number) => boolean
  toggle: (list: ListName, id: number) => void
  remove: (list: ListName, id: number) => void
  clear: (list: ListName) => void
}

const SavedListsContext = createContext<SavedListsValue | null>(null)

const EMPTY: number[] = []

/* -------------------------------------------------------------------------- */
/* localStorage as an external store                                          */
/*                                                                            */
/* Modelled with `useSyncExternalStore` rather than `useState` + an effect:    */
/* localStorage is genuinely external state, shared with other tabs and other */
/* components. This gives one subscription, no hydration mismatch, and no     */
/* render-then-correct flash.                                                 */
/* -------------------------------------------------------------------------- */

/** Parsed snapshots, so repeated reads return a referentially stable array. */
const snapshots = new Map<string, { raw: string; value: number[] }>()

const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange)
  // Another tab writing to localStorage fires `storage` here.
  window.addEventListener('storage', onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

const readList = (key: string): number[] => {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    // Private mode or blocked site data.
    return EMPTY
  }

  if (!raw) return EMPTY

  // `getSnapshot` must return the same reference until the data changes,
  // or React re-renders forever.
  const cached = snapshots.get(key)
  if (cached && cached.raw === raw) return cached.value

  let value: number[] = EMPTY
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      value = parsed.filter((item): item is number => typeof item === 'number' && Number.isInteger(item))
    }
  } catch {
    value = EMPTY
  }

  snapshots.set(key, { raw, value })
  return value
}

const writeList = (key: string, value: number[]) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable or full; the notify below still updates the
    // UI for this session.
  }
  notify()
}

/** The server has no storage, so lists start empty and `ready` is false. */
const serverSnapshot = (): number[] => EMPTY

/**
 * Guest wishlist and try-on list, kept in localStorage.
 *
 * Client-only by design: there is no account system yet. The surface
 * (`has`/`toggle`/`remove`) is what components depend on, so it can be backed
 * by server persistence once customer accounts exist without touching them.
 */
export const SavedListsProvider = ({ children }: { children: ReactNode }) => {
  const wishlist = useSyncExternalStore(
    subscribe,
    () => readList(STORAGE_KEYS.wishlist),
    serverSnapshot,
  )
  const tryOn = useSyncExternalStore(subscribe, () => readList(STORAGE_KEYS.tryOn), serverSnapshot)

  // True once hydrated, which is when localStorage is actually readable.
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  const update = useCallback((list: ListName, next: (current: number[]) => number[]) => {
    const key = STORAGE_KEYS[list]
    writeList(key, next(readList(key)))
  }, [])

  const value = useMemo<SavedListsValue>(() => {
    const lists = { wishlist, tryOn }
    return {
      wishlist,
      tryOn,
      ready,
      has: (list, id) => lists[list].includes(id),
      toggle: (list, id) =>
        update(list, (current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        ),
      remove: (list, id) => update(list, (current) => current.filter((item) => item !== id)),
      clear: (list) => update(list, () => EMPTY),
    }
  }, [wishlist, tryOn, ready, update])

  return <SavedListsContext.Provider value={value}>{children}</SavedListsContext.Provider>
}

export const useSavedLists = (): SavedListsValue => {
  const context = useContext(SavedListsContext)
  if (!context) {
    throw new Error('useSavedLists must be used inside <SavedListsProvider>')
  }
  return context
}
