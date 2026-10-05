/**
 * Route loading state.
 *
 * Deliberately plain: a quiet line rather than skeleton blocks, so a fast
 * navigation does not flash a layout that is immediately replaced.
 */
const Loading = () => (
  <div className="flex min-h-[60svh] items-center justify-center" role="status" aria-live="polite">
    <p className="text-[0.6875rem] tracking-[0.22em] text-ink-muted uppercase">Loading</p>
  </div>
)

export default Loading
