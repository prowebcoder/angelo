'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Route-level error boundary.
 *
 * Keeps the failure quiet for the visitor and offers a retry, while the real
 * error goes to the server logs rather than onto the page.
 */
const ErrorBoundary = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error('[frontend] route error', error)
  }, [error])

  return (
    <section className="py-(--spacing-section)">
      <div className="shell-narrow text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 text-h2">We could not load this page</h1>
        <p className="mt-5 leading-relaxed text-ink-soft">
          Please try again. If it keeps happening, call the boutique and we will help you directly.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="border border-ink bg-ink px-7 py-4 text-[0.6875rem] font-medium tracking-[0.16em] text-on-ink uppercase"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-line-strong px-7 py-4 text-[0.6875rem] font-medium tracking-[0.16em] uppercase"
          >
            Back to the homepage
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-8 text-xs text-ink-muted">{`Reference: ${error.digest}`}</p>
        ) : null}
      </div>
    </section>
  )
}

export default ErrorBoundary
