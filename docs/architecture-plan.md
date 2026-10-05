# Angelo Bridal — architecture

What was built, and why it was built this way. The README covers setup and
day-to-day operation; this is the design record.

## Reference audit

The reference site (`angelo-bridal.outworkmedia.ie`) links to dresses,
designers, alterations, real brides, accessories, gift cards, events, journal,
about, appointment, FAQ and contact, plus search, wishlist, a bridal portal and
an "Ask Angelo" assistant. Its homepage runs an editorial hero, boutique story,
designer collections, silhouette links, most-loved gowns, appointment and
sample-sale features, dress search, real brides, recognition, journal, social
preview and a closing booking CTA.

Its catalogue states 112 gowns across 10 designer collections. Dress pages show
designer, name and style code, a gallery, a story, product details, try-on and
appointment actions, accessory suggestions and related gowns. Events separate
current listings from an archive. Alterations collects contact details,
wedding/travel dates, purchase location, gown status and a description.

**Only what the brief supplied has been treated as fact.** The 112-record
catalogue, its imagery, the real opening hours and the award wording were not
available, so none of them were invented. See *Content integrity* below.

## Stack and the decisions behind it

| Decision | Why |
| --- | --- |
| Next.js 16 App Router, React Server Components | Content site: render on the server, ship almost no JavaScript. |
| Payload CMS 3 embedded in the same app | One deployment, one type system. `payload-types.ts` is generated from the collections, so the frontend cannot drift from the schema. |
| PostgreSQL via Payload's adapter | Relational content with real foreign keys. Payload owns the schema and its migrations. |
| **No Prisma** | The brief allows Prisma "where appropriate". Nothing here is appropriate: a second migration tool pointed at the same tables is a corruption risk for no gain. Add it only for a subsystem with its own tables. |
| ISR + tag revalidation, **not** `cacheComponents` | Cache Components is the documented Next 16 route to PPR, but Payload 3.90's admin is not yet safe under its stricter dynamic rules. Route-level `revalidate` plus `revalidateTag` on publish delivers the same editor experience without risking `/admin`. |
| Server Actions for forms, search and the assistant | Payload already owns `/api/*`. Actions avoid the route collision and give one typed call site per operation. |
| Tailwind v4 with `@theme` tokens | The palette, type scale and rhythm live in `src/app/globals.css`; no component invents its own spacing. |
| `@fontsource` rather than `next/font/google` | Self-hosted and offline-safe: the build never depends on reaching Google. Headings use Georgia, a system serif, so they cannot shift on load. |
| Design tokens lifted from the live site | Palette, type scale and spacing are the boutique’s own values rather than an interpretation. Recorded in `globals.css` so there is one place to tune them. |
| Preview on its own dynamic route | Reading `draftMode()` inside the public routes made them dynamic and turned unknown URLs into 500s. Splitting by route keeps the public pages static and request-time behaviour contained. |

## Data model

| Collection / global | Key fields and relations |
| --- | --- |
| Users | Payload auth; role: super-admin / editor / staff |
| Media | Upload, required alt text, caption, group, focal point, crop |
| Pages | title, slug, page type, draft/published, hero, ordered blocks, SEO |
| Dresses | name, slug, **→ Designer**, collection, style code, description, story, price, sample/availability, images, **→ taxonomy per kind**, **→ Accessories**, highlight flags, SEO |
| Designers | name, slug, logo, hero, descriptions, website, featured, order, SEO; **← Dresses** |
| Taxonomies | the managed vocabulary for every filter, menu column and category |
| Accessories | name, category, SKU, price, availability, images, SEO |
| Real brides | name, slug, date, location, story, **→ Dress**, **→ Designer**, ordered gallery, SEO |
| Events | title, slug, type, dates/times, location, attendance, RSVP, gallery, status override, SEO |
| Posts | title, slug, excerpt, Lexical content, image, author, **→ category**, **→ tags**, publish date, reading time, SEO |
| FAQs | question, rich answer, **→ category**, order |
| Appointments | contact, preferences, **→ selected Dresses**, consent, status |
| Alteration enquiries | contact, wedding/travel dates, purchase details, description, status |
| Contact submissions / Newsletter subscribers | contact, message/consent, status |
| Site settings | branding, contact, opening hours, social, SEO defaults, analytics IDs, announcement bar |
| Navigation / Footer / Homepage / Form settings / Gift cards | the editable site chrome, homepage layout, form configuration and gift-card amounts |

### Taxonomy is one relationship per kind

The original plan had a single `taxonomies` relationship on each gown. That was
changed: a gown now has separate `silhouette`, `style`, `features`, `fabrics`,
`neckline`, `sleeve`, `train`, `sizes` and `colour` fields, each filtered to its
own kind.

Two reasons. The editor sees nine clearly labelled pickers offering only
relevant terms, instead of one box listing every term in the system — which is
the difference between a website editor and a developer database. And the query
layer can filter per field (`{ silhouette: { in: [...] } }`), which makes "any
of these silhouettes **and** any of these fabrics" expressible, and indexable.

`FILTER_GROUPS` in `src/lib/filters.ts` maps query parameter → taxonomy kind →
dress field, in one place.

