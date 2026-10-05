'use client'

import Link from 'next/link'
import { Heart, Search, User, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { HeaderData } from './nav-data'

type Props = {
  open: boolean
  onClose: () => void
  onOpenSearch: () => void
  data: HeaderData
}

/**
 * Purpose-built mobile navigation — not a shrunken desktop menu.
 *
 * A full-height drawer with accordion sections for the mega-menu groups, the
 * utility links the phone header cannot show, and the appointment CTA pinned
 * where a thumb can reach it. Focus is trapped while open.
 */
export const MobileMenu = ({ open, onClose, onOpenSearch, data }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  useFocusTrap(panelRef, open, onClose)

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={open ? undefined : true}
    >
      <div
        className={`absolute inset-0 bg-ink/35 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className={`absolute inset-y-0 left-0 flex w-[min(24rem,100vw)] flex-col bg-paper transition-transform duration-[450ms] ease-(--ease-editorial) ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <span className="font-serif text-xl tracking-[0.12em] uppercase">Angelo Bridal</span>
          <button type="button" onClick={onClose} className="-mr-2 p-2" autoFocus={open}>
            <X className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex flex-1 items-center gap-3 py-2 text-left text-sm text-ink-muted"
          >
            <Search className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
            Search gowns and designers
          </button>
        </div>

        {/*
          The drawer shows every destination as one list: the left/right split
          exists to balance the desktop header around the wordmark and means
          nothing on a phone.
        */}
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
          <ul className="divide-y divide-line">
            {[...data.leftItems, ...data.rightItems].map((item, index) => {
              const key = `${item.href}-${index}`
              const isExpanded = expanded === key

              if (!item.panel) {
                return (
                  <li key={key}>
                    <Link href={item.href} onClick={onClose} className="block py-4 font-serif text-xl">
                      {item.label}
                    </Link>
                  </li>
                )
              }

              return (
                <li key={key}>
                  <div className="flex items-center justify-between">
                    <Link href={item.href} onClick={onClose} className="flex-1 py-4 font-serif text-xl">
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : key)}
                      aria-expanded={isExpanded}
                      aria-controls={`mobile-section-${index}`}
                      className="p-3 text-ink-muted"
                    >
                      <span className="sr-only">{`${isExpanded ? 'Hide' : 'Show'} ${item.label} links`}</span>
                      <svg width="11" height="7" viewBox="0 0 11 7" aria-hidden="true" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <path d="M1 1l4.5 4.5L10 1" fill="none" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </button>
                  </div>

                  <div id={`mobile-section-${index}`} hidden={!isExpanded} className="pb-5">
                    {item.panel.columns.map((column, columnIndex) => (
                      <div key={column.heading ?? `col-${columnIndex}`} className="mb-5 last:mb-0">
                        {column.heading ? (
                          <p className="mb-2 text-[0.625rem] font-medium tracking-[0.22em] text-taupe uppercase">
                            {column.heading}
                          </p>
                        ) : null}
                        <ul className="space-y-2.5">
                          {column.links.map((link) => (
                            <li key={link.href}>
                              <Link href={link.href} onClick={onClose} className="block text-[0.9375rem] text-ink-soft">
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-line px-5 py-5">
          <div className="mb-4 flex items-center gap-5 text-sm text-ink-soft">
            <Link href="/wishlist" onClick={onClose} className="inline-flex items-center gap-2">
              <Heart className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
              Wishlist
            </Link>
            {data.bridalPortalURL ? (
              <a href={data.bridalPortalURL} className="inline-flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
                Bridal portal
              </a>
            ) : null}
          </div>
          <Link
            href="/your-appointment"
            onClick={onClose}
            className="block bg-ink py-4 text-center text-[0.6875rem] font-medium tracking-[0.16em] text-on-ink uppercase"
          >
            {data.appointmentLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
