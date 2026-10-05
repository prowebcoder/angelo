/**
 * Syncs price, sample size and style code onto existing gowns.
 *
 *   npm run sync:details
 *
 * Reconciles the gowns in the database against `.import/dresses.json`. The
 * first catalogue scrape missed these fields, so this fills them in without
 * re-importing — and it is the thing to re-run after correcting that file.
 *
 * Only writes where a value differs, and never clears a field the boutique
 * has filled in itself.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'

type RefDress = {
  slug: string
  price?: number | null
  sampleSize?: string | null
  code?: string | null
}

const main = async () => {
  const dataFile = resolve(process.cwd(), '.import/dresses.json')
  if (!existsSync(dataFile)) {
    console.error(`\nNo catalogue data at ${dataFile}.\n`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const { dresses } = JSON.parse(readFileSync(dataFile, 'utf8')) as { dresses: RefDress[] }

  let updated = 0
  let unchanged = 0
  const problems: string[] = []

  for (const dress of dresses) {
    const existing = await payload.find({
      collection: 'dresses',
      where: { slug: { equals: dress.slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    const doc = existing.docs[0]
    if (!doc) continue

    const data: Record<string, unknown> = {}
    // Only set what the scrape found and the record is missing or differs on.
    if (dress.price != null && doc.price !== dress.price) data.price = dress.price
    if (dress.sampleSize && doc.sampleSize !== dress.sampleSize) data.sampleSize = dress.sampleSize
    if (dress.code && doc.styleCode !== dress.code) data.styleCode = dress.code

    if (!Object.keys(data).length) {
      unchanged += 1
      continue
    }

    try {
      // A gown with no photograph is a draft and would fail publish-time
      // validation, so that update has to stay in draft mode.
      if (doc._status === 'published') {
        await payload.update({ collection: 'dresses', id: doc.id, data, overrideAccess: true })
      } else {
        await payload.update({ collection: 'dresses', id: doc.id, draft: true, data, overrideAccess: true })
      }
      updated += 1
    } catch (error) {
      problems.push(`${dress.slug}: ${error instanceof Error ? error.message : 'update failed'}`)
    }
  }

  console.log(`\n  Updated ${updated} gown(s); ${unchanged} already correct`)

  const withPrice = await payload.count({
    collection: 'dresses',
    where: { price: { exists: true } },
    overrideAccess: true,
  })
  console.log(`  Gowns with a listed price: ${withPrice.totalDocs}`)

  if (problems.length) {
    console.log(`\n  ${problems.length} problem(s):`)
    for (const problem of problems) console.log(`    ${problem}`)
  }

  console.log('')
  process.exit(problems.length ? 1 : 0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
