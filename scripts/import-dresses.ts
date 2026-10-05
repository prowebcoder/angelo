/**
 * Gown CSV import.
 *
 *   npm run import:dresses -- path/to/dresses.csv          # validate only
 *   npm run import:dresses -- path/to/dresses.csv --commit # then write
 *
 * Validation always runs first and prints every problem. Nothing is written
 * unless `--commit` is passed and no row-level errors remain, so a mistyped
 * designer or a duplicate gown is caught before it reaches the catalogue.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'
import { DRESS_CSV_COLUMNS, importDresses, validateDressCSV } from '../src/lib/import-dresses'

const main = async () => {
  const [filePath, ...flags] = process.argv.slice(2)
  const commit = flags.includes('--commit')

  if (!filePath) {
    console.error('Usage: npm run import:dresses -- <file.csv> [--commit]')
    console.error(`Expected columns: ${DRESS_CSV_COLUMNS.join(', ')}`)
    process.exit(1)
  }

  const csv = readFileSync(resolve(process.cwd(), filePath), 'utf8')
  const payload = await getPayload({ config })

  const { plans, issues, skippedRows } = await validateDressCSV(payload, csv)

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  console.log(`\nRead ${plans.length + skippedRows.length} rows.`)

  if (errors.length) {
    console.log(`\n${errors.length} error${errors.length === 1 ? '' : 's'} — these rows will be skipped:`)
    for (const issue of errors) {
      console.log(`  row ${issue.row}${issue.column ? ` · ${issue.column}` : ''}: ${issue.message}`)
    }
  }

  if (warnings.length) {
    console.log(`\n${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`)
    for (const issue of warnings) {
      console.log(`  row ${issue.row}${issue.column ? ` · ${issue.column}` : ''}: ${issue.message}`)
    }
  }

  console.log(`\n${plans.length} row${plans.length === 1 ? '' : 's'} ready to import.`)

  if (!commit) {
    console.log('\nNothing was written. Re-run with --commit to import the valid rows.')
    process.exit(errors.length ? 1 : 0)
  }

  if (!plans.length) {
    console.log('\nThere is nothing to import.')
    process.exit(1)
  }

  const result = await importDresses(payload, plans)
  console.log(`\nCreated ${result.created} gown${result.created === 1 ? '' : 's'} as drafts.`)

  if (result.failed.length) {
    console.log(`\n${result.failed.length} row${result.failed.length === 1 ? '' : 's'} failed to save:`)
    for (const failure of result.failed) {
      console.log(`  row ${failure.row} (${failure.name}): ${failure.message}`)
    }
  }

  console.log('\nOpen Gowns in the admin to add photographs, then publish.')
  process.exit(result.failed.length ? 1 : 0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
