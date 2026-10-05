'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useMotionAllowed } from '@/hooks/useMotionAllowed'

type Props = {
  videoURL: string
  /** Poster, and the still shown instead of the film on phones. */
  poster?: { src: string; alt: string } | null
  mobileImage?: { src: string; alt: string } | null
}

/**
 * Hero film with a visitor-facing pause control.
 *
 * Matches the reference: the film is cropped to `center 28%`, phones get a
 * still image rather than the video, and a small "Pause film" button sits
 * bottom-right.
 *
 * Autoplaying video is a motion-sensitivity and data concern, so the control
 * is a real control, not decoration — and under `prefers-reduced-motion` the
 * film never starts, the still is shown instead, and the button is hidden
 * because there is nothing to pause.
 */
export const HeroMedia = ({ videoURL, poster, mobileImage }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const allowed = useMotionAllowed()

  /**
   * Starts as `true` because the film does autoplay in the common case, so
   * the control reads "Pause film" from the first paint rather than briefly
   * mislabelling itself. If the browser blocks autoplay the effect below
   * corrects it to "Play film".
   */
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !allowed) return

    // `play()` rejects when the browser blocks autoplay; the poster then
    // stands in and the control offers to start it.
    video.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    )
  }, [allowed])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      )
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  const still = mobileImage ?? poster

  return (
    <>
      {allowed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 hidden h-full w-full md:block"
          style={{ objectFit: 'cover', objectPosition: 'center 28%' }}
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster?.src}
          aria-hidden="true"
        >
          <source src={videoURL} type="video/mp4" />
        </video>
      ) : (
        /* Reduced motion, desktop: the poster stands in for the film. */
        poster ? (
          <Image
            src={poster.src}
            alt=""
            fill
            // Only ever shown from md up, so a phone never fetches it.
            sizes="(min-width: 768px) 100vw, 0px"
            priority
            className="absolute inset-0 hidden object-cover md:block"
            style={{ objectPosition: 'center 28%' }}
          />
        ) : null
      )}

      {/* Phones get a still rather than the film. */}
      {still ? (
        <Image
          src={still.src}
          alt=""
          fill
          // Hidden from md up, so a desktop never fetches it.
          sizes="(min-width: 768px) 0px, 100vw"
          priority
          className="absolute inset-0 object-cover md:hidden"
          style={{ objectPosition: 'center 20%' }}
        />
      ) : null}

      {allowed ? (
        <button
          type="button"
          onClick={toggle}
          className="absolute right-8 bottom-8 z-20 hidden border border-white/60 bg-black/20 px-4 py-2.5 text-[0.6rem] tracking-[0.12em] text-white uppercase transition-colors hover:bg-black/40 md:block"
        >
          {playing ? 'Pause film' : 'Play film'}
        </button>
      ) : null}
    </>
  )
}
