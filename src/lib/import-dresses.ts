import type { Payload } from 'payload'
import { parseCSVToObjects, splitList } from './csv'
import { slugify } from './format'

/**
 * CSV import for the gown catalogue.
 *
 * Two-phase by design: `validateDressCSV` reports every problem without
 * touching the database, so an editor sees the full picture before deciding.
 * `importDresses` then writes only rows that passed. Nothing is created
 * half-formed, and a bad row never silently becomes a broken gown page.
 */

export const DRESS_CSV_COLUMNS = [
  'name',
  'designer',
  'code',
  'price',
  'sampleSize',
  'description',
  'silhouette',
  'style',
  'features',
  'fabric',
  'availability',
  'collection',
  'mostLoved',
  'newArrival',
  'sampleSale',
  'imageURL',
] as const

export type DressRowIssue = {
  row: number
  column?: string
  message: string
  severity: 'error' | 'warning'
}

export type DressRowPlan = {
  row: number
  name: string
  slug: string
  designerId: number
  /** Taxonomy relationship fields resolved to term IDs. */
  taxonomy: Record<string, number[]>
  price?: number
  sampleSize?: string
  description?: string
  collection?: string
  styleCode?: string
  availability?: string
  mostLoved: boolean
  newArrival: boolean
  sampleSale: boolean
  /** Images are matched by media filename or alt text, never invented. */
  mediaId?: number
}

export type DressValidation = {
  plans: DressRowPlan[]
  issues: DressRowIssue[]
  /** Rows that will be skipped because they carry an error. */
  skippedRows: number[]
}

const AVAILABILITY_VALUES = new Set([
  'confirm-with-boutique',
  'sample-available',
  'sample-unavailable',
  'archived',
])

const TRUTHY = new Set(['yes', 'y', 'true', '1', 'x'])

const asBoolean = (value: string | undefined): boolean => TRUTHY.has((value ?? '').trim().toLowerCase())

/** Maps a CSV column to the dress field holding that taxonomy kind. */
const TAXONOMY_COLUMNS: { column: string; field: string; kind: string; multiple: boolean }[] = [
  { column: 'silhouette', field: 'silhouette', kind: 'silhouette', multiple: false },
  { column: 'style', field: 'style', kind: 'style', multiple: true },
  { column: 'features', field: 'features', kind: 'feature', multiple: true },
  { column: 'fabric', field: 'fabrics', kind: 'fabric', multiple: true },
  { column: 'neckline', field: 'neckline', kind: 'neckline', multiple: false },
  { column: 'sleeve', field: 'sleeve', kind: 'sleeve', multiple: false },
  { column: 'train', field: 'train', kind: 'train', multiple: false },
  { column: 'size', field: 'sizes', kind: 'size', multiple: true },
  { column: 'colour', field: 'colour', kind: 'colour', multiple: false },
]

/**
 * Checks a CSV against the catalogue without writing anything.
 *
 * Unknown designers and unknown taxonomy terms are errors rather than
 * silently-created records: a typo should be corrected, not turned into a new
 * designer or a duplicate filter term.
 */
