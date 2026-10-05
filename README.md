# Angelo Bridal

A bridal boutique website and content management system. Next.js App Router on
the front, Payload CMS on PostgreSQL behind it, with every page, gown,
designer, story and setting editable at `/admin`.

The design system and seeded content are taken from the live Angelo Bridal
site, so this build carries the boutique's own palette, typography and words
rather than a reinterpretation. See [Design system](#design-system) and
[Where the content came from](#where-the-content-came-from).

## Requirements

- Node.js 20.9+ (developed on 24)
- PostgreSQL 13+ (a hosted Neon/Supabase database works well)

## Setup

```bash
npm install
cp .env.example .env     # then fill in the values below

npm run seed             # copy, navigation, pages, designers, settings
npm run import:media     # logo, designer headers, editorial imagery
npm run import:catalogue # the gowns and their photographs
npm run import:accessories # the veils and shoes

npm run dev              # http://localhost:3000
```

Open `http://localhost:3000/admin` and create the first account. That first
user should have the **Super Admin** role.

The last two steps need the boutique assets staged in `.import/` — see
[Where the content came from](#where-the-content-came-from). Without them the
site still runs; the catalogue is simply empty.

### Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. Payload owns this schema. |
| `PAYLOAD_SECRET` | yes | Long random string used to sign sessions. Changing it signs everyone out. |
| `NEXT_PUBLIC_SERVER_URL` | yes | The site's own origin, e.g. `https://angelobridal.ie`. Used for canonical links, sitemap entries, absolute OG images and admin preview links. |
| `PAYLOAD_DB_PUSH` | no | `false` disables dev schema push. Set this if a half-applied push has left the schema inconsistent — push is not idempotent and fails on objects that already exist. |

In production both `DATABASE_URL` and `PAYLOAD_SECRET` are mandatory and the
app refuses to start without them, rather than falling back to a shared
development secret.

Email, analytics and maps are configured from the admin, not the environment,
so staff can change them without a deploy.

**On Neon**, point `DATABASE_URL` at the **direct (unpooled)** endpoint for
local work and migrations — schema changes through PgBouncer are unreliable.
Use the pooled endpoint in serverless production, where connection limits
matter more.

**TLS is pinned.** Connection strings copied from Neon or Vercel end in
`sslmode=require`. `pg` currently treats that as `verify-full`, but warns that
in `pg` v9 it will adopt libpq semantics, where `require` encrypts and
verifies nothing — no certificate chain, no hostname. So `payload.config.ts`
rewrites `require`, `prefer` and `verify-ca` to `verify-full` before the pool
is built. Behaviour is unchanged today, a dependency bump cannot silently
downgrade the connection, and the boot-time warning goes away. `disable`,
`no-verify` and anything carrying `uselibpqcompat` are left alone, so a
self-signed local certificate still works via `sslmode=no-verify`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run seed` | Creates filter terms, designers, navigation, footer, homepage, pages, questions, gift-card amounts and settings. Safe to re-run. |
| `npm run seed -- --refresh` | Also replaces seeded content that no editor has edited. Never overwrites edited work. |
| `npm run import:media` | Logo, designer header photographs, silhouette and editorial imagery |
| `npm run import:catalogue` | The gowns and their photographs |
| `npm run import:accessories` | The veils and shoes, and links them to the gowns for "Complete the look" |
| `npm run sync:details` | Fills price, sample size and style code on existing gowns |
| `npm run fix:designers` | Re-links gowns to designers from `.import/dresses.json` |
| `npm run generate:types` | Regenerates `src/payload-types.ts`. **Run after any change to a collection or global.** |
| `npm run generate:importmap` | Regenerates the admin import map. Run after adding a custom admin component. |
| `npm run migrate` / `migrate:create` | Payload migrations |
| `npm run import:dresses -- file.csv` | Validates a gown CSV and reports every problem; add `--commit` to write |

### A Windows gotcha worth knowing

`rm -rf .next` **silently fails while a `next dev` or `next start` process is
running**, because Windows will not delete open files. The build then reuses
stale prerendered HTML and you see old content with no error. Always stop the
server first:

```powershell
Get-Process -Name node | Stop-Process -Force
Remove-Item -Recurse -Force .next
npm run build
```

Leftover Next build workers can also keep port 3000 bound, so a new
`npm start` fails with `EADDRINUSE` while an older server keeps answering.

## Design system

Tokens, type scale and spacing come from the live site and live in
`src/app/globals.css`:

| | |
| --- | --- |
| Ink | `#11100e` |
| Paper | `#fbfaf7` |
| Ivory | `#f4f0e8` |
| Stone | `#d9d3c8` |
| Taupe (accent) | `#938a7c` |
| Hairline | ink at 18% |
| Headings | `Georgia, "Times New Roman", serif`, weight 400, line-height 0.96, tight negative tracking, `clamp(3.6rem, 8vw, 8.5rem)` for h1 |
| UI | `ui-sans-serif, system-ui, sans-serif, …`, uppercase, letter-spaced; buttons 48px minimum, square |
| Corners | square — radius 0 everywhere except pills and avatars |

Both families are system fonts. The reference declares
`--sans: var(--font-montserrat), Arial, sans-serif` but never defines
`--font-montserrat`, which makes that declaration invalid, so its body text
actually resolves to the system sans stack. Matching what it renders rather
than what it declares means no webfont to download and no flash of fallback
text.

The header is fixed and transparent over a full-bleed hero, turning solid on
scroll. It is a three-column grid with the wordmark centred and the menu split
either side of it — Wedding Dresses, Designers, Alterations and Our Brides to
the left; Accessories, Gift Cards, Events, Journal and About Angelo to the
right, followed by search, wishlist, portal and the appointment button. Each
navigation item carries its own **Which side of the logo** setting, so staff
can rebalance the menu without a release. It cross-fades between light and
dark logo artwork by opacity rather than filtering one mark, as the reference
does. The mobile drawer ignores the split and lists every destination once. A hero marks itself with `data-hero`; `main` uses
`:has()` to add top padding only on pages without one, so the header needs no
knowledge of routes.

### Homepage motion

Three pieces carry the reference's feel, all of them CMS-driven:

**Hero film.** `HeroMedia` autoplays a muted, looping film cropped to
`center 28%`, with a real "Pause film" control. Phones get a still instead of
the video. The film lives in `public/media/hero/` rather than the media
library, because Payload runs sharp over every upload and that has nothing to
offer an MP4.

**Designer scroll sequence.** `DesignerSequence` is the signature piece: a
section `64svh` tall per designer with a sticky `100svh` stage. Each designer
cross-fades in as a blurred, desaturated backdrop plus a sharp, edge-masked
subject, with copy alternating left and right, a progress hairline and
prev/next controls. Scroll work is throttled to one `requestAnimationFrame`
and writes inline opacity only, so it never re-renders React while scrolling.

**Gown rail.** `DressRail` is a scroll-snapping row that swaps to each gown's
second approved photograph on hover.

All three respect `prefers-reduced-motion`: the film never starts, and the
sequence renders as a plain stacked list. Visitors can also force that list
with the "View still sequence" button. `useMotionAllowed` subscribes to the OS
preference rather than copying it into state, and reports motion-capable during
server render so the tall sequence does not collapse and re-expand on
hydration.

## How the admin is laid out

The sidebar is ordered by how often the boutique touches each thing, not by
how the code is organised. Group order is set by the order of the `collections`
and `globals` arrays in `payload.config.ts` — Payload lists groups as it first
meets them, collections before globals — so that array is the running order of
the menu.

| Group | What lives there |
| --- | --- |
| **The website** | Pages · Homepage · Navigation · Footer · Gift cards |
| **Gowns & designers** | Gowns · Designers · Accessories · Filter terms |
| **Stories & journal** | Real brides · Journal · Events · Questions and answers |
| **Enquiries** | Appointment requests · Alterations enquiries · Messages · Newsletter signups |
| **Photographs** | Media library |
| **Settings** | Staff accounts · Site settings · Form settings |

Conventions that keep it learnable:

- **Pages and the Homepage share one shape** — Opening section, Sections,
  Search engines — so there is only one thing to learn.
- **Enquiries are arranged for handling, not authoring**: newest first, the
  status in the sidebar, and the submitted details laid out as a record.
- **Lists are sorted the way you would look for something** — gowns and pages
  alphabetically, enquiries and photographs newest first, designers in their
  own display order.
- **Collapsed array rows say what they are.** Opening hours read
  "Thursday — 10am–7pm", menu and footer links read their own wording and
  destination, via the small client components in `src/admin/`.
- **Every control does something.** Five retired branding fields (colours,
  typefaces, mobile logo) are `admin.hidden` rather than deleted: nothing
  reads them, but removing them would drop live columns from `site_settings`,
  which belongs in a reviewed migration rather than a dev schema push.

## How content reaches the site

```
Editor publishes in /admin
      │
      ├── Payload afterChange hook fires
      │       └── revalidateTag('dresses' | 'pages' | 'globals' | …)
      │
      └── Next.js drops the cached data for that tag and
          regenerates the affected pages on the next request
```

Reads go through `src/lib/queries.ts`, each cached under a tag
(`src/lib/cache.ts`). Hooks in `src/lib/revalidate.ts` invalidate the matching
tag on publish or delete, so edits appear without a redeploy. The one-hour
`revalidate` on each route is only a safety net.

Public reads explicitly filter `_status: 'published'`. This matters: Payload's
Local API runs with `overrideAccess: true` by default, so drafts would
otherwise be served to visitors.

## Project layout

```
payload.config.ts          Collections, globals, database, admin
src/
  app/
    (frontend)/            The public site
    (payload)/             Payload admin, REST and GraphQL
    robots.ts sitemap.ts   Metadata routes (must sit at the app root)
  admin/Dashboard.tsx      Boutique overview above the admin's own dashboard
  actions/                 Server Actions: forms, search, assistant
  blocks.ts                Page-builder block definitions
  collections/             Gowns, designers, pages, stories, submissions, media
  globals/                 Site settings, navigation, footer, homepage, forms, gift cards
  components/
    blocks/                One renderer per page-builder block + the dispatcher
    layout/ ui/ forms/     Shell, primitives and form controls
    dresses/ designers/ …  Domain components
  lib/                     Queries, caching, SEO, validation, filters, CSV import
scripts/                   seed, imports, reference content
.import/                   Staged boutique assets (gitignored)
```

### Adding a page-builder block

1. Define the block in `src/blocks.ts`.
2. Add its slug to `BLOCK_GROUPS` in the same file, under the heading it
   belongs beneath in the "add section" picker. This is not optional — the
   config throws on startup naming any block you forget, so an editor never
   meets an unsorted entry in a list of thirty-three.
3. Write the renderer in `src/components/blocks/`.
4. Add the `case` to `src/components/blocks/RenderBlocks.tsx`.
5. `npm run generate:types`.

Every block carries a **Hide this section** switch, so editors can take a
section off a page without deleting its content.

## Routes

| Route | Source |
| --- | --- |
| `/` | Homepage global |
| `/[slug]` | Pages collection — about, alterations, your-appointment, contact, faq and anything staff add |
| `/dresses` | Catalogue with URL filters |
| `/dresses/[category]` | Curated, indexable categories (`src/lib/filters.ts`) |
| `/dress/[slug]` | Gowns |
| `/designers`, `/designers/[slug]` | Designers |
| `/accessories` | Accessories, grouped by category |
| `/real-brides`, `/real-brides/[slug]` | Bride stories |
| `/events`, `/events/[slug]` | Events, with a date-derived archive |
| `/journal`, `/journal/[slug]` | Journal |
| `/gift-card` | Gift cards global |
| `/search`, `/wishlist` | Search results and saved lists (`noindex`) |
| `/sitemap.xml`, `/robots.txt` | Generated from published content |
| `/preview/[collection]/[slug]` | Draft preview, gated on a Payload session |

### Filtering and SEO

Filters live in the query string (`/dresses?designer=morilee&silhouette=mermaid`)
so results are shareable, work without JavaScript, and respect the back button.

Because the filter space is unbounded, only the curated categories in
`INDEXABLE_CATEGORIES` get a crawlable URL. Any filtered `/dresses` view
canonicalises to `/dresses` and is marked `noindex`, and the sitemap lists the
curated categories only.

**On 404 status codes:** a missing gown or page renders the 404 UI but returns
HTTP 200, because the response has already begun streaming (a `loading.tsx`
boundary exists) and headers cannot then be changed. Next.js injects
`<meta name="robots" content="noindex">` into those responses, which is what
keeps them out of search results. If a true 404 status is ever needed for
compliance or analytics, the documented approach is to check existence in
`proxy.ts` before the body streams.

### Draft preview

Public pages are statically rendered from published content only, so they
cannot show a draft. Preview therefore has its own dynamic route,
`/preview/[collection]/[slug]`, which Payload's preview buttons point at. It
verifies a real Payload session, so forwarding the URL to someone who is not
signed in shows them nothing.

This separation is deliberate: reading a request-time API such as
`draftMode()` inside the public routes made them dynamic and turned every
unknown URL into a 500.

## Roles

| Role | Can do |
| --- | --- |
| Super Admin | Everything, including users and site settings |
| Editor | Pages, gowns, designers, journal, events, brides, accessories, questions, media |
| Staff | Appointments, enquiries and submissions |

The admin dashboard only shows cards a user can actually open — counts are read
with their own permissions.

## Forms

Appointment, alterations, contact and newsletter forms run as Server Actions in
`src/actions/forms.ts`. Each one:

- validates with the same Zod schema on the client and again on the server
- screens a honeypot field and an implausibly fast submission
- is rate limited per IP
- stores the submission in Payload
- emails the address in **Form settings**, if one is set

Submissions cannot be created through the API (`create: () => false`); only
these actions write them, with `overrideAccess: true`.

### Two deliberate limits

**Rate limiting is in-process.** `src/lib/rate-limit.ts` keeps counters in
memory, so on serverless each instance counts separately. It stops casual
abuse, not a distributed attack. `checkRateLimit` is the single seam to swap
for Redis or a platform firewall.

**Email needs a provider.** With none configured, Payload's console adapter
logs the message instead of sending it. Add an email adapter in
`payload.config.ts` before launch, or notifications will never arrive.

## Images

`next/image` everywhere, with four generated sizes per upload and the stored
focal point used for cropping. Every image field has required alt text, and
hero fields take a separate mobile crop.

SVG upload is deliberately disabled. An SVG is executable markup, and letting
editors serve one from our own origin is a stored-XSS route. Brand marks should
be PNG or WebP; a genuine SVG logo belongs in `public/` under review.

Uploads are written to `public/media`, which works locally and on a persistent
server. **On Vercel the filesystem is ephemeral — uploads will disappear.**
Before deploying there, add a storage adapter such as
`@payloadcms/storage-vercel-blob` or `@payloadcms/storage-s3`.

## Where the content came from

`scripts/reference-content.ts` holds the boutique's own copy, read from the
live site: the announcement, hero and every section heading, the ten designer
descriptions, opening hours, the alterations services and fitting journey, the
ten-step appointment journey, the published questions and the gift-card terms.
Keeping it in one module means the seed script is about *how* content is
created and that file is about *what* it says.

`.import/` holds the staged assets and is gitignored because it is large
(≈140 MB) and is the boutique's own material:

| | |
| --- | --- |
| `dresses.json` | 76 gowns: name, slug, designer, description, approved photograph references |
| `dress-images/` | 245 gown photographs |
| `editorial/` | 18 designer, silhouette and editorial images |
| `angelo-logo-*.png` | Brand marks |
| `fix-designers.mjs` | Derives each gown's designer from its slug — see below |

### Known gaps, stated plainly

- **76 of 112 gowns.** The reference site links only part of the Luce Sposa
  (12 of 24), Mayra (12 of 22) and Morilee (12 of 26) collections from their
  designer pages. Every other designer matches the site's own facet counts
  exactly. The rest can be added in the admin or via
  `npm run import:dresses -- file.csv`.
- **7 gowns have no photograph** and are therefore drafts, not public. They are
  all of Maria Anette's and Rosa Clará's listed gowns plus one Mayra gown,
  which is why those two designer pages show no gowns yet.
- **Style codes on 15 of 76 gowns.** The rest are not in the reference markup
  in a form that could be read reliably, so those fields are left empty rather
  than guessed. Prices (69) and sample sizes (73) were read from each gown's
  "Price, colour & sample" disclosure.
- **No taxonomy on the gowns.** Silhouette, style, fabric and feature terms all
  exist as filter terms, but the reference does not expose which apply to each
  gown. Assign them under each gown's **Filters** tab and the catalogue filters
  will find them.
- **Journal articles are outlines.** The three titles and categories are real
  and the articles are published so the homepage journal section works, but
  each body carries a short, clearly-worded interim note — the real pieces are
  not on the reference site and bridal advice written in the boutique's name is
  not ours to invent.
- **Legal pages are notices.** Privacy, Cookies, Terms and Accessibility are
  linked from every page on the reference. The policy text is not published
  there, so each page carries an honest "being prepared" notice and the
  boutique's contact details. **These must be replaced with real policies
  before launch.**
- **No bride stories or events.** Neither is published on the reference site,
  so the Real brides homepage section is seeded hidden.
- **Accessories are the four the reference lists** — three veils and a shoe,
  with their real names, SKUs and prices. They are suggested on every gown, as
  the reference does; curate per gown from the admin for a bespoke pairing.

### The designer-attribution trap

Every page on the reference site embeds the mega menu and a "most loved"
carousel. That means both the first `/designers/...` link on a gown page **and**
the set of gown links on a designer's own page include other designers'
entries. Two plausible-looking extraction methods were therefore wrong — the
first attributed all 76 gowns to Anifael.

The gown slug is the reliable source: the site builds it as
`<designer-slug>-<gown-name>-<n>`, e.g. `house-of-st-patrick-helea-1`. Matching
the longest designer slug that prefixes it is deterministic and needs no
network call. `npm run fix:designers` reconciles the database against that.

## Before launch

- [ ] Strong `PAYLOAD_SECRET`; `NEXT_PUBLIC_SERVER_URL` set to the real domain
- [ ] Email adapter configured, and a notification address in Form settings
- [ ] Storage adapter configured if deploying to a serverless platform
- [ ] A hero photograph or film on the Homepage opening section
- [ ] Taxonomy assigned to the gowns so the catalogue filters work
- [ ] Remaining gowns added, and the 7 photograph-less drafts completed
- [ ] Journal article bodies written, then published
- [ ] Social links and analytics IDs in Site settings
- [ ] Awards and the social section reviewed before switching on
