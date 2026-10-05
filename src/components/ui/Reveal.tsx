'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Stagger for items in a grid, in milliseconds. */
  delay?: number
  className?: string
}

/**
 * Fades content up once as it enters the viewport.
 *
 * The one motion flourish used site-wide. It starts visible and only hides
 * itself when it knows motion is wanted, so content is never trapped behind a
 * missing IntersectionObserver, a reduced-motion preference, or no JavaScript.
 */
export const Reveal = ({ children, delay = 0, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'static' | 'hidden' | 'shown'>('static')

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReduced.matches || typeof IntersectionObserver === 'undefined') return

    const node = ref.current
    if (!node) return

    // Already on screen at mount: leave it alone rather than flashing.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9) return

    setState('hidden')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('shown')
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={[
        state !== 'static' ? 'transition-[opacity,transform] duration-[900ms] ease-(--ease-editorial)' : '',
        state === 'hidden' ? 'opacity-0 translate-y-6' : '',
        state === 'shown' ? 'opacity-100 translate-y-0' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={state === 'shown' && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