export const validateDressCSV = async (payload: Payload, csv: string): Promise<DressValidation> => {
  const rows = parseCSVToObjects(csv)
  const issues: DressRowIssue[] = []
  const plans: DressRowPlan[] = []
  const skippedRows: number[] = []

  if (!rows.length) {
    return { plans, issues: [{ row: 0, message: 'The file has no data rows.', severity: 'error' }], skippedRows }
  }

  const headers = Object.keys(rows[0])
  if (!headers.includes('name')) {
    issues.push({ row: 1, column: 'name', message: 'A "name" column is required.', severity: 'error' })
  }
  if (!headers.includes('designer')) {
    issues.push({ row: 1, column: 'designer', message: 'A "designer" column is required.', severity: 'error' })
  }
  if (issues.some((issue) => issue.severity === 'error')) {
    return { plans, issues, skippedRows }
  }

  // Load the vocabulary once, then resolve every row in memory.
  const [designers, taxonomies, existing, media] = await Promise.all([
    payload.find({ collection: 'designers', depth: 0, limit: 500, overrideAccess: true }),
    payload.find({ collection: 'taxonomies', depth: 0, limit: 1000, overrideAccess: true }),
    payload.find({ collection: 'dresses', depth: 0, limit: 5000, overrideAccess: true, select: { slug: true } }),
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 5000,
      overrideAccess: true,
      select: { filename: true, alt: true },
    }),
  ])

  // Images are matched against files already in the media library, by
  // filename or alt text. Nothing is downloaded from an external URL during
  // import: that would mean fetching arbitrary remote files on an editor's
  // behalf, so uploads stay a deliberate step in the admin.
  const mediaByKey = new Map<string, number>()
  for (const file of media.docs) {
    if (file.filename) mediaByKey.set(file.filename.toLowerCase(), file.id)
    if (file.alt) mediaByKey.set(file.alt.toLowerCase(), file.id)
  }

  const designerByKey = new Map<string, number>()
  for (const designer of designers.docs) {
    designerByKey.set(designer.name.toLowerCase(), designer.id)
    designerByKey.set(designer.slug.toLowerCase(), designer.id)
  }

  const termByKey = new Map<string, number>()
  for (const term of taxonomies.docs) {
    termByKey.set(`${term.kind}:${term.name.toLowerCase()}`, term.id)
    termByKey.set(`${term.kind}:${term.slug.toLowerCase()}`, term.id)
  }

  const existingSlugs = new Set(existing.docs.map((doc) => doc.slug))
  const slugsInFile = new Set<string>()

  rows.forEach((record, index) => {
    // +2 so the number matches the spreadsheet row the editor is looking at.
    const row = index + 2
    const rowIssues: DressRowIssue[] = []

    const name = record.name?.trim()
    if (!name) {
      rowIssues.push({ row, column: 'name', message: 'Name is required.', severity: 'error' })
    }

    const designerKey = record.designer?.trim().toLowerCase()
    const designerId = designerKey ? designerByKey.get(designerKey) : undefined
    if (!designerKey) {
      rowIssues.push({ row, column: 'designer', message: 'Designer is required.', severity: 'error' })
    } else if (!designerId) {
      rowIssues.push({
        row,
        column: 'designer',
        message: `No designer named "${record.designer}". Add the designer first, or correct the spelling.`,
        severity: 'error',
      })
    }

    const slug = name ? slugify(`${record.designer ?? ''} ${name}`) : ''
    if (slug && existingSlugs.has(slug)) {
      rowIssues.push({
        row,
        message: `A gown already exists at "${slug}". This row will be skipped rather than overwrite it.`,
        severity: 'error',
      })
    }
    if (slug && slugsInFile.has(slug)) {
      rowIssues.push({
        row,
        message: `"${slug}" appears more than once in this file.`,
        severity: 'error',
      })
    }

    let price: number | undefined
    if (record.price) {
      const parsed = Number(record.price.replace(/[^0-9.]/g, ''))
      if (!Number.isFinite(parsed) || parsed < 0) {
        rowIssues.push({
          row,
          column: 'price',
          message: `"${record.price}" is not a price. Leave it empty if there is no confirmed price.`,
          severity: 'error',
        })
      } else {
        price = parsed
      }
    }

    const availability = record.availability?.trim()
    if (availability && !AVAILABILITY_VALUES.has(availability)) {
      rowIssues.push({
        row,
        column: 'availability',
        message: `"${availability}" is not a known availability. Use one of: ${[...AVAILABILITY_VALUES].join(', ')}.`,
        severity: 'warning',
      })
    }

    const taxonomy: Record<string, number[]> = {}
    for (const mapping of TAXONOMY_COLUMNS) {
      const values = splitList(record[mapping.column])
      if (!values.length) continue

      const ids: number[] = []
      for (const value of values) {
        const id = termByKey.get(`${mapping.kind}:${value.toLowerCase()}`)
        if (id) {
          ids.push(id)
        } else {
          rowIssues.push({
            row,
            column: mapping.column,
            message: `"${value}" is not a ${mapping.kind} term yet. Add it under Filter terms first; the gown will import without it.`,
            severity: 'warning',
          })
        }
      }

      if (ids.length) {
        taxonomy[mapping.field] = mapping.multiple ? ids : [ids[0]]
        if (!mapping.multiple && ids.length > 1) {
          rowIssues.push({
            row,
            column: mapping.column,
            message: `${mapping.column} takes one value; "${values[0]}" was used.`,
            severity: 'warning',
          })
        }
      }
    }

    // Match a photograph already in the media library.
    let mediaId: number | undefined
    const imageKey = record.imageURL?.trim()
    if (imageKey) {
      const filename = imageKey.split('/').pop()?.toLowerCase() ?? imageKey.toLowerCase()
      mediaId = mediaByKey.get(filename) ?? mediaByKey.get(imageKey.toLowerCase())
      if (!mediaId) {
        rowIssues.push({
          row,
          column: 'imageURL',
          message: `No image named "${imageKey}" in the media library. Upload it there, then set the main photograph on the gown.`,
          severity: 'warning',
        })
      }
    } else {
      rowIssues.push({
        row,
        message: 'No image given, so this gown will import as a draft until a photograph is added.',
        severity: 'warning',
      })
    }

    issues.push(...rowIssues)

    if (rowIssues.some((issue) => issue.severity === 'error')) {
      skippedRows.push(row)
      return
    }

    slugsInFile.add(slug)
    plans.push({
      row,
      name: name as string,
      slug,
      designerId: designerId as number,
      taxonomy,
      price,
      sampleSize: record.sampleSize || undefined,
      description: record.description || undefined,
      collection: record.collection || undefined,
      styleCode: record.code || undefined,
      availability: availability && AVAILABILITY_VALUES.has(availability) ? availability : undefined,
      mostLoved: asBoolean(record.mostLoved),
      newArrival: asBoolean(record.newArrival),
      sampleSale: asBoolean(record.sampleSale),
      mediaId,
    })
  })

  return { plans, issues, skippedRows }
}

