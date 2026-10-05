'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export type GalleryImage = { src: string; alt: string; width: number; height: number; caption?: string }

/**
 * Dress gallery.
 *
 * Mobile is a native scroll-snap carousel — real swipe physics, no gesture
 * library, and it degrades to a horizontal scroller without JavaScript.
 * Desktop pairs a large frame with thumbnails and a full-screen zoom view.
 */
export const DressGallery = ({ images, dressName }: { images: GalleryImage[]; dressName: string }) => {
  const [index, setIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  useFocusTrap(zoomRef, zoomOpen, () => setZoomOpen(false))

  const count = images.length

  const go = useCallback(
    (next: number) => {
      if (!count) return
      const target = (next + count) % count
      setIndex(target)
      // Keep the mobile scroller in step when navigation comes from a button.
      const track = trackRef.current
      if (track) {
        track.scrollTo({ left: track.clientWidth * target, behavior: 'smooth' })
      }
    },
    [count],
  )

  // Track which slide the mobile scroller has settled on.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = Math.round(track.scrollLeft / track.clientWidth)
        setIndex((current) => (next !== current && next >= 0 && next < count ? next : current))
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [count])

  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(index + 1)
      if (event.key === 'ArrowLeft') go(index - 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [zoomOpen, index, go])

  if (!count) {
    return <div className="aspect-[4/5] w-full bg-ivory" aria-hidden="true" />
  }

  const active = images[index]

  return (
    <>
      {/* Mobile: snap carousel */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          role="group"
          aria-roledescription="carousel"
          aria-label={`${dressName} photographs`}
        >
          {images.map((image, imageIndex) => (
            <div
              key={`${image.src}-${imageIndex}`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-ivory"
              role="group"
              aria-roledescription="slide"
              aria-label={`${imageIndex + 1} of ${count}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                priority={imageIndex === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {images.map((image, dotIndex) => (
              <button
                key={`dot-${image.src}-${dotIndex}`}
                type="button"
                onClick={() => go(dotIndex)}
                aria-label={`Go to photograph ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={`h-1 transition-all duration-300 ${
                  dotIndex === index ? 'w-6 bg-ink' : 'w-1.5 bg-line-strong'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: main frame with thumbnails */}
      <div className="hidden gap-4 md:flex">
        {count > 1 ? (
          <div className="flex w-20 shrink-0 flex-col gap-3">
            {images.map((image, thumbIndex) => (
              <button
                key={`thumb-${image.src}-${thumbIndex}`}
                type="button"
                onClick={() => setIndex(thumbIndex)}
                aria-label={`View photograph ${thumbIndex + 1} of ${count}`}
                aria-current={thumbIndex === index}
                className={`relative aspect-[4/5] overflow-hidden bg-ivory transition-opacity ${
                  thumbIndex === index ? 'opacity-100 ring-1 ring-ink' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative flex-1">
          <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
            <Image
              src={active.src}
              alt={active.alt}
              fill
              sizes="(min-width: 1280px) 45vw, 50vw"
              priority
              className="object-cover"
            />
          </div>

          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute right-4 bottom-4 inline-flex items-center gap-2 bg-paper/90 px-4 py-2.5 text-[0.625rem] font-medium tracking-[0.16em] uppercase backdrop-blur-sm transition-colors hover:bg-paper"
          >
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.5} />
            Zoom
          </button>

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="absolute top-1/2 left-4 grid h-10 w-10 -translate-y-1/2 place-items-center bg-paper/90 backdrop-blur-sm transition-colors hover:bg-paper"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
                <span className="sr-only">Previous photograph</span>
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="absolute top-1/2 right-4 grid h-10 w-10 -translate-y-1/2 place-items-center bg-paper/90 backdrop-blur-sm transition-colors hover:bg-paper"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" strokeWidth={1.25} />
                <span className="sr-only">Next photograph</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      {active.caption ? <p className="mt-3 text-xs text-ink-muted">{active.caption}</p> : null}

      {/* Full-screen zoom */}
      {zoomOpen ? (
        <div className="fixed inset-0 z-50 bg-ink/95">
          <div ref={zoomRef} role="dialog" aria-modal="true" aria-label={`${dressName} enlarged`} tabIndex={-1} className="flex h-full flex-col">
            <div className="flex items-center justify-between px-5 py-4 text-on-ink">
              <p className="text-[0.625rem] tracking-[0.18em] uppercase">{`${index + 1} / ${count}`}</p>
              <button type="button" onClick={() => setZoomOpen(false)} className="-mr-2 p-2">
                <X className="h-6 w-6" aria-hidden="true" strokeWidth={1.25} />
                <span className="sr-only">Close enlarged view</span>
              </button>
            </div>

            <div className="relative flex-1 overflow-auto">
              <div className="relative mx-auto h-full w-full max-w-5xl">
                <Image src={active.src} alt={active.alt} fill sizes="100vw" className="object-contain" />
              </div>
            </div>

            {count > 1 ? (
              <div className="flex items-center justify-center gap-6 py-5 text-on-ink">
                <button type="button" onClick={() => go(index - 1)} className="p-2">
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" strokeWidth={1.25} />
                  <span className="sr-only">Previous photograph</span>
                </button>
                <button type="button" onClick={() => go(index + 1)} className="p-2">
                  <ChevronRight className="h-6 w-6" aria-hidden="true" strokeWidth={1.25} />
                  <span className="sr-only">Next photograph</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
