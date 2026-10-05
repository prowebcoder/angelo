import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Dresses } from './src/collections/Dresses'
import { Designers } from './src/collections/Designers'
import { Pages } from './src/collections/Pages'
import { Accessories, Events, FAQs, Posts, RealBrides } from './src/collections/Stories'
import { AlterationEnquiries, Appointments, ContactSubmissions, NewsletterSubscribers } from './src/collections/Submissions'
import { Media } from './src/collections/Media'
import { Taxonomies } from './src/collections/Taxonomies'
import { Users } from './src/collections/Users'
import { Footer } from './src/globals/Footer'
import { FormSettings } from './src/globals/FormSettings'
import { GiftCards } from './src/globals/GiftCards'
import { Homepage } from './src/globals/Homepage'
import { Navigation } from './src/globals/Navigation'
import { SiteSettings } from './src/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Required configuration, checked at startup.
 *
 * In production a missing value is fatal: falling back to a shared development
 * secret would let anyone forge a session cookie, and falling back to a
 * guessed connection string risks writing to the wrong database. In
 * development a fallback is allowed so `generate:types` and a fresh checkout
 * work without a `.env`, but it says so loudly.
 */
const required = (name: 'PAYLOAD_SECRET' | 'DATABASE_URL', developmentFallback: string): string => {
  const value = process.env[name]
  if (value) return value

  if (isProduction) {
    throw new Error(
      `${name} is not set. Set it in the environment before starting the app in production. See README.md.`,
    )
  }

  console.warn(`[payload] ${name} is not set — using a development fallback. Create a .env file (see .env.example).`)
  return developmentFallback
}

/**
 * Pins the TLS mode in a Postgres connection string.
 *
 * `pg` currently treats `prefer`, `require` and `verify-ca` as aliases for
 * `verify-full`, and warns on every boot that this will change: in
 * `pg` v9 / `pg-connection-string` v3 they adopt libpq semantics, where
 * `require` encrypts but verifies *nothing* — no certificate chain, no
 * hostname. A connection string copied from Neon or Vercel says
 * `sslmode=require`, so leaving it alone means a dependency bump would
 * silently downgrade us to an unverified connection, open to
 * man-in-the-middle.
 *
 * Rewriting those three to `verify-full` is exactly what `pg` does today, so
 * behaviour is unchanged now and protected later — and the warning goes away
 * because the intent is explicit.
 *
 * Left untouched: `disable`, `no-verify`, an already-explicit `verify-full`,
 * a string with no `sslmode` at all (a local server without TLS), and
 * anything carrying `uselibpqcompat`, which signals a deliberate choice of
 * libpq semantics — a self-signed certificate needs `sslmode=no-verify`
 * rather than this.
 */
const pinTLSMode = (connectionString: string): string => {
  if (/uselibpqcompat=/i.test(connectionString)) return connectionString

  return connectionString.replace(
    /([?&]sslmode=)(require|prefer|verify-ca)\b/i,
    (_match, prefix: string) => `${prefix}verify-full`,
  )
}

export default buildConfig({
  secret: required('PAYLOAD_SECRET', 'development-only-secret-replace-before-deploy'),
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' | Angelo Bridal' },
    importMap: { baseDir: dirname },
    // Dates written the way the boutique writes them, not 2026-10-05.
    dateFormat: 'd MMMM yyyy',
    components: {
      // Boutique overview shown above Payload's own collection list.
      beforeDashboard: ['/src/admin/Dashboard'],
      // A way back to the live site from any admin screen.
      beforeNavLinks: ['/src/admin/ViewSite'],
      // Says what this sign-in screen belongs to.
      beforeLogin: ['/src/admin/LoginNote'],
      graphics: {
        // The wordmark on the sign-in screen, the initial in the header.
        Logo: '/src/admin/Logo',
        Icon: '/src/admin/Icon',
      },
    },
  },
  /**
   * Order matters: the admin sidebar lists groups in the order they are first
   * met here, collections before globals. So this array is the running order
   * of the menu — what the boutique touches daily at the top, configuration
   * at the bottom — rather than any technical grouping.
   *
   *   The website · Gowns & designers · Stories & journal ·
   *   Enquiries · Photographs · Settings
   */
  collections: [
    // The website
    Pages,
    // Gowns & designers
    Dresses,
    Designers,
    Accessories,
    Taxonomies,
    // Stories & journal
    RealBrides,
    Posts,
    Events,
    FAQs,
    // Enquiries
    Appointments,
    AlterationEnquiries,
    ContactSubmissions,
    NewsletterSubscribers,
    // Photographs
    Media,
    // Settings
    Users,
  ],
  globals: [Homepage, Navigation, Footer, GiftCards, SiteSettings, FormSettings],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: pinTLSMode(
        required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/angelo_bridal'),
      ),
    },
    migrationDir: path.resolve(dirname, 'src/migrations'),
    /**
     * Schema push compares the config to the live database and alters it to
     * match. It is convenient in development, but it must never run against
     * production data — use `npm run migrate` there, so every change is a
     * reviewed, ordered, repeatable step.
     *
     * Set `PAYLOAD_DB_PUSH=false` to turn it off locally too, which is what
     * you want when a half-applied push has left the schema inconsistent:
     * push is not idempotent and will fail on objects that already exist.
     */
    push: process.env.PAYLOAD_DB_PUSH ? process.env.PAYLOAD_DB_PUSH === 'true' : !isProduction,
  }),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'src/payload-types.ts') },
})