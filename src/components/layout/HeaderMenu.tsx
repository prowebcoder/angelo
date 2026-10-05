'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { NavItem } from './nav-data'

type Props = {
  items: NavItem[]
  /** Which side of the wordmark this list is on. */
  side: 'left' | 'right'
  /** Stable prefix for the panel ids, so both lists stay unique. */
  idBase: string
  openPanel: string | null
  setOpenPanel: (panel: string | null) => void
  cancelClose: () => void
  scheduleClose: () => void
  isCurrent: (href: string) => boolean
  /** Shown in the footer of the Wedding Dresses panel. */
  dressCount: number
}

/**
 * One side of the header menu.
 *
 * The reference splits its destinations either side of the centred wordmark,
 * so this renders a single list and the header mounts it twice. Panels anchor
 * to the edge nearest their own side, which keeps a right-hand dropdown from
 * running off the viewport.
 */
export const HeaderMenu = ({
  items,
  side,
  idBase,
  openPanel,
  setOpenPanel,
  cancelClose,
  scheduleClose,
  isCurrent,
  dressCount,
}: Props) => {
  if (!items.length) return null

  return (
    <ul
      className={`hidden min-w-0 items-center gap-[clamp(0.55rem,0.8vw,1rem)] lg:flex ${
        side === 'right' ? 'justify-end' : ''
      }`}
    >
      {items.map((item, index) => {
        const panelId = `${idBase}-${side}-${index}`
        const isOpen = openPanel === panelId

        return (
          <li
            key={`${item.href}-${item.label}`}
            className="relative shrink-0"
            onMouseEnter={
              item.panel
                ? () => {
                    cancelClose()
                    setOpenPanel(panelId)
                  }
                : undefined
            }
            onMouseLeave={item.panel ? scheduleClose : undefined}
          >
            <div className="flex items-center">
              <Link
                href={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className={`group relative py-3 text-[0.51rem] tracking-[0.09em] whitespace-nowrap uppercase xl:text-[0.57rem] ${
                  isCurrent(item.href) ? 'opacity-100' : 'opacity-75 hover:opacity-100'
                }`}
              >
                {item.label}
                {/* The reference's hairline, sweeping in from the left. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-[3px] left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-[350ms] ease-(--ease) group-hover:origin-left group-hover:scale-x-100"
                />
              </Link>

              {item.panel ? (
                <button
                  type="button"
                  onClick={() => setOpenPanel(isOpen ? null : panelId)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="px-1 py-3 opacity-60 transition-opacity hover:opacity-100"
                >
                  <span className="sr-only">{`${isOpen ? 'Hide' : 'Show'} ${item.label} menu`}</span>
                  <svg
                    width="8"
                    height="5"
                    viewBox="0 0 9 6"
                    aria-hidden="true"
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </button>
              ) : null}
            </div>

            {item.panel ? (
              <div
                id={panelId}
                hidden={!isOpen}
                className={`absolute top-full z-[105] w-[min(43rem,calc(100vw-4rem))] border-t border-line bg-paper text-ink shadow-[0_24px_48px_-32px_rgba(17,16,14,0.3)] ${
                  side === 'right' ? 'right-0' : 'left-0'
                }`}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <div className="flex gap-8 p-8">
                  {item.panel.feature?.image ? (
                    <Link href={item.panel.feature.href} className="group hidden w-44 shrink-0 xl:block">
                      <div className="relative aspect-[3/4] overflow-hidden bg-ivory">
                        <Image
                          src={item.panel.feature.image.src}
                          alt={item.panel.feature.image.alt}
                          fill
                          sizes="176px"
                          className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
                        />
                      </div>
                      <p className="mt-3 text-[0.57rem] tracking-[0.14em] uppercase">
                        {item.panel.feature.label}
                      </p>
                    </Link>
                  ) : null}

                  <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-7">
                    {item.panel.columns.map((column, columnIndex) => (
                      <div key={column.heading ?? `column-${columnIndex}`}>
                        {column.heading ? (
                          <p className="mb-3 text-[0.55rem] font-semibold tracking-[0.18em] text-taupe uppercase">
                            {column.heading}
                          </p>
                        ) : null}
                        <ul className="space-y-2">
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="link-quiet text-[0.8125rem] text-ink-soft hover:text-ink"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {item.href === '/dresses' && dressCount > 0 ? (
                  <div className="border-t border-line px-8 py-4">
                    <Link href="/dresses" className="link-quiet text-[0.57rem] tracking-[0.14em] uppercase">
                      {`Browse all ${dressCount} gowns`}
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
