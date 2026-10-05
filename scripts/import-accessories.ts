/**
 * Imports the boutique's accessories and styles them against the gowns.
 *
 *   npm run import:accessories
 *
 * Reads `.import/accessories.json` and `.import/accessories/`, creating each
 * piece with its real name, SKU, category and price, then linking them to
 * published gowns so the "Complete the look" section on a gown page has
 * something genuine to show.
 *
 * Idempotent: an accessory that already exists is skipped, and a gown that
 * already has suggestions is left alone.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'
import { slugify } from '../src/lib/format'

type RefAccessory = {
  name: string
  sku: string | null
  category: string
  price: number
  alt: string
  file: string
}

const IMPORT_DIR = resolve(process.cwd(), '.import')
const IMAGE_DIR = resolve(IMPORT_DIR, 'accessories')

const log = (message: string) => console.log(`  ${message}`)

const upload = async (payload: Payload, file: string, alt: string): Promise<number | null> => {
  const filename = file.split(/[/\\]/).pop() as string
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) return existing.docs[0].id

  try {
    const created = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt, folder: 'Dresses' },
      filePath: file,
    })
    return created.id
  } catch (error) {
    console.error(`    ! ${filename}: ${error instanceof Error ? error.message : 'failed'}`)
    return null
  }
}

const main = async () => {
  const dataFile = resolve(IMPORT_DIR, 'accessories.json')
  if (!existsSync(dataFile)) {
    console.error(`\nNo accessory data at ${dataFile}. See README.md.\n`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const items = JSON.parse(readFileSync(dataFile, 'utf8')) as RefAccessory[]

  console.log(`\nImporting ${items.length} accessories\n`)

  let created = 0
  let skipped = 0
  const ids: number[] = []

  for (const item of items) {
    const slug = slugify(item.name)

    const existing = await payload.find({
      collection: 'accessories',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    if (existing.docs[0]) {
      ids.push(existing.docs[0].id)
      skipped += 1
      continue
    }

    // Category is a managed taxonomy term, created by the seed.
    const category = await payload.find({
      collection: 'taxonomies',
      where: {
        and: [{ kind: { equals: 'accessory-category' } }, { slug: { equals: slugify(item.category) } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (!category.docs[0]) {
      console.error(`    ! no "${item.category}" category — run npm run seed first`)
      continue
    }

    const file = resolve(IMAGE_DIR, item.file)
    const imageId = existsSync(file) ? await upload(payload, file, item.alt) : null
    if (!imageId) {
      console.error(`    ! ${item.name}: no photograph, skipped`)
      continue
    }

    const doc = await payload.create({
      collection: 'accessories',
      overrideAccess: true,
      data: {
        name: item.name,
        slug,
        category: category.docs[0].id,
        sku: item.sku ?? undefined,
        price: item.price,
        currency: 'EUR',
        // The reference lists these as currently available in its shop.
        availability: 'available',
        featured: true,
        image: imageId,
        _status: 'published',
      },
    })

    ids.push(doc.id)
    created += 1
  }

  log(`Accessories: ${created} created, ${skipped} already present`)

  /*
   * Style them against the gowns.
   *
   * The reference suggests veils and shoes on every gown page rather than a
   * bespoke pairing per gown, so every published gown without suggestions
   * gets the same set. Staff can curate per gown from the admin afterwards.
   */
  if (ids.length) {
    const gowns = await payload.find({
      collection: 'dresses',
      where: { _status: { equals: 'published' } },
      depth: 0,
      limit: 500,
      overrideAccess: true,
    })

    let styled = 0
    for (const gown of gowns.docs) {
      if ((gown.accessories ?? []).length) continue
      await payload.update({
        collection: 'dresses',
        id: gown.id,
        data: { accessories: ids },
        overrideAccess: true,
      })
      styled += 1
    }

    log(`Complete the look: ${styled} gown(s) given accessory suggestions`)
  }

  console.log('\nCurate per gown under each gown’s Filters tab when you want a bespoke pairing.\n')
  process.exit(0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
