import type { Taxonomy } from '@/payload-types'
import type { DressQuery } from './queries'

/**
 * Catalogue filter contract.
 *
 * Filters live in the URL so results are shareable and linkable. Each taxonomy
 * kind gets its own query parameter; values are taxonomy slugs.
 */
export const FILTER_PARAMS = {
  designer: 'designer',
  silhouette: 'silhouette',
  style: 'style',
  feature: 'feature',
  fabric: 'fabric',
  size: 'size',
  neckline: 'neckline',
  sleeve: 'sleeve',
  train: 'train',
  colour: 'colour',
} as const

export type FilterParam = (typeof FILTER_PARAMS)[keyof typeof FILTER_PARAMS]

/**
 * Taxonomy kinds exposed as catalogue filters, in display order.
 *
 * `field` is the matching relationship field on the Dresses collection, which
 * is what the query layer filters on.
 */
export const FILTER_GROUPS: {
  param: FilterParam
  kind: Taxonomy['kind']
  label: string
  field: string
}[] = [
  { param: 'silhouette', kind: 'silhouette', label: 'Silhouette', field: 'silhouette' },
  { param: 'style', kind: 'style', label: 'Style', field: 'style' },
  { param: 'feature', kind: 'feature', label: 'Features', field: 'features' },
  { param: 'fabric', kind: 'fabric', label: 'Fabric', field: 'fabrics' },
  { param: 'neckline', kind: 'neckline', label: 'Neckline', field: 'neckline' },
  { param: 'sleeve', kind: 'sleeve', label: 'Sleeves', field: 'sleeve' },
  { param: 'train', kind: 'train', label: 'Train', field: 'train' },
  { param: 'size', kind: 'size', label: 'Size & fit', field: 'sizes' },
  { param: 'colour', kind: 'colour', label: 'Colour', field: 'colour' },
]

/**
 * Sort options offered in the catalogue UI.
 *
 * Defined here rather than beside the query layer because the filter bar is a
 * Client Component: importing it from `lib/queries` would pull Payload and the
 * database driver into the browser bundle.
 */
export const DRESS_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
] as const

/** Raw `searchParams` as delivered by Next.js. */
export type RawSearchParams = Record<string, string | string[] | undefined>

export type CatalogueFilters = {
  /** Selected slugs keyed by query parameter. */
  selected: Partial<Record<FilterParam, string[]>>
  search?: string
  sort: string
  page: number
  sampleSale: boolean
  mostLoved: boolean
  newArrival: boolean
}

const MAX_VALUES_PER_PARAM = 20

/** Accepts both `?x=a&x=b` and `?x=a,b`; de-duplicates and bounds the list. */
const readValues = (raw: string | string[] | undefined): string[] => {
  if (!raw) return []
  const parts = (Array.isArray(raw) ? raw : [raw])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set(parts)).slice(0, MAX_VALUES_PER_PARAM)
}

const readFlag = (raw: string | string[] | undefined): boolean => {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === '1' || value === 'true'
}

export const parseFilters = (params: RawSearchParams): CatalogueFilters => {
  const selected: Partial<Record<FilterParam, string[]>> = {}
  for (const param of Object.values(FILTER_PARAMS)) {
    const values = readValues(params[param])
    if (values.length) selected[param] = values
  }

  const rawSearch = Array.isArray(params.q) ? params.q[0] : params.q
  const rawSort = Array.isArray(params.sort) ? params.sort[0] : params.sort
  const rawPage = Number(Array.isArray(params.page) ? params.page[0] : params.page)

  return {
    selected,
    search: rawSearch?.trim().slice(0, 100) || undefined,
    sort: rawSort ?? 'newest',
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    sampleSale: readFlag(params['sample-sale']),
    mostLoved: readFlag(params['most-loved']),
    newArrival: readFlag(params['new-arrivals']),
  }
}

/** Maps parsed filters onto the catalogue query. */
export const toDressQuery = (filters: CatalogueFilters, limit = 24): DressQuery => {
  // Each group becomes `{ field, slugs }`, and the query ANDs them together.
  const taxonomies = FILTER_GROUPS.flatMap(({ param, field }) => {
    const slugs = filters.selected[param]
    return slugs?.length ? [{ field, slugs }] : []
  })

  return {
    designers: filters.selected.designer,
    taxonomies: taxonomies.length ? taxonomies : undefined,
    search: filters.search,
    sampleSale: filters.sampleSale || undefined,
    mostLoved: filters.mostLoved || undefined,
    newArrival: filters.newArrival || undefined,
    sort: filters.sort,
    page: filters.page,
    limit,
  }
}

