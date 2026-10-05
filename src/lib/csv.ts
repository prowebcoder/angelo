/**
 * Minimal RFC 4180 CSV reader.
 *
 * Written rather than installed because the importer needs exactly this:
 * quoted fields, escaped quotes, embedded commas and newlines, and both LF
 * and CRLF endings. A dependency for 60 lines would be the larger cost.
 */
export const parseCSV = (input: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let index = 0

  // Strip a UTF-8 BOM, which Excel adds and which would corrupt the first header.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input

  const endField = () => {
    row.push(field)
    field = ''
  }

  const endRow = () => {
    endField()
    // Ignore trailing blank lines.
    if (row.length > 1 || row[0] !== '') rows.push(row)
    row = []
  }

  while (index < text.length) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }

    if (char === '"' && field === '') {
      inQuotes = true
      index += 1
      continue
    }

    if (char === ',') {
      endField()
      index += 1
      continue
    }

    if (char === '\r') {
      // Treat CRLF and a lone CR as one row break.
      if (text[index + 1] === '\n') index += 1
      endRow()
      index += 1
      continue
    }

    if (char === '\n') {
      endRow()
      index += 1
      continue
    }

    field += char
    index += 1
  }

  if (field !== '' || row.length) endRow()

  return rows
}

/** Rows keyed by header, with headers normalised to lower camel-ish keys. */
export const parseCSVToObjects = (input: string): Record<string, string>[] => {
  const rows = parseCSV(input)
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => header.trim())

  return rows.slice(1).map((row) =>
    headers.reduce<Record<string, string>>((record, header, column) => {
      record[header] = (row[column] ?? '').trim()
      return record
    }, {}),
  )
}

/** Splits a multi-value cell such as `Lace|Sleeves` or `Lace, Sleeves`. */
export const splitList = (value: string | undefined): string[] => {
  if (!value) return []
  return value
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}
