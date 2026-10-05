import type { ReactNode } from 'react'

type Item = {
  id: string
  question: string
  answer: ReactNode
}

/**
 * FAQ accordion built on `<details>`/`<summary>`.
 *
 * Native disclosure gives keyboard support, screen-reader semantics and
 * in-page search (Chrome expands matching hidden text) with no JavaScript, so
 * answers stay reachable even before hydration.
 */
export const Accordion = ({ items, className }: { items: Item[]; className?: string }) => {
  if (!items.length) return null

  return (
    <div className={['divide-y divide-line border-t border-b border-line', className].filter(Boolean).join(' ')}>
      {items.map((item) => (
        <details key={item.id} name="faq" className="group">
          <summary
            className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden"
            id={`faq-${item.id}`}
          >
            <span className="font-serif text-xl leading-snug text-ink md:text-2xl">{item.question}</span>
            <span
              aria-hidden="true"
              className="relative mt-2 h-3 w-3 shrink-0 text-taupe"
            >
              {/* Plus that becomes a minus when open. */}
              <span className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-current" />
              <span className="absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-current transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <div className="pb-8 md:pr-16">{item.answer}</div>
        </details>
      ))}
    </div>
  )
}