## Caching and invalidation

Every read in `src/lib/queries.ts` is wrapped in `unstable_cache` under a tag
from `src/lib/cache.ts`. `afterChange` and `afterDelete` hooks call
`revalidateTag(tag, 'max')`, so publishing invalidates exactly the affected
pages. Route-level `revalidate = 3600` is a backstop, not the mechanism.

`revalidateTag` is wrapped in try/catch because Payload also runs outside a
request scope — seeding, the CLI, migrations — where revalidation is both
unavailable and unnecessary.

## Draft preview

`/preview?path=…` verifies the editor's Payload session with `payload.auth()`
before enabling draft mode, and only accepts same-site paths. Draft-aware
readers in `src/lib/preview.ts` bypass the cache while draft mode is on —
without that, a preview would be served the cached published copy. A banner
makes draft state unmistakable.

## SEO

Metadata resolves entity SEO fields → the document's own content → site
defaults, and omits what is missing rather than inventing it.

Filters are shareable but finite to crawlers: only the curated categories in
`INDEXABLE_CATEGORIES` have real URLs and sitemap entries. Every other filter
combination canonicalises to `/dresses` and is `noindex`. `/search` and
`/wishlist` are `noindex`, and non-production hosts are closed off entirely in
`robots.ts`.

JSON-LD covers Organization, BridalShop, Product, Article, Event, FAQPage and
BreadcrumbList. Breadcrumb markup is generated from the same array that renders
the visible trail, so the two cannot disagree. No ratings or review counts are
emitted, because there is no real review data.

## Security

- Role-based access on every collection; settings and users are Super Admin only.
- Public reads filter `_status: 'published'` explicitly, because the Local API bypasses access control by default.
- Submissions have `create: () => false`; only the Server Actions write them.
- Validation runs client-side and again server-side with the same schema.
- Honeypot plus minimum fill time, and per-IP rate limiting.
- SVG upload disabled (stored-XSS vector).
- Preview requires a verified Payload session and rejects off-site redirects.
- JSON-LD output escapes `<`, so CMS copy cannot break out of the script tag.
- Credentials are server-only; nothing secret is exposed to the client.

Two limits are documented rather than hidden: rate limiting is per-process, and
email requires an adapter. Both are called out in the README with the seam to
replace.

## Accessibility

Semantic landmarks and a skip link. One visible focus treatment site-wide.
Focus trapping with focus restoration on the mobile menu, search overlay,
filter sheet, gallery zoom and assistant. The FAQ accordion is native
`<details>`, so answers are reachable before hydration. Filters are real links
and sort is a real form, so the catalogue works without JavaScript. `aria-live`
on result counts and assistant replies; `aria-pressed` on toggles.
`prefers-reduced-motion` is honoured globally and suppresses hero video.

## Content integrity

Per the brief, nothing was fabricated. The seed creates the filter vocabulary,
navigation, footer, boutique contact details, gift-card amounts, designer
**names**, the homepage layout with its real headings, and page shells.

It creates no gowns, bride stories, journal articles, events, awards,
testimonials or social posts. Sections needing that content are seeded
**hidden**; unsupplied wording is a marked `[Placeholder]`; seeded designers and
pages are **drafts**. Prices are optional throughout and render as "confirm with
the boutique" when absent, rather than showing a guess.

## Room to grow

The structure anticipates the roadmap without building it:

- **Ecommerce** — accessories already carry SKU, price and availability; a basket and checkout are additive.
- **Accounts** — `SavedListsProvider` exposes `has`/`toggle`/`remove`; swapping localStorage for server persistence does not touch any consumer.
- **AI concierge** — `askAngelo` returns a typed `AssistantReply`; a model can replace the rule engine behind that shape with no UI change.
- **CRM / appointment management** — submissions are separate collections with status fields, ready for a workflow.
- **Instagram** — the social block renders uploads today and can read a feed later.

## Verification status

TypeScript, ESLint and the production build all pass. 112 pages prerender,
including 69 gown pages, 10 designer pages and 5 CMS pages. Every route was
checked against a running production server, along with the catalogue filters,
the curated category routes, the sitemap and `robots.txt`.

Known gaps and the reasoning behind them are listed in README.md under
"Where the content came from" — chiefly that 76 of the 112 gowns are present
(the reference site links only part of three collections), gowns carry no
taxonomy yet, and journal bodies are intentionally unwritten.

## Two findings worth recording

**Soft 404s are framework behaviour, not a defect.** A missing gown renders the
404 UI with HTTP 200 because the response has already begun streaming. Next.js
injects `<meta name="robots" content="noindex">` into those responses, which is
what keeps them out of search results. A true 404 status would require an
existence check in `proxy.ts` before the body streams.

**Designer attribution could not be scraped from links.** Every page on the
reference site embeds the mega menu and a "most loved" carousel, so both the
first `/designers/...` link on a gown page and the gown links on a designer's
own page include other designers' entries. The gown slug
(`<designer-slug>-<name>-<n>`) is the only reliable source; matching the
longest designer-slug prefix is deterministic.
