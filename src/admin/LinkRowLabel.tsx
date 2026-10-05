'use client'

import { useRowLabel } from '@payloadcms/ui'

type Row = { label?: string; url?: string; side?: string }

/**
 * Collapsed label for any list of links — the menu, its dropdowns, the footer
 * columns, the legal line.
 *
 * Payload labels array rows "Item 01", "Item 02", so reordering a ten-link
 * footer column means opening every row to see which is which. Showing the
 * link's own wording, and where it points, makes the collapsed list readable
 * and draggable as it stands.
 */
const LinkRowLabel = () => {
  const { data, rowNumber } = useRowLabel<Row>()

  if (!data?.label) return <span>{`Item ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}</span>

  const side = data.side === 'right' ? 'right of the logo' : data.side === 'left' ? 'left of the logo' : null
  const detail = [side, data.url].filter(Boolean).join(' · ')

  return (
    <span>
      {data.label}
      {detail ? <span style={{ opacity: 0.6 }}>{` — ${detail}`}</span> : null}
    </span>
  )
}

export default LinkRowLabel
