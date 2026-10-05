'use client'

import { useSyncExternalStore } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Subscribes to the OS motion preference, which can change while a page is open. */
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getSnapshot = () => !window.matchMedia(REDUCED_MOTION).matches

/**
 * Whether this visitor wants motion.
 *
 * The OS preference is external state, so it is subscribed to rather than
 * copied into React state by an effect — which also keeps rendering pure.
 *
 * The server snapshot is `true`, i.e. the motion-capable layout is what ships
 * in the HTML. That is about layout stability rather than a preference for
 * animation: the scroll sequence is a very tall section, and rendering its
 * short form first would collapse and re-expand the page on hydration for the
 * majority of visitors.
 *
 * Nothing can actually move before hydration — video playback and the scroll
 * handler are both started from effects — so a visitor who has asked for
 * reduced motion still never sees a frame of animation; their layout simply
 * settles once the client reads the preference.
 */
export const useMotionAllowed = (): boolean => useSyncExternalStore(subscribe, getSnapshot, () => true)