export type ImportResult = {
  created: number
  failed: { row: number; name: string; message: string }[]
}

/**
 * Writes validated rows.
 *
 * Gowns are created as drafts so someone adds photographs and checks the copy
 * before anything reaches the public catalogue — an import should never
 * publish a gown with no picture.
 */
export const importDresses = async (payload: Payload, plans: DressRowPlan[]): Promise<ImportResult> => {
  const result: ImportResult = { created: 0, failed: [] }

  for (const plan of plans) {
    try {
      await payload.create({
        collection: 'dresses',
        overrideAccess: true,
        data: {
          name: plan.name,
          slug: plan.slug,
          designer: plan.designerId,
          collection: plan.collection,
          styleCode: plan.styleCode,
          description: plan.description,
          price: plan.price,
          currency: 'EUR',
          sampleSize: plan.sampleSize,
          availability: (plan.availability ?? 'confirm-with-boutique') as
            | 'confirm-with-boutique'
            | 'sample-available'
            | 'sample-unavailable'
            | 'archived',
          mostLoved: plan.mostLoved,
          newArrival: plan.newArrival,
          sampleSale: plan.sampleSale,
          // `primaryImage` is required to publish. Saving as a draft is what
          // lets a gown import without one, so nothing reaches the public
          // catalogue until someone attaches a photograph.
          ...(plan.mediaId ? { primaryImage: plan.mediaId } : {}),
          ...plan.taxonomy,
          _status: 'draft',
        },
        draft: true,
      })
      result.created += 1
    } catch (error) {
      result.failed.push({
        row: plan.row,
        name: plan.name,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}
