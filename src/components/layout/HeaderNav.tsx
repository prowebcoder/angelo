'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Menu, Search, User } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useSavedLists } from '@/components/dresses/SavedListsProvider'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { HeaderMenu } from './HeaderMenu'
import { MobileMenu } from './MobileMenu'
import type { HeaderData } from './nav-data'

type Props = { data: HeaderData; dressCount: number }

/** Scroll distance after which the header turns solid. */
const SOLID_AFTER = 40

/**
 * Site header.
 *
 * Follows the reference layout: fixed, offset below the announcement strip,
 * laid out as a three-column grid with the logo centred. It starts
 * transparent with white type over a full-bleed hero and transitions to a
 * solid paper background on scroll — or is solid from the top on pages that
 * have no hero.
 *
 * The mega menu opens on hover for pointer users and on click/Enter for
 * keyboard users; Escape closes it and returns focus to the trigger.
 */
export const HeaderNav = ({ data, dressCount }: Props) => {
  const pathname = usePathname()
  const { wishlist, ready } = useSavedLists()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const panelIdBase = useId()

  /**
   * Open state is tagged with the route it was opened on, so navigating
   * closes every overlay without an effect that writes state during render.
   */
  const [overlay, setOverlay] = useState<{ path: string; panel: string | null; mobile: boolean; search: boolean }>({
    path: pathname,
    panel: null,
    mobile: false,
    search: false,
  })

  const current = overlay.path === pathname ? overlay : { path: pathname, panel: null, mobile: false, search: false }
  const openPanel = current.panel
  const mobileOpen = current.mobile
  const searchOpen = current.search

  const patchOverlay = (patch: { panel?: string | null; mobile?: boolean; search?: boolean }) =>
    setOverlay((previous) => {
      const base =
        previous.path === pathname ? previous : { path: pathname, panel: null, mobile: false, search: false }
      return { ...base, path: pathname, ...patch }
    })

  const setOpenPanel = (panel: string | null) => patchOverlay({ panel })
  const setMobileOpen = (mobile: boolean) => patchOverlay({ mobile })
  const setSearchOpen = (search: boolean) => patchOverlay({ search })

  /**
   * Transparency depends on two things: whether this page has a full-bleed
   * hero to sit over, and whether the visitor has scrolled past it. The hero
   * marks itself with `data-hero`, so the header needs no knowledge of which
   * routes have one.
   */
  const [solid, setSolid] = useState(true)

  useEffect(() => {
    const hasHero = Boolean(document.querySelector('[data-hero]'))

    const update = () => setSolid(!hasHero || window.scrollY > SOLID_AFTER)

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
    // Re-evaluate on navigation: the next page may not have a hero.
  }, [pathname])

  useEffect(() => {
    if (!openPanel) return

    const close = () => setOverlay((previous) => ({ ...previous, panel: null }))
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openPanel])

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  // A grace period stops the panel flickering shut as the pointer crosses the
  // gap between trigger and panel.
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpenPanel(null), 140)
  }

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const wishlistCount = ready ? wishlist.length : 0

  // Over a hero the header is white-on-image; once solid it is ink on paper.
  const tone = solid ? 'text-ink' : 'text-white'
  const iconTone = solid ? 'text-ink-soft hover:text-ink' : 'text-white/85 hover:text-white'

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main"
        className={`fixed inset-x-0 top-6 z-[100] grid h-[66px] items-center gap-2 px-4 transition-[height,background-color,color,box-shadow] duration-[400ms] ease-(--ease) md:top-7 md:h-[92px] md:px-10 ${tone} ${
          solid ? 'bg-paper/95 shadow-[0_1px_0_0_var(--color-line)] backdrop-blur-sm' : 'bg-transparent'
        }`}
        // Three columns with the wordmark centred, as the reference lays it
        // out: menu left, logo, menu plus utilities right.
        style={{ gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)' }}
      >
        {/* Left of the wordmark */}
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-2 p-2 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
            <span className="sr-only">Open menu</span>
          </button>

          <HeaderMenu
            items={data.leftItems}
            side="left"
            idBase={panelIdBase}
            openPanel={openPanel}
            setOpenPanel={setOpenPanel}
            cancelClose={cancelClose}
            scheduleClose={scheduleClose}
            isCurrent={isCurrent}
            dressCount={dressCount}
          />
        </div>

        {/*
          Centre: the wordmark. Two stacked images cross-faded by opacity, as
          the reference does it — the light mark reads over the hero and the
          dark one over paper. Falls back to inverting the dark artwork when
          no light version has been uploaded, and to a text wordmark when
          there is no logo at all.
        */}
        <Link href="/" className="relative shrink-0 justify-self-center" aria-label="Angelo Bridal — home">
          {data.logo ? (
            <span className="relative block h-4 md:h-5">
              <Image
                src={data.logo.src}
                alt={data.logo.alt}
                width={data.logo.width}
                height={data.logo.height}
                priority
                className={`h-4 w-auto transition-opacity duration-[400ms] md:h-5 ${
                  solid ? 'opacity-100' : data.logoLight ? 'opacity-0' : 'opacity-100 brightness-0 invert'
                }`}
              />
              {data.logoLight ? (
                <Image
                  src={data.logoLight.src}
                  alt=""
                  width={data.logoLight.width}
                  height={data.logoLight.height}
                  priority
                  aria-hidden="true"
                  className={`absolute inset-0 h-4 w-auto transition-opacity duration-[400ms] md:h-5 ${
                    solid ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              ) : null}
            </span>
          ) : (
            <span className="font-serif text-xl tracking-[0.12em] uppercase md:text-2xl">Angelo Bridal</span>
          )}
        </Link>

        {/* Right of the wordmark: destinations, then utilities */}
        <div className="flex min-w-0 items-center justify-end gap-[clamp(0.7rem,1vw,1.25rem)]">
          <HeaderMenu
            items={data.rightItems}
            side="right"
            idBase={panelIdBase}
            openPanel={openPanel}
            setOpenPanel={setOpenPanel}
            cancelClose={cancelClose}
            scheduleClose={scheduleClose}
            isCurrent={isCurrent}
            dressCount={dressCount}
          />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`p-1.5 transition-colors ${iconTone}`}
            aria-label="Search"
          >
            <Search className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
          </button>

          <Link
            href="/wishlist"
            className={`relative p-1.5 transition-colors ${iconTone}`}
            aria-label={wishlistCount ? `Wishlist, ${wishlistCount} saved` : 'Wishlist'}
          >
            <Heart className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
            {wishlistCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-taupe px-1 text-[0.5rem] font-semibold text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          {data.bridalPortalURL ? (
            <a
              href={data.bridalPortalURL}
              className={`hidden p-1.5 transition-colors md:inline-flex ${iconTone}`}
              aria-label="Bridal portal"
            >
              <User className="h-4 w-4" aria-hidden="true" strokeWidth={1.25} />
            </a>
          ) : null}

          <Link
            href="/your-appointment"
            className={`hidden min-h-[39px] min-w-[118px] items-center justify-center border px-3 text-[0.53rem] font-semibold tracking-[0.1em] uppercase backdrop-blur-[5px] transition-colors md:inline-flex ${
              solid
                ? 'border-ink bg-ink text-paper hover:bg-transparent hover:text-ink'
                : 'border-white/70 bg-black/15 text-white hover:bg-white hover:text-ink'
            }`}
          >
            {data.appointmentLabel}
          </Link>
        </div>
      </nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        data={data}
        onOpenSearch={() => {
          setMobileOpen(false)
          setSearchOpen(true)
        }}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
