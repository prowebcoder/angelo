/**
 * Imports the gown catalogue and its photographs.
 *
 *   npm run import:catalogue
 *
 * Reads `.import/dresses.json` and `.import/dress-images/`, which hold the
 * boutique's own gown records and approved photographs collected from the
 * live site. For each gown it uploads the images into the media library with
 * the real alt text, then creates the gown linked to its designer.
 *
 * Idempotent: a gown or image that already exists is skipped, so the import
 * can be re-run after a partial pass without creating duplicates.
 *
 * Gowns arrive **published** when they have at least one photograph, and as
 * drafts when they do not — a gown page with no picture is not ready to be
 * public.
 */
import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'

type RefView = { id: string; alt: string }
type RefDress = {
  slug: string
  name: string | null
  designerSlug: string | null
  code: string | null
  description: string | null
  views: RefView[]
}

const IMPORT_DIR = resolve(process.cwd(), '.import')
const IMAGE_DIR = resolve(IMPORT_DIR, 'dress-images')
const EXTENSIONS = ['jpg', 'png', 'webp'] as const

const log = (message: string) => console.log(`  ${message}`)

/** Locates a downloaded photograph, whichever format it arrived in. */
const imagePath = (slug: string, index: number): string | null => {
  for (const ext of EXTENSIONS) {
    const file = resolve(IMAGE_DIR, `${slug}-${index + 1}.${ext}`)
    if (existsSync(file)) return file
  }
  return null
}

/**
 * Uploads one photograph, reusing it if already present.
 *
 * Payload stores the file under its own name, so the original filename is the
 * natural key for "have I uploaded this already".
 */
const uploadImage = async (
  payload: Payload,
  file: string,
  alt: string,
  cache: Map<string, number>,
): Promise<number | null> => {
  const filename = basename(file)
  const cached = cache.get(filename)
  if (cached) return cached

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    cache.set(filename, existing.docs[0].id)
    return existing.docs[0].id
  }

  try {
    const created = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt, folder: 'Dresses' },
      filePath: file,
    })
    cache.set(filename, created.id)
    return created.id
  } catch (error) {
    console.error(`    ! image ${filename}: ${error instanceof Error ? error.message : 'failed'}`)
    return null
  }
}

const main = async () => {
  const dataFile = resolve(IMPORT_DIR, 'dresses.json')

  if (!existsSync(dataFile)) {
    console.error(`\nNo catalogue data at ${dataFile}.`)
    console.error('This step needs the boutique assets staged in .import/ — see README.md.\n')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const { dresses } = JSON.parse(readFileSync(dataFile, 'utf8')) as { dresses: RefDress[] }

  console.log(`\nImporting ${dresses.length} gowns\n`)

  // Resolve designers once.
  const designerDocs = await payload.find({
    collection: 'designers',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    draft: true,
  })
  const designerBySlug = new Map(designerDocs.docs.map((doc) => [doc.slug, doc.id]))

  if (!designerBySlug.size) {
    console.error('No designers found. Run `npm run seed` first.\n')
    process.exit(1)
  }

  const imageCache = new Map<string, number>()
  let created = 0
  let skipped = 0
  let drafts = 0
  const problems: string[] = []

  for (const dress of dresses) {
    if (!dress.name || !dress.designerSlug) {
      problems.push(`${dress.slug}: missing name or designer`)
      continue
    }

    const designerId = designerBySlug.get(dress.designerSlug)
    if (!designerId) {
      problems.push(`${dress.slug}: no designer "${dress.designerSlug}"`)
      continue
    }

    const existing = await payload.find({
      collection: 'dresses',
      where: { slug: { equals: dress.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    if (existing.docs.length) {
      skipped += 1
      continue
    }

    // Upload this gown's approved views, in order.
    const uploaded: { id: number; alt: string }[] = []
    for (const [index, view] of dress.views.entries()) {
      const file = imagePath(dress.slug, index)
      if (!file) continue
      const id = await uploadImage(payload, file, view.alt, imageCache)
      if (id) uploaded.push({ id, alt: view.alt })
    }

    const hasImage = uploaded.length > 0

    const common = {
      name: dress.name,
      slug: dress.slug,
      designer: designerId,
      styleCode: dress.code ?? undefined,
      description: dress.description ?? undefined,
      currency: 'EUR' as const,
      availability: 'confirm-with-boutique' as const,
    }

    try {
      if (hasImage) {
        await payload.create({
          collection: 'dresses',
          overrideAccess: true,
          data: {
            ...common,
            primaryImage: uploaded[0].id,
            gallery: uploaded.slice(1).map((image) => ({ image: image.id, alt: image.alt })),
            _status: 'published',
          },
        })
      } else {
        // `primaryImage` is required to publish, so a gown with no photograph
        // is saved as a draft rather than failing validation.
        await payload.create({
          collection: 'dresses',
          overrideAccess: true,
          draft: true,
          data: { ...common, _status: 'draft' },
        })
      }

      created += 1
      if (!hasImage) drafts += 1
      if (created % 10 === 0) log(`${created} gowns imported…`)
    } catch (error) {
      problems.push(`${dress.slug}: ${error instanceof Error ? error.message : 'failed to save'}`)
    }
  }

  console.log('')
  log(`Created ${created} gowns (${drafts} as drafts with no photograph yet)`)
  log(`Skipped ${skipped} that already existed`)
  log(`Uploaded ${imageCache.size} photographs`)

  if (problems.length) {
    console.log(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
    for (const problem of problems) console.log(`  ${problem}`)
  }

  console.log('\nNext: tick Most loved / New arrival / Sample sale on the gowns you want')
  console.log('on the homepage, and add silhouette, style, fabric and feature terms')
  console.log('under each gown’s Filters tab so the catalogue filters find them.\n')

  process.exit(problems.length ? 1 : 0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
