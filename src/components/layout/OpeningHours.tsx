import type { SiteSetting } from '@/payload-types'

type Hours = NonNullable<SiteSetting['openingHours']>

/** What to show for one day, exactly as the boutique recorded it. */
const valueFor = (entry: Hours[number]) => {
  if (entry.specialNote) return entry.specialNote
  if (entry.closed) return 'Closed'
  if (entry.openingTime && entry.closingTime) return `${entry.openingTime}–${entry.closingTime}`
  return 'By appointment'
}

/**
 * Opening hours exactly as recorded in Site settings.
 *
 * Closed days are shown rather than hidden, so brides are not left guessing,
 * and an editor's special note replaces the times when present.
 *
 * Two layouts, because the reference uses two. `inline` reads "Monday:
 * Closed" on one line and is what the footer column wants, where the lines
 * are short and left-aligned. `between` pushes the time to the right of a
 * wider column, for the contact page.
 */
export const OpeningHoursList = ({
  hours,
  tone = 'light',
  layout = 'between',
  className,
}: {
  hours: Hours
  tone?: 'light' | 'dark'
  layout?: 'between' | 'inline'
  className?: string
}) => {
  if (!hours.length) return null

  const muted = tone === 'dark' ? 'text-on-ink-muted' : 'text-ink-muted'
  const base = tone === 'dark' ? 'text-[#d6d2cb]' : 'text-ink-soft'

  if (layout === 'inline') {
    return (
      <dl
        className={['text-[0.8125rem] leading-[1.75]', base, className].filter(Boolean).join(' ')}
      >
        {hours.map((entry) => (
          <div key={entry.id ?? entry.day}>
            <dt className="inline">{`${entry.day}: `}</dt>
            <dd className={['inline', entry.closed ? muted : undefined].filter(Boolean).join(' ')}>
              {valueFor(entry)}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <dl className={['space-y-1.5 text-sm', base, className].filter(Boolean).join(' ')}>
      {hours.map((entry) => (
        <div key={entry.id ?? entry.day} className="flex items-baseline justify-between gap-6">
          <dt>{entry.day}</dt>
          <dd className={entry.closed ? muted : undefined}>{valueFor(entry)}</dd>
        </div>
      ))}
    </dl>
  )
}
