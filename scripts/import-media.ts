/**
 * Imports the boutique's editorial imagery and wires it into the CMS.
 *
 *   npm run import:media
 *
 * Covers everything that is not a gown photograph:
 *   · the brand logo        → Site settings
 *   · designer collection   → each designer's header photograph
 *   · silhouette category   → the homepage category links
 *   · editorial / detail    → the homepage story and sample-sale sections
 *
 * Idempotent: an image already in the library is reused, and a field that
 * already has an image is left as the editor set it.
 */
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'
import { DESIGNERS } from './reference-content'

const IMPORT_DIR = resolve(process.cwd(), '.import')
const EDITORIAL_DIR = resolve(IMPORT_DIR, 'editorial')

const log = (message: string) => console.log(`  ${message}`)

/** Uploads a file once, reusing the existing media record if present. */
const upload = async (
  payload: Payload,
  file: string,
  alt: string,
  folder: 'Dresses' | 'Designers' | 'Boutique' | 'Brand' | 'Journal',
): Promise<number | null> => {
  const filename = file.split(/[/\\]/).pop() as string

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) return existing.docs[0].id

  try {
    const created = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt, folder },
      filePath: file,
    })
    return created.id
  } catch (error) {
    console.error(`    ! ${filename}: ${error instanceof Error ? error.message : 'failed'}`)
    return null
  }
}

/** Finds a staged editorial file by the start of its name. */
const findFile = (files: string[], prefix: string): string | null =>
  files.find((name) => name.startsWith(prefix)) ?? null

