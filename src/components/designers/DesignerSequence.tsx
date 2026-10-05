'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionAllowed } from '@/hooks/useMotionAllowed'

export type SequenceDesigner = {
  id: number
  name: string
  slug: string
  description?: string | null
  image?: { src: string; alt: string } | null
  /** Focal point for the subject layer, e.g. `50% 26%`. */
  desktopPosition?: string
  mobilePosition?: string
}

type Props = {
  designers: SequenceDesigner[]
  eyebrow?: string | null
  heading?: string | null
}

/** Scroll distance allotted to each designer, matching the reference. */
const SCENE_HEIGHT_SVH = 64

/**
 * The homepage designer sequence.
 *
 * A tall section with a sticky full-height stage: as the visitor scrolls, each
 * designer cross-fades in as a blurred backdrop plus a sharp, edge-masked
 * subject, with the copy alternating left and right. That layering is what
 * gives the reference its depth, so it is reproduced rather than simplified
 * into a grid.
 *
 * Three things keep it honest rather than gratuitous:
 *
 * - Under `prefers-reduced-motion`, and whenever the visitor presses "View
 *   still sequence", it renders as a plain stacked list instead.
 * - Without JavaScript the same static list is what ships, so the designers
 *   are always readable.
 * - Scroll work is throttled to one `requestAnimationFrame` and only writes
 *   inline opacity, so it never triggers React re-renders while scrolling.
 */
