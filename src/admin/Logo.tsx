/* eslint-disable @next/next/no-img-element */

/**
 * The boutique wordmark, shown on the login screen.
 *
 * Served from `public/brand/` rather than the media library on purpose: the
 * login screen renders before anyone is signed in and before any database
 * read, and uploads under `public/media` do not survive a deploy on Vercel.
 * A sign-in page that cannot show its own logo looks broken, so this one
 * depends on nothing.
 *
 * Both artworks ship and CSS picks between them, so the mark stays legible
 * whichever colour scheme the browser asks for. `next/image` is not used
 * here: these are two fixed, already-sized PNGs inside Payload's own React
 * tree, and the optimiser would only add a round trip.
 */
const Logo = () => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <picture>
      <source srcSet="/brand/wordmark-light.png" media="(prefers-color-scheme: dark)" />
      <img
        src="/brand/wordmark-dark.png"
        alt="Angelo Bridal Boutique"
        width={280}
        height={63}
        style={{ width: '280px', maxWidth: '100%', height: 'auto' }}
      />
    </picture>
  </div>
)

export default Logo
