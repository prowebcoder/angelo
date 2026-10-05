'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionAllowed } from '@/hooks/useMotionAllowed'
import type { GalleryImage } from './DressGallery'

/** Scroll distance allotted to each chapter. */
const CHAPTER_HEIGHT_SVH = 70

export type Chapter = { label: string; heading: string; body?: string | null }

type Props = {
  images: GalleryImage[]
  chapters: Chapter[]
  dressName: string
  eyebrow?: string
  heading?: string
}

/**
 * Scroll-driven gown explorer.
 *
 * The reference walks a visitor through each approved photograph in turn —
 * silhouette, bodice, detail, movement — on a sticky stage, with a progress
 * line and a chapter label. It is the gown-page counterpart to the homepage
 * designer sequence.
 *
 * Chapters are capped at the number of photographs that actually exist, so a
 * gown with two approved views gets two chapters rather than an invented
 * third. Under `prefers-reduced-motion`, or when the visitor asks for stills,
 * it renders as a plain captioned list.
 */
export const DressExplorer = ({ images, chapters, dressName, eyebrow, heading }: Props) => {
  const sectionRef = useRef<HTMLElement>(null)
  const frameRefs = useRef<(HTMLDivElement | null)[]>([])
  const copyRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLParagraphElement>(null)
  const frame = useRef(0)

  const [stillRequested, setStillRequested] = useState(false)
  const motionAllowed = useMotionAllowed()
  const animated = motionAllowed && !stillRequested

  // Never promise a view the boutique has not photographed.
  const scenes = chapters.slice(0, images.length)
  const count = scenes.length

  const paint = useCallback(() => {
    const section = sectionRef.current
    if (!section || !count) return

    const rect = section.getBoundingClientRect()
    const scrollable = section.offsetHeight - window.innerHeight
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 1))
    const progress = scrollable > 0 ? scrolled / scrollable : 0

    const position = progress * Math.max(count - 1, 1)
    const index = Math.min(Math.floor(position), count - 1)
    const blend = position - index

    frameRefs.current.forEach((node, i) => {
      if (!node) return
      let opacity = 0
      if (i === index) opacity = 1 - blend
      else if (i === index + 1) opacity = blend
      node.style.opacity = String(opacity)
      node.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
      // A slow drift, so a still photograph still feels alive.
      node.style.transform = `scale(${1.02 + (1 - opacity) * 0.02})`
    })

    copyRefs.current.forEach((node, i) => {
      if (!node) return
      let opacity = 0
      if (i === index) opacity = 1 - blend
      else if (i === index + 1) opacity = blend
      node.style.opacity = String(opacity)
      node.style.transform = `translateY(${(1 - opacity) * 12}px)`
      node.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
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

  if (!count) return null

  /* Static fallback: the same chapters as a captioned list. */
  if (!animated) {
    return (
      <section className="bg-ivory py-(--spacing-section)">
        <div className="shell">
          <header className="max-w-2xl">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {heading ? <h2 className="mt-3 text-h2-sm">{heading}</h2> : null}
          </header>

          <ol className="mt-14 space-y-16">
            {scenes.map((chapter, index) => (
              <li key={chapter.label} className="grid gap-8 md:grid-cols-2 md:items-center">
                <div className="relative aspect-[4/5] overflow-hidden bg-paper">
                  <Image
                    src={images[index].src}
                    alt={images[index].alt}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="eyebrow">{`${String(index + 1).padStart(2, '0')} · ${chapter.label}`}</p>
                  <h3 className="mt-3 font-serif text-[clamp(1.5rem,2.2vw,2.2rem)] leading-tight">
                    {chapter.heading}
                  </h3>
                  {chapter.body ? (
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{chapter.body}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          {stillRequested ? (
            <button
              type="button"
              onClick={() => setStillRequested(false)}
              className="mt-12 border border-line-strong px-4 py-2.5 text-[0.6rem] font-semibold tracking-[0.12em] uppercase hover:border-ink"
            >
              Play the sequence
            </button>
          ) : null}
        </div>
      </section>
    )
  }

  /* Scroll sequence */
  return (
    <section
      ref={sectionRef}
      id="explore-dress"
      className="relative bg-[#141311] text-white"
      style={{ height: `${count * CHAPTER_HEIGHT_SVH}svh` }}
      aria-label={heading ?? `Explore ${dressName}`}
    >
      <div className="sticky top-0 isolate h-[100svh] overflow-hidden">
        {/* Photograph layers */}
        <div className="absolute inset-0">
          {scenes.map((chapter, index) => (
            <div
              key={chapter.label}
              ref={(node) => {
                frameRefs.current[index] = node
              }}
              className="absolute inset-0"
              style={{ opacity: index === 0 ? 1 : 0, willChange: 'opacity, transform' }}
              aria-hidden="true"
            >
              <Image
                src={images[index].src}
                alt=""
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
                style={{ objectPosition: 'center 22%' }}
              />
            </div>
          ))}
        </div>

        {/* Scrim: clear through the middle so the gown reads. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Heading */}
        <header className="absolute top-[12vh] left-[4vw] z-[8] max-w-[min(32vw,28rem)] max-md:left-[1.2rem] max-md:max-w-[calc(100%-2.4rem)]">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {heading ? <h2 className="mt-3 text-h2-sm">{heading}</h2> : null}
          <button
            type="button"
            onClick={() => setStillRequested(true)}
            className="mt-5 border border-white/40 px-3 py-2 text-[0.55rem] font-semibold tracking-[0.12em] uppercase transition-colors hover:bg-white hover:text-ink"
          >
            Use still gallery
          </button>
        </header>

        {/* Chapter copy */}
        <div className="absolute inset-0">
          {scenes.map((chapter, index) => (
            <div
              key={chapter.label}
              ref={(node) => {
                copyRefs.current[index] = node
              }}
              className="absolute right-[4vw] bottom-[14vh] z-[7] w-[min(28vw,420px)] text-right max-md:inset-x-[1.2rem] max-md:w-auto max-md:text-left"
              style={{ opacity: index === 0 ? 1 : 0, willChange: 'opacity, transform' }}
            >
              <p className="eyebrow">{`${String(index + 1).padStart(2, '0')} · ${chapter.label}`}</p>
              <h3 className="mt-2 font-serif text-[clamp(1.5rem,2.6vw,3.2rem)] leading-[1.02] tracking-[-0.025em]">
                {chapter.heading}
              </h3>
              {chapter.body ? (
                <p className="mt-3 ml-auto max-w-[330px] text-[0.9375rem] leading-relaxed text-white/80 max-md:ml-0">
                  {chapter.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        {/* Counter and progress */}
        <p
          ref={counterRef}
          aria-live="polite"
          className="absolute bottom-[6vh] left-[4vw] z-[9] text-[0.57rem] font-semibold tracking-[0.14em] tabular-nums max-md:left-[1.2rem]"
        >
          {`01 / ${String(count).padStart(2, '0')}`}
        </p>

        <div className="absolute inset-x-[4vw] bottom-[3.5vh] z-[9] h-px bg-white/30 max-md:inset-x-[1.2rem]">
          <span ref={progressRef} className="block h-px bg-white" style={{ width: '0%' }} />
        </div>

        <p className="absolute right-[4vw] bottom-[6vh] z-[9] text-[0.55rem] tracking-[0.14em] text-white/60 uppercase max-md:hidden">
          Scroll to explore
        </p>
      </div>
    </section>
  )
}
