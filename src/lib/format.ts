import type { Designer, Dress, Taxonomy } from '@/payload-types'
import { isPopulated } from './media'

/**
 * Prices are optional throughout the catalogue: the boutique confirms many
 * gowns in person. Never invent a figure when none is recorded.
 */
export const formatPrice = (price?: number | null, currency: string = 'EUR'): string | null => {
  if (price == null) return null
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price)
}

export const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(date)
}

export const formatDateRange = (start?: string | null, end?: string | null): string | null => {
  const from = formatDate(start)
  if (!from) return null
  const to = formatDate(end)
  if (!to || to === from) return from
  return `${from} – ${to}`
}

export const designerOf = (dress: Dress): Designer | null =>
  isPopulated<Designer>(dress.designer) ? dress.designer : null

export const designerName = (dress: Dress): string | null => designerOf(dress)?.name ?? null

/** Dress relationship fields that hold taxonomy terms, in display order. */
const TAXONOMY_FIELDS = [
  'silhouette',
  'style',
  'features',
  'fabrics',
  'neckline',
  'sleeve',
  'train',
  'sizes',
  'colour',
] as const satisfies readonly (keyof Dress)[]

type TaxonomyRef = number | Taxonomy | null | undefined

/** Every populated taxonomy term on a dress, across all of its fields. */
export const taxonomiesOf = (dress: Dress, kind?: Taxonomy['kind']): Taxonomy[] => {
  const terms = TAXONOMY_FIELDS.flatMap((field) => {
    const value = dress[field] as TaxonomyRef | TaxonomyRef[]
    const list = Array.isArray(value) ? value : [value]
    return list.filter((term): term is Taxonomy => isPopulated<Taxonomy>(term))
  })

  const unique = new Map(terms.map((term) => [term.id, term]))
  const all = Array.from(unique.values())
  return kind ? all.filter((term) => term.kind === kind) : all
}

/**
 * Taxonomy grouped for the "details" table on a gown page.
 * Empty groups are dropped so the table never shows blank rows.
 */
export const dressDetailGroups = (dress: Dress): { label: string; values: string[] }[] => {
  const groups: { label: string; kind: Taxonomy['kind'] }[] = [
    { label: 'Silhouette', kind: 'silhouette' },
    { label: 'Neckline', kind: 'neckline' },
    { label: 'Sleeves', kind: 'sleeve' },
    { label: 'Fabric', kind: 'fabric' },
    { label: 'Details', kind: 'feature' },
    { label: 'Train', kind: 'train' },
    { label: 'Colour', kind: 'colour' },
    { label: 'Style', kind: 'style' },
    { label: 'Size and fit', kind: 'size' },
  ]

  return groups
    .map((group) => ({
      label: group.label,
      values: taxonomiesOf(dress, group.kind).map((term) => term.name),
    }))
    .filter((group) => group.values.length > 0)
}

export const AVAILABILITY_LABELS: Record<NonNullable<Dress['availability']>, string> = {
  'confirm-with-boutique': 'Confirm with the boutique',
  'sample-available': 'Sample available to try',
  'sample-unavailable': 'Sample not currently available',
  archived: 'Archived',
}

export const availabilityLabel = (dress: Dress): string =>
  AVAILABILITY_LABELS[dress.availability ?? 'confirm-with-boutique']

/** Reading time is editor-set; fall back to a word-count estimate. */
export const readingTimeLabel = (minutes?: number | null): string | null =>
  minutes ? `${minutes} min read` : null

export const truncate = (value: string | null | undefined, max = 160): string | null => {
  if (!value) return null
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, clean.lastIndexOf(' ', max - 1)).trimEnd()}…`
}

/** Builds a URL-safe slug; used by the CSV importer and seed script. */
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