export const DesignerSequence = ({ designers, eyebrow, heading }: Props) => {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([])
  const copyRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLParagraphElement>(null)
  const frame = useRef(0)

  const [stillRequested, setStillRequested] = useState(false)
  const count = designers.length

  const motionAllowed = useMotionAllowed()

  // Derived, not stored: either the visitor asked for stills, or the OS did.
  const animated = motionAllowed && !stillRequested

  /**
   * Paints the current scroll position straight onto the DOM.
   *
   * Deliberately not React state: this runs on every scroll frame, and a
   * re-render per frame would be far more expensive than setting opacity.
   */
  const paint = useCallback(() => {
    const section = sectionRef.current
    if (!section || !count) return

    const rect = section.getBoundingClientRect()
    const scrollable = section.offsetHeight - window.innerHeight
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 1))
    const progress = scrollable > 0 ? scrolled / scrollable : 0

    // Position along the sequence, e.g. 3.4 = 40% of the way from 3 to 4.
    const position = progress * (count - 1)
    const index = Math.min(Math.floor(position), count - 1)
    const blend = position - index

    sceneRefs.current.forEach((scene, sceneIndex) => {
      if (!scene) return
      let opacity = 0
      if (sceneIndex === index) opacity = 1 - blend
      else if (sceneIndex === index + 1) opacity = blend
      scene.style.opacity = String(opacity)
      // Keep the inactive scenes out of the compositing work.
      scene.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
    })

    copyRefs.current.forEach((copy, copyIndex) => {
      if (!copy) return
      let opacity = 0
      if (copyIndex === index) opacity = 1 - blend
      else if (copyIndex === index + 1) opacity = blend
      copy.style.opacity = String(opacity)
      // A small lift as the copy arrives, easing out as it leaves.
      copy.style.transform = `translateY(${(1 - opacity) * 14}px)`
      copy.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
    })

    if (progressRef.current) progressRef.current.style.width = `${progress * 100}%`
    if (counterRef.current) {
      const shown = Math.min(count, Math.round(position) + 1)
      counterRef.current.textContent = `${String(shown).padStart(2, '0')} / ${String(count).padStart(2, '0')}`
    }
  }, [count])

  useEffect(() => {
    if (!animated) return

    const onScroll = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [animated, paint])

  /** Scrolls to a designer's own point in the sequence. */
  const goTo = (target: number) => {
    const section = sectionRef.current
    if (!section || count < 2) return
    const clamped = Math.min(Math.max(target, 0), count - 1)
    const scrollable = section.offsetHeight - window.innerHeight
    const top = section.offsetTop + (clamped / (count - 1)) * scrollable
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const currentIndex = () => {
    const section = sectionRef.current
    if (!section || count < 2) return 0
    const scrollable = section.offsetHeight - window.innerHeight
    const scrolled = Math.min(Math.max(-section.getBoundingClientRect().top, 0), Math.max(scrollable, 1))
    return Math.round((scrolled / scrollable) * (count - 1))
  }

  if (!count) return null

  /* ------------------------------------------------------------------ */
  /* Static list — the server-rendered default and the reduced-motion    */
  /* fallback.                                                           */
  /* ------------------------------------------------------------------ */
  if (!animated) {
    return (
      <section className="bg-[#111] py-(--spacing-section) text-white">
        <div className="shell">
          <header className="max-w-3xl">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {heading ? <h2 className="mt-3 text-h2">{heading}</h2> : null}
          </header>

          <ul className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {designers.map((designer, index) => (
              <li key={designer.id}>
                <Link href={`/designers/${designer.slug}`} className="group block">
                  <p className="text-[0.57rem] font-semibold tracking-[0.18em] text-white/50 uppercase">
                    {`Designer · ${String(index + 1).padStart(2, '0')}`}
                  </p>
                  <div className="relative mt-4 aspect-[3/4] overflow-hidden bg-[#1b1a18]">
                    {designer.image ? (
                      <Image
                        src={designer.image.src}
                        alt={designer.image.alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
                        style={{ objectPosition: designer.desktopPosition ?? '50% 26%' }}
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-5 font-serif text-[1.75rem] leading-tight">{designer.name}</h3>
                  {designer.description ? (
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#e4dfd7]">{designer.description}</p>
                  ) : null}
                  <span className="mt-4 inline-block text-[0.57rem] font-semibold tracking-[0.14em] text-white/70 uppercase">
                    Discover the collection
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {stillRequested ? (
            <button
              type="button"
              onClick={() => setStillRequested(false)}
              className="mt-12 border border-white/40 px-4 py-2.5 text-[0.6rem] font-semibold tracking-[0.12em] uppercase hover:bg-white hover:text-ink"
            >
              Play the sequence
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  /* ------------------------------------------------------------------ */
  /* Scroll sequence                                                     */
  /* ------------------------------------------------------------------ */
  return (
    <section
      ref={sectionRef}
      className="relative bg-[#111] text-white"
      style={{ height: `${count * SCENE_HEIGHT_SVH}svh` }}
      aria-label={heading ?? 'Our designers'}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden bg-[#111] isolate">
        {/* Scene layers */}
        <div className="absolute inset-0">
          {designers.map((designer, index) => (
            <div
              key={designer.id}
              ref={(node) => {
                sceneRefs.current[index] = node
              }}
              className="absolute -inset-[1.5%] overflow-hidden"
              style={{
                opacity: index === 0 ? 1 : 0,
                transform: 'scale(1.018)',
                willChange: 'opacity',
              }}
              aria-hidden="true"
            >
              {designer.image ? (
                <>
                  {/* Blurred, desaturated backdrop. */}
                  <Image
                    src={designer.image.src}
                    alt=""
                    fill
                    sizes="110vw"
                    priority={index === 0}
                    className="absolute -inset-[5%] h-[110%] w-[110%] scale-[1.08] object-cover"
                    style={{
                      objectPosition: designer.desktopPosition ?? '50% 26%',
                      filter: 'blur(16px) saturate(0.86)',
                      opacity: 0.72,
                    }}
                  />
                  {/* Sharp subject, edge-masked into the backdrop. */}
                  <div
                    className="absolute top-0 left-1/2 h-full w-[min(48vw,820px)] -translate-x-1/2 overflow-hidden max-md:left-0 max-md:w-screen max-md:translate-x-0"
                    style={{
                      maskImage: 'linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%)',
                      WebkitMaskImage:
                        'linear-gradient(90deg, transparent 0, #000 12%, #000 88%, transparent 100%)',
                    }}
                  >
                    <Image
                      src={designer.image.src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 48vw, 100vw"
                      priority={index === 0}
                      className="object-contain"
                      style={{
                        objectPosition: designer.desktopPosition ?? '50% 26%',
                        filter: 'saturate(0.95)',
                      }}
                    />
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>

        {/* Heading */}
        <header className="absolute top-[12vh] left-[4vw] z-[8] max-w-[min(34vw,32rem)] max-md:left-[1.2rem] max-md:max-w-[calc(100%-2.4rem)]">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {heading ? <h2 className="mt-3 text-h2-sm">{heading}</h2> : null}
          <button
            type="button"
            onClick={() => setStillRequested(true)}
            className="mt-5 border border-white/40 px-3 py-2 text-[0.55rem] font-semibold tracking-[0.12em] uppercase transition-colors hover:bg-white hover:text-ink"
          >
            View still sequence
          </button>
        </header>

        {/* Copy, alternating sides */}
        <div className="absolute inset-0">
          {designers.map((designer, index) => (
            <div
              key={designer.id}
              ref={(node) => {
                copyRefs.current[index] = node
              }}
              className={`absolute top-1/2 z-[7] w-[min(27vw,440px)] -translate-y-1/2 max-md:inset-x-[1.2rem] max-md:top-auto max-md:bottom-[13vh] max-md:w-auto max-md:translate-y-0 max-md:text-left ${
                index % 2 === 0 ? 'left-[5vw] max-lg:left-[3vw]' : 'right-[5vw] text-right max-lg:right-[3vw]'
              }`}
              style={{ opacity: index === 0 ? 1 : 0, willChange: 'opacity, transform' }}
            >
              <p className="eyebrow">{`Designer · ${String(index + 1).padStart(2, '0')}`}</p>
              <h3 className="mt-2 font-serif text-[clamp(2.2rem,3.5vw,4.5rem)] leading-[0.98] tracking-[-0.03em]">
                {designer.name}
              </h3>
              {designer.description ? (
                <p
                  className={`mt-3 max-w-[330px] text-[0.9375rem] leading-relaxed text-[#e4dfd7] ${
                    index % 2 === 0 ? '' : 'ml-auto'
                  }`}
                >
                  {designer.description}
                </p>
              ) : null}
              <Link
                href={`/designers/${designer.slug}`}
                // The layer is pointer-transparent so scrolling works over it;
                // the one interactive element opts back in.
                className="pointer-events-auto mt-5 inline-block text-[0.57rem] font-semibold tracking-[0.14em] uppercase underline decoration-white/40 underline-offset-[0.4em] hover:decoration-white"
              >
                Discover the collection
              </Link>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute right-[4vw] bottom-[5vh] z-[9] flex items-center gap-[0.9rem] max-md:right-[1.2rem]">
          <button
            type="button"
            onClick={() => goTo(currentIndex() - 1)}
            aria-label="Previous designer"
            className="grid h-9 w-9 place-items-center border border-white/40 transition-colors hover:bg-white hover:text-ink"
          >
            <span aria-hidden="true">←</span>
          </button>
          <p
            ref={counterRef}
            aria-live="polite"
            className="text-[0.57rem] font-semibold tracking-[0.14em] tabular-nums"
          >
            {`01 / ${String(count).padStart(2, '0')}`}
          </p>
          <button
            type="button"
            onClick={() => goTo(currentIndex() + 1)}
            aria-label="Next designer"
            className="grid h-9 w-9 place-items-center border border-white/40 transition-colors hover:bg-white hover:text-ink"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Progress line */}
        <div className="absolute inset-x-[4vw] bottom-[3.1vh] z-[9] h-px bg-white/30 max-md:inset-x-[1.2rem] max-md:bottom-[2.4vh]">
          <span ref={progressRef} className="block h-px bg-white" style={{ width: '0%' }} />
        </div>
      </div>
    </section>
  )
}