export const activeFilterCount = (filters: CatalogueFilters): number => {
  const fromGroups = Object.values(filters.selected).reduce((total, values) => total + (values?.length ?? 0), 0)
  const flags = [filters.sampleSale, filters.mostLoved, filters.newArrival].filter(Boolean).length
  return fromGroups + flags + (filters.search ? 1 : 0)
}

export const hasActiveFilters = (filters: CatalogueFilters): boolean => activeFilterCount(filters) > 0

/**
 * Builds a query string with one value toggled.
 *
 * Page is dropped on any filter change, otherwise a user on page 3 would land
 * on an empty page after narrowing results.
 */
export const toggleFilterHref = (
  current: RawSearchParams,
  param: FilterParam | 'sample-sale' | 'most-loved' | 'new-arrivals',
  value: string,
  basePath: string,
): string => {
  const next = new URLSearchParams()

  for (const [key, raw] of Object.entries(current)) {
    if (key === 'page' || key === param) continue
    for (const item of readValues(raw)) next.append(key, item)
  }

  if (param === 'sample-sale' || param === 'most-loved' || param === 'new-arrivals') {
    if (!readFlag(current[param])) next.set(param, '1')
  } else {
    const existing = readValues(current[param])
    const remaining = existing.includes(value)
      ? existing.filter((item) => item !== value)
      : [...existing, value]
    for (const item of remaining) next.append(param, item)
  }

  const query = next.toString()
  return query ? `${basePath}?${query}` : basePath
}

/** Href that preserves filters but moves to another page. */
export const pageHref = (current: RawSearchParams, page: number, basePath: string): string => {
  const next = new URLSearchParams()
  for (const [key, raw] of Object.entries(current)) {
    if (key === 'page') continue
    for (const item of readValues(raw)) next.append(key, item)
  }
  if (page > 1) next.set('page', String(page))
  const query = next.toString()
  return query ? `${basePath}?${query}` : basePath
}

/**
 * Curated category routes under `/dresses/[category]`.
 *
 * Only these combinations are indexable; every other filter permutation is
 * canonicalised to `/dresses` and marked `noindex` so crawlers are not handed
 * an unbounded filter space.
 */
export const INDEXABLE_CATEGORIES: Record<
  string,
  { title: string; description: string; filters: Partial<Record<FilterParam, string>>; flag?: 'sample-sale' | 'most-loved' | 'new-arrivals' }
> = {
  'a-line': {
    title: 'A-line wedding dresses',
    description: 'Softly flared gowns that follow the waist and fall into a clean A.',
    filters: { silhouette: 'a-line' },
  },
  ballgown: {
    title: 'Ballgown wedding dresses',
    description: 'Full-skirted gowns with a defined waist and a sense of occasion.',
    filters: { silhouette: 'ballgown' },
  },
  'mermaid-fitted': {
    title: 'Mermaid and fitted wedding dresses',
    description: 'Close-fitting gowns that follow the body and release below the knee.',
    filters: { silhouette: 'mermaid' },
  },
  lace: {
    title: 'Lace wedding dresses',
    description: 'Gowns led by lace, from fine appliqué to bold floral work.',
    filters: { fabric: 'lace' },
  },
  satin: {
    title: 'Satin wedding dresses',
    description: 'Fluid, quiet gowns cut in satin and mikado.',
    filters: { fabric: 'satin' },
  },
  minimal: {
    title: 'Minimal wedding dresses',
    description: 'Clean lines, considered seams and very little ornament.',
    filters: { style: 'minimal' },
  },
  sleeves: {
    title: 'Wedding dresses with sleeves',
    description: 'Gowns with sleeves, from detachable to full-length.',
    filters: { feature: 'sleeves' },
  },
  strapless: {
    title: 'Strapless wedding dresses',
    description: 'Strapless bodices, structured to stay where they are put.',
    filters: { feature: 'strapless' },
  },
  'plus-size': {
    title: 'Plus size wedding dresses',
    description: 'Gowns with samples available in extended sizes.',
    filters: { size: 'plus-size' },
  },
  'new-arrivals': {
    title: 'New arrivals',
    description: 'The most recent gowns to join the boutique.',
    filters: {},
    flag: 'new-arrivals',
  },
  'most-loved': {
    title: 'Most loved',
    description: 'The gowns our brides return to most often.',
    filters: {},
    flag: 'most-loved',
  },
  'sample-sale': {
    title: 'Sample sale and off the rack',
    description: 'Boutique samples available to take home.',
    filters: {},
    flag: 'sample-sale',
  },
}

export const categoryFiltersToSearchParams = (category: string): RawSearchParams => {
  const entry = INDEXABLE_CATEGORIES[category]
  if (!entry) return {}
  const params: RawSearchParams = { ...entry.filters }
  if (entry.flag) params[entry.flag] = '1'
  return params
}
