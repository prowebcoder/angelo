/**
 * Re-links each gown to its correct designer.
 *
 *   npm run fix:designers
 *
 * Kept as a repeatable script rather than a one-off: it reconciles the gowns
 * in the database against `.import/dresses.json`, so it is the thing to run
 * after correcting that file. It only writes where the designer differs.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'

type RefDress = { slug: string; designerSlug: string | null; code: string | null }

const main = async () => {
  const dataFile = resolve(process.cwd(), '.import/dresses.json')
  if (!existsSync(dataFile)) {
    console.error(`\nNo catalogue data at ${dataFile}.\n`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const { dresses } = JSON.parse(readFileSync(dataFile, 'utf8')) as { dresses: RefDress[] }

  const designerDocs = await payload.find({
    collection: 'designers',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    draft: true,
  })
  const designerBySlug = new Map(designerDocs.docs.map((doc) => [doc.slug, doc.id]))

  let updated = 0
  let alreadyCorrect = 0
  const problems: string[] = []

  for (const dress of dresses) {
    if (!dress.designerSlug) continue

    const designerId = designerBySlug.get(dress.designerSlug)
    if (!designerId) {
      problems.push(`${dress.slug}: no designer "${dress.designerSlug}"`)
      continue
    }

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

    if (doc.designer === designerId) {
      alreadyCorrect += 1
      continue
    }

    try {
      // A gown with no photograph is a draft and would fail publish-time
      // validation, so the update has to stay in draft mode for those.
      if (doc._status === 'published') {
        await payload.update({
          collection: 'dresses',
          id: doc.id,
          data: { designer: designerId },
          overrideAccess: true,
        })
      } else {
        await payload.update({
          collection: 'dresses',
          id: doc.id,
          draft: true,
          data: { designer: designerId },
          overrideAccess: true,
        })
      }
      updated += 1
    } catch (error) {
      problems.push(`${dress.slug}: ${error instanceof Error ? error.message : 'update failed'}`)
    }
  }

  console.log(`\n  Re-linked ${updated} gown(s); ${alreadyCorrect} already correct`)

  // Report the resulting spread so the numbers can be eyeballed.
  console.log('\n  Gowns per designer:')
  for (const designer of designerDocs.docs) {
    const count = await payload.count({
      collection: 'dresses',
      where: { designer: { equals: designer.id } },
      overrideAccess: true,
    })
    if (count.totalDocs) console.log(`    ${designer.name}: ${count.totalDocs}`)
  }

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