const main = async () => {
  if (!existsSync(EDITORIAL_DIR)) {
    console.error(`\nNo editorial images at ${EDITORIAL_DIR}. See README.md.\n`)
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const files = readdirSync(EDITORIAL_DIR)

  console.log(`\nImporting editorial imagery (${files.length} files)\n`)

  /* ---------------------------------------------------------------- */
  /* Brand logo                                                      */
  /* ---------------------------------------------------------------- */
  const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
  const logoFile = resolve(IMPORT_DIR, 'angelo-logo-black.png')

  const logoLightFile = resolve(IMPORT_DIR, 'angelo-logo-white.png')
  const branding: Record<string, unknown> = { ...settings.branding }
  let brandingChanged = false

  if (!settings.branding?.logo && existsSync(logoFile)) {
    const logoId = await upload(payload, logoFile, 'Angelo Bridal', 'Brand')
    if (logoId) {
      branding.logo = logoId
      brandingChanged = true
    }
  }

  // The light mark is what shows while the header sits over the hero.
  if (!settings.branding?.logoLight && existsSync(logoLightFile)) {
    const lightId = await upload(payload, logoLightFile, 'Angelo Bridal', 'Brand')
    if (lightId) {
      branding.logoLight = lightId
      brandingChanged = true
    }
  }

  if (brandingChanged) {
    await payload.updateGlobal({ slug: 'site-settings', overrideAccess: true, data: { branding } })
    log('Site settings: logo artwork set')
  } else {
    log('Site settings: logos already set, left alone')
  }

  /* ---------------------------------------------------------------- */
  /* Homepage opening section                                        */
  /*                                                                  */
  /* The film is served from `public/media/hero/`, not the media       */
  /* library: it is a 7 MB video, and Payload's upload pipeline runs   */
  /* sharp over every upload, which has nothing to offer an MP4.       */
  /* ---------------------------------------------------------------- */
  const homepageGlobal = await payload.findGlobal({ slug: 'homepage', overrideAccess: true, depth: 0 })
  const heroPoster = resolve(IMPORT_DIR, 'hero-poster.jpg')
  const heroMobile = resolve(IMPORT_DIR, 'hero-mobile.jpg')
  const hero: Record<string, unknown> = { ...(homepageGlobal.hero ?? {}) }
  let heroChanged = false

  if (!hero.image && existsSync(heroPoster)) {
    const id = await upload(payload, heroPoster, 'Angelo Bridal campaign film', 'Boutique')
    if (id) {
      hero.image = id
      heroChanged = true
    }
  }

  if (!hero.mobileImage && existsSync(heroMobile)) {
    const id = await upload(payload, heroMobile, 'Angelo Bridal bride in a designer wedding dress', 'Boutique')
    if (id) {
      hero.mobileImage = id
      heroChanged = true
    }
  }

  if (!hero.videoURL && existsSync(resolve(process.cwd(), 'public/media/hero/angelo-campaign-film.mp4'))) {
    hero.videoURL = '/media/hero/angelo-campaign-film.mp4'
    heroChanged = true
  }

  if (heroChanged) {
    await payload.updateGlobal({
      slug: 'homepage',
      overrideAccess: true,
      data: { hero: hero as never },
    })
    log('Homepage: opening section film and stills set')
  } else {
    log('Homepage: opening section already set, left alone')
  }

  /* ---------------------------------------------------------------- */
  /* Designer header photographs                                     */
  /* ---------------------------------------------------------------- */
  let designersUpdated = 0

  for (const designer of DESIGNERS) {
    const prefix = designer.slug.replace(/-/g, '-')
    const match =
      findFile(files, prefix) ??
      // "pronovias-privee" is staged as "pronovias-priv-e-…" because the
      // accent was stripped from the alt text it was named after.
      findFile(files, designer.slug.replace('privee', 'priv-e'))
    if (!match) continue

    const existing = await payload.find({
      collection: 'designers',
      where: { slug: { equals: designer.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    const doc = existing.docs[0]
    if (!doc || doc.heroImage) continue

    const mediaId = await upload(
      payload,
      resolve(EDITORIAL_DIR, match),
      `${designer.name} wedding dress collection at Angelo Bridal`,
      'Designers',
    )
    if (!mediaId) continue

    await payload.update({
      collection: 'designers',
      id: doc.id,
      data: { heroImage: mediaId, _status: 'published' },
      overrideAccess: true,
    })
    designersUpdated += 1
  }

  log(`Designers: ${designersUpdated} header photographs set`)

  /* ---------------------------------------------------------------- */
  /* Homepage — category links and the story section                 */
  /* ---------------------------------------------------------------- */
  const homepage = await payload.findGlobal({ slug: 'homepage', overrideAccess: true, depth: 0 })
  const sections = [...((homepage.sections ?? []) as Record<string, unknown>[])]
  let sectionsTouched = 0

  for (const section of sections) {
    /* Silhouette picture links */
    if (section.blockType === 'category-links' && Array.isArray(section.links)) {
      for (const link of section.links as Record<string, unknown>[]) {
        if (link.image) continue
        const label = String(link.label ?? '')
        const prefix = label.replace(/&/g, 'and').toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const match = findFile(files, prefix)
        if (!match) continue
        const id = await upload(payload, resolve(EDITORIAL_DIR, match), `${label} wedding dresses`, 'Dresses')
        if (id) {
          link.image = id
          sectionsTouched += 1
        }
      }
    }

    /*
     * Image-led sections. Each is matched to the photograph the reference
     * uses in that position, by the alt text it was saved under.
     */
    const PHOTO_FOR: Record<string, { prefix: string; alt: string }> = {
      // "More than a dress" — the boutique story.
      'split-content': { prefix: 'angelo-bridal-editorial-story', alt: 'Inside Angelo Bridal' },
      // "Search the collection, your way" — a gown detail.
      'split-panel': { prefix: 'bridal-dress-detail', alt: 'Bridal dress detail' },
    }

    const photo = PHOTO_FOR[String(section.blockType)]
    if (photo && !section.image) {
      const match = findFile(files, photo.prefix)
      if (match) {
        const id = await upload(payload, resolve(EDITORIAL_DIR, match), photo.alt, 'Boutique')
        if (id) {
          section.image = id
          sectionsTouched += 1
        }
      }
    }

    /*
     * The two full-bleed panels use different photographs, so they are
     * matched on their heading rather than the block type.
     */
    if (section.blockType === 'feature-panel' && !section.image) {
      const heading = String(section.heading ?? '').toLowerCase()
      const prefix = heading.includes('ready sooner')
        ? 'angelo-bridal-sample-sale-dress'
        : 'angelo-bridal-wedding-dress-detail'
      const match = findFile(files, prefix)
      if (match) {
        const id = await upload(
          payload,
          resolve(EDITORIAL_DIR, match),
          heading.includes('ready sooner')
            ? 'Angelo Bridal sample sale dress'
            : 'A bride during her private Angelo Bridal appointment',
          'Boutique',
        )
        if (id) {
          section.image = id
          sectionsTouched += 1
        }
      }
    }

    /* The social wall: three editorial images with their own links. */
    if (section.blockType === 'instagram-preview' && !(section.posts as unknown[])?.length) {
      const picks = [
        { prefix: 'angelo-bridal-editorial-story', alt: 'Bridal inspiration' },
        { prefix: 'bridal-dress-detail', alt: 'Bridal inspiration' },
        { prefix: 'angelo-bridal-wedding-dress-detail', alt: 'Inside Angelo' },
      ]
      const posts: { image: number }[] = []
      for (const pick of picks) {
        const match = findFile(files, pick.prefix)
        if (!match) continue
        const id = await upload(payload, resolve(EDITORIAL_DIR, match), pick.alt, 'Boutique')
        if (id) posts.push({ image: id })
      }
      if (posts.length) {
        section.posts = posts
        sectionsTouched += 1
      }
    }
  }

  if (sectionsTouched) {
    await payload.updateGlobal({
      slug: 'homepage',
      overrideAccess: true,
      data: { sections: sections as never },
    })
  }

  log(`Homepage: ${sectionsTouched} image slots filled`)

  /* ---------------------------------------------------------------- */
  /* Journal articles                                                 */
  /*                                                                  */
  /* An article needs a photograph before it can be published, so the  */
  /* outlines the seed created are completed and published here.       */
  /* ---------------------------------------------------------------- */
  const journalDrafts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'draft' } },
    depth: 0,
    limit: 50,
    overrideAccess: true,
    draft: true,
  })

  const JOURNAL_PHOTOS = [
    'angelo-bridal-wedding-dress-detail',
    'bridal-dress-detail',
    'angelo-bridal-editorial-story',
  ]
  let journalPublished = 0

  for (const [index, post] of journalDrafts.docs.entries()) {
    if (post.featuredImage) continue
    const match = findFile(files, JOURNAL_PHOTOS[index % JOURNAL_PHOTOS.length])
    if (!match) continue

    const id = await upload(payload, resolve(EDITORIAL_DIR, match), post.title, 'Journal')
    if (!id) continue

    await payload.update({
      collection: 'posts',
      id: post.id,
      overrideAccess: true,
      data: { featuredImage: id, _status: 'published' },
    })
    journalPublished += 1
  }

  log(`Journal: ${journalPublished} article(s) given a photograph and published`)

  /* ---------------------------------------------------------------- */
  /* Remaining editorial images into the library                     */
  /* ---------------------------------------------------------------- */
  let library = 0
  for (const file of files) {
    const id = await upload(
      payload,
      resolve(EDITORIAL_DIR, file),
      file.replace(/-[a-z0-9]{6}\.(jpg|png)$/i, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
      'Boutique',
    )
    if (id) library += 1
  }

  log(`Media library: ${library} editorial images available`)

  console.log('\nDone. Add a hero photograph or film to the Homepage opening section')
  console.log('in the admin to finish the front page.\n')

  process.exit(0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
