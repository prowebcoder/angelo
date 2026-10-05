/**
 * Seeds the site with the boutique's real content.
 *
 *   npm run seed
 *
 * Copy, designer descriptions, opening hours, navigation, the homepage layout
 * and the page shells all come from `reference-content.ts`, which holds the
 * wording read from the live Angelo Bridal site. Nothing here is invented.
 *
 * Gowns and their photographs are handled separately by
 * `npm run import:catalogue`, because that step uploads ~245 images and takes
 * a few minutes.
 *
 * Safe to run more than once: anything that already exists is left alone, so
 * a re-run never overwrites an editor's work.
 */
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'
import {
  ABOUT,
  ALTERATIONS,
  APPOINTMENT,
  CONTACT,
  DESIGNERS,
  FAQS,
  FAQ_PAGE,
  FOOTER_EXPLORE,
  GIFT_CARDS,
  HOMEPAGE,
  JOURNAL,
  LEGAL_LINKS,
  MOST_LOVED_SLUGS,
  NAVIGATION,
  OPENING_HOURS,
  SILHOUETTE_LINKS,
  SITE,
  SOCIAL_LINKS,
} from './reference-content'

const log = (message: string) => console.log(`  ${message}`)

/**
 * `--refresh` replaces content a previous seed created.
 *
 * Without it the seed never touches what is already there, so it is safe to
 * re-run alongside an editor's work. With it, the globals are rewritten and
 * any page still carrying `[Placeholder]` text is replaced — which is how an
 * earlier placeholder seed gets upgraded to the boutique's real copy. Pages
 * an editor has actually written are left alone either way.
 */
const REFRESH = process.argv.includes('--refresh')

const PLACEHOLDER = '[Placeholder]'

/**
 * True when a document still looks exactly as the seed left it.
 *
 * Either it carries placeholder text, or it has never been saved since it was
 * created — a document an editor has opened and saved has an `updatedAt`
 * meaningfully later than its `createdAt`. Both signals have to be wrong for
 * `--refresh` to discard someone's work, which is a reasonable safety margin
 * for a setup script.
 */
const UNEDITED_TOLERANCE_MS = 60_000

const looksSeeded = (doc: { createdAt?: string; updatedAt?: string } | null | undefined): boolean => {
  if (!doc) return false
  if (JSON.stringify(doc).includes(PLACEHOLDER)) return true

  const created = doc.createdAt ? Date.parse(doc.createdAt) : NaN
  const updated = doc.updatedAt ? Date.parse(doc.updatedAt) : NaN
  if (Number.isNaN(created) || Number.isNaN(updated)) return false

  return updated - created < UNEDITED_TOLERANCE_MS
}

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Wraps plain paragraphs in the Lexical shape Payload stores rich text as. */
const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text }],
    })),
  },
})

/* -------------------------------------------------------------------------- */
/* Filter vocabulary                                                          */
/*                                                                            */
/* The catalogue's own filter values, matching the reference site's facets     */
/* exactly so imported gowns map onto the right terms.                        */
/* -------------------------------------------------------------------------- */

const TAXONOMY: Record<string, string[]> = {
  silhouette: ['A-Line', 'Ballgown', 'Fit & Flare', 'Fitted', 'Mermaid', 'Princess', 'Sheath / Column'],
  style: [
    'Boho',
    'Classic',
    'Contemporary',
    'Glamorous',
    'Minimal',
    'Modern',
    'Romantic',
    'Soft / Ethereal',
    'Statement',
    'Timeless',
  ],
  feature: [
    'Beading',
    'Bow',
    'Buttons',
    'Corset Bodice',
    'Detachable Sleeves',
    'Floral Detail',
    'High Neck',
    'Lace',
    'Long Sleeves',
    'Low Back',
    'Minimal / Clean',
    'Off-the-Shoulder',
    'Open Back',
    'Overskirt',
    'Plunging Neckline',
    'Sleeves',
    'Slim Straps',
    'Spaghetti Straps',
    'Square Neck',
    'Strapless',
    'Sweetheart',
  ],
  fabric: ['Chiffon', 'Crepe', 'Jacquard', 'Lace', 'Mikado', 'Organza', 'Satin', 'Silk', 'Tulle'],
  // The reference site labels its extended-size facet "Sample UK16+".
  size: ['Sample UK16+', 'Plus Size'],
  neckline: ['Sweetheart', 'Square Neck', 'V-Neck', 'High Neck', 'Straight', 'Off-the-Shoulder'],
  sleeve: ['Strapless', 'Slim Straps', 'Cap Sleeves', 'Short Sleeves', 'Long Sleeves', 'Detachable Sleeves'],
  train: ['No Train', 'Sweep', 'Chapel', 'Cathedral'],
  colour: ['Ivory', 'White', 'Off White', 'Champagne', 'Nude'],
  'journal-category': [
    'Appointment Advice',
    'Dresses',
    'Silhouettes',
    'Fabrics',
    'Alterations',
    'Weddings',
    'Inspiration',
    'Angelo News',
  ],
  'journal-tag': [],
  'event-type': ['Designer Event', 'Trunk Show', 'Launch', 'Walk-In Day', 'Wedding Fair'],
  'accessory-category': ['Veils', 'Shoes', 'Jewellery', 'Belts', 'Accessories', 'Other'],
  'faq-category': ['Appointments', 'The Boutique', 'Alterations', 'Ordering', 'Accessories'],
}

const seedTaxonomies = async (payload: Payload) => {
  let created = 0

  for (const [kind, names] of Object.entries(TAXONOMY)) {
    for (const [index, name] of names.entries()) {
      const slug = slugify(name)
      const existing = await payload.find({
        collection: 'taxonomies',
        where: { and: [{ kind: { equals: kind } }, { slug: { equals: slug } }] },
        limit: 1,
        overrideAccess: true,
      })
      if (existing.docs.length) continue

      await payload.create({
        collection: 'taxonomies',
        overrideAccess: true,
        data: { kind: kind as 'silhouette', name, slug, displayOrder: index, published: true },
      })
      created += 1
    }
  }

  log(`Filter terms: ${created} added`)
}

/** Designers, with the boutique's own description and homepage order. */
const seedDesigners = async (payload: Payload) => {
  let created = 0
  let updated = 0

  for (const [index, designer] of DESIGNERS.entries()) {
    const existing = await payload.find({
      collection: 'designers',
      where: { slug: { equals: designer.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    if (existing.docs[0]) {
      // Fill in the real description if the record is still blank.
      if (!existing.docs[0].description) {
        await payload.update({
          collection: 'designers',
          id: existing.docs[0].id,
          data: { description: designer.description, displayOrder: index, _status: 'published' },
          overrideAccess: true,
        })
        updated += 1
      }
      continue
    }

    await payload.create({
      collection: 'designers',
      overrideAccess: true,
      data: {
        name: designer.name,
        slug: designer.slug,
        description: designer.description,
        displayOrder: index,
        featured: index === 0,
        _status: 'published',
      },
    })
    created += 1
  }

  log(`Designers: ${created} added, ${updated} updated with their description`)
}

/**
 * An editor's own value wins — unless it is empty or still carries the
 * placeholder marker an earlier run wrote, in which case it is not really
 * their value and the real content takes its place.
 */
const kept = (value: string | null | undefined): string | null =>
  value && value.trim() && !value.includes(PLACEHOLDER) ? value : null

const seedSiteSettings = async (payload: Payload) => {
  const current = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })

  // Hours seeded before the real ones were known carry a placeholder note.
  // One such day means the whole week is still unset, so replace the lot.
  const storedHours = current.openingHours ?? []
  const hoursAreReal =
    storedHours.length > 0 && !storedHours.some((entry) => entry.specialNote?.includes(PLACEHOLDER))

  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      // `--refresh` restores the published details outright; without it an
      // editor's own wording stands.
      contact: {
        address: (REFRESH ? null : kept(current.contact?.address)) ?? SITE.address,
        phone: (REFRESH ? null : kept(current.contact?.phone)) ?? SITE.phone,
        email: (REFRESH ? null : kept(current.contact?.email)) ?? SITE.email,
      },
      openingHours: hoursAreReal && !REFRESH ? storedHours : OPENING_HOURS,
      social: {
        instagram: current.social?.instagram ?? SOCIAL_LINKS.instagram,
        tiktok: current.social?.tiktok ?? SOCIAL_LINKS.tiktok,
        facebook: current.social?.facebook ?? SOCIAL_LINKS.facebook,
        youtube: current.social?.youtube ?? SOCIAL_LINKS.youtube,
      },
      seo: {
        defaultTitle: current.seo?.defaultTitle ?? SITE.metaTitle,
        defaultDescription: current.seo?.defaultDescription ?? SITE.metaDescription,
      },
      announcement: {
        // `?? true` keeps a stored `false`, so a refresh sets it outright.
        enabled: REFRESH ? true : (current.announcement?.enabled ?? true),
        message: REFRESH ? SITE.announcement : (current.announcement?.message ?? SITE.announcement),
        backgroundStyle: current.announcement?.backgroundStyle ?? 'brand',
      },
    },
  })

  log('Site settings: contact details, hours, socials and announcement set')
}

const seedNavigation = async (payload: Payload) => {
  const current = await payload.findGlobal({ slug: 'navigation', overrideAccess: true })
  if (current.items?.length && !REFRESH) {
    log('Navigation: already set, left alone')
    return
  }

  await payload.updateGlobal({
    slug: 'navigation',
    overrideAccess: true,
    data: { appointmentLabel: 'Book Appointment', items: NAVIGATION },
  })

  log('Navigation: main menu set')
}

const seedFooter = async (payload: Payload) => {
  const current = await payload.findGlobal({ slug: 'footer', overrideAccess: true })
  if (current.columns?.length && !REFRESH) {
    log('Footer: already set, left alone')
    return
  }

  await payload.updateGlobal({
    slug: 'footer',
    overrideAccess: true,
    data: {
      // The reference footer carries no paragraph and no newsletter: it is
      // four columns of facts, then a rule and the legal line.
      description: '',
      showNewsletter: false,
      copyright: SITE.copyright,
      visitHeading: 'Visit',
      openingHoursHeading: 'Opening hours',
      socialHeading: 'Follow',
      preFooter: {
        heading: SITE.preFooterHeading,
        button: { label: 'Book an appointment', url: '/your-appointment' },
      },
      columns: [{ heading: 'Explore', links: FOOTER_EXPLORE }],
      legalLinks: LEGAL_LINKS.map(({ label, url }) => ({ label, url })),
    },
  })

  log('Footer: columns set')
}

/**
 * Homepage, in the reference site's own order with its own wording.
 *
 * Sections that need content the boutique has not supplied publicly — bride
 * stories and social posts — are seeded hidden so the page never shows an
 * empty band, and can be switched on the moment there is something real.
 */
const seedHomepage = async (payload: Payload) => {
  const current = await payload.findGlobal({ slug: 'homepage', overrideAccess: true })
  if (current.sections?.length && !REFRESH) {
    log('Homepage: already built, left alone')
    return
  }

  await payload.updateGlobal({
    slug: 'homepage',
    overrideAccess: true,
    data: {
      hero: {
        eyebrow: HOMEPAGE.hero.eyebrow,
        heading: HOMEPAGE.hero.heading,
        description: HOMEPAGE.hero.description,
        height: 'full',
        alignment: 'bottom-left',
        buttons: HOMEPAGE.hero.buttons,
      },
      sections: [
        {
          blockType: 'split-content',
          eyebrow: HOMEPAGE.story.eyebrow,
          heading: HOMEPAGE.story.heading,
          description: HOMEPAGE.story.description,
          imageSide: 'left',
          button: HOMEPAGE.story.button,
          tone: 'paper',
          hidden: false,
        },
        {
          // The reference presents the designers as a scroll-driven
          // sequence, not a grid. Editors can swap in "All designers" instead.
          blockType: 'designer-sequence',
          eyebrow: HOMEPAGE.designers.eyebrow,
          heading: HOMEPAGE.designers.heading,
          limit: 10,
          hidden: false,
        },
        {
          blockType: 'category-links',
          eyebrow: HOMEPAGE.silhouettes.eyebrow,
          heading: HOMEPAGE.silhouettes.heading,
          links: SILHOUETTE_LINKS,
          hidden: false,
        },
        {
          blockType: 'dress-grid',
          eyebrow: HOMEPAGE.mostLoved.eyebrow,
          heading: HOMEPAGE.mostLoved.heading,
          source: 'mostLoved',
          limit: 6,
          link: HOMEPAGE.mostLoved.link,
          tone: 'shell',
          hidden: false,
        },
        {
          // The reference shows this over a full-bleed appointment photograph.
          blockType: 'feature-panel',
          eyebrow: HOMEPAGE.experience.eyebrow,
          heading: HOMEPAGE.experience.heading,
          description: HOMEPAGE.experience.description,
          height: 'tall',
          crop: 'upper',
          scrim: 'soft',
          buttons: HOMEPAGE.experience.buttons,
          hidden: false,
        },
        {
          blockType: 'feature-panel',
          eyebrow: HOMEPAGE.sampleSale.eyebrow,
          heading: HOMEPAGE.sampleSale.heading,
          description: HOMEPAGE.sampleSale.description,
          height: 'medium',
          crop: 'centre',
          scrim: 'strong',
          buttons: [HOMEPAGE.sampleSale.link],
          hidden: false,
        },
        {
          blockType: 'split-panel',
          eyebrow: HOMEPAGE.search.eyebrow,
          heading: HOMEPAGE.search.heading,
          description: HOMEPAGE.search.description,
          imageSide: 'left',
          button: HOMEPAGE.search.button,
          hidden: false,
        },
        {
          blockType: 'real-brides',
          eyebrow: HOMEPAGE.brides.eyebrow,
          heading: HOMEPAGE.brides.heading,
          limit: 3,
          link: HOMEPAGE.brides.link,
          tone: 'paper',
          // No bride stories are published yet; switch on once there are.
          hidden: true,
        },
        {
          blockType: 'testimonials',
          eyebrow: HOMEPAGE.brides.eyebrow,
          heading: HOMEPAGE.brides.heading,
          quotes: [{ quote: HOMEPAGE.brides.quote, attribution: HOMEPAGE.brides.attribution }],
          tone: 'ink',
          hidden: false,
        },
        {
          blockType: 'statement',
          eyebrow: HOMEPAGE.award.eyebrow,
          heading: HOMEPAGE.award.heading,
          description: HOMEPAGE.award.description,
          hidden: false,
        },
        {
          blockType: 'journal-list',
          eyebrow: HOMEPAGE.journal.eyebrow,
          heading: HOMEPAGE.journal.heading,
          limit: 3,
          link: HOMEPAGE.journal.link,
          tone: 'paper',
          hidden: false,
        },
        {
          blockType: 'instagram-preview',
          eyebrow: HOMEPAGE.instagram.eyebrow,
          heading: HOMEPAGE.instagram.heading,
          handle: '@angelobridal',
          profileURL: SOCIAL_LINKS.instagram,
          tone: 'shell',
          hidden: false,
        },
        {
          blockType: 'call-to-action',
          eyebrow: HOMEPAGE.finalCta.eyebrow,
          heading: HOMEPAGE.finalCta.heading,
          buttons: HOMEPAGE.finalCta.buttons,
          tone: 'ink',
          hidden: false,
        },
      ],
      seo: { title: SITE.metaTitle, description: SITE.metaDescription },
    },
  })

  log('Homepage: 13 sections built from the boutique’s own copy')
}

const seedFormSettings = async (payload: Payload) => {
  const current = await payload.findGlobal({ slug: 'form-settings', overrideAccess: true })
  if (current.appointmentTypes?.length && !REFRESH) {
    log('Form settings: already set, left alone')
    return
  }

  await payload.updateGlobal({
    slug: 'form-settings',
    overrideAccess: true,
    data: {
      appointmentTypes: [
        { label: 'Bridal appointment', enabled: true, description: 'A private appointment with a senior bridal consultant.' },
        { label: 'Sample sale appointment', enabled: true },
        { label: 'Accessories appointment', enabled: true },
        { label: 'Alterations fitting', enabled: true },
      ],
      consentCopy: 'Keep me posted on new gowns, trunk shows and appointment openings.',
    },
  })

  log('Form settings: appointment types set')
}

const seedGiftCards = async (payload: Payload) => {
  const current = await payload.findGlobal({ slug: 'gift-cards', overrideAccess: true })
  if (current.amounts?.length && !REFRESH) {
    log('Gift cards: already set, left alone')
    return
  }

  await payload.updateGlobal({
    slug: 'gift-cards',
    overrideAccess: true,
    data: {
      hero: {
        eyebrow: GIFT_CARDS.hero.eyebrow,
        heading: GIFT_CARDS.hero.heading,
        description: GIFT_CARDS.hero.description,
      },
      amounts: GIFT_CARDS.amounts.map((value) => ({ value, currency: 'EUR' as const })),
      allowCustomAmount: true,
      minimumCustomAmount: 25,
      maximumCustomAmount: 2000,
      expiryInformation: GIFT_CARDS.expiry,
      personalMessageCopy: GIFT_CARDS.personalMessage,
    },
  })

  log('Gift cards: amounts and terms set')
}

/** The questions published on the reference site. */
const seedFaqs = async (payload: Payload) => {
  let created = 0

  for (const [index, faq] of FAQS.entries()) {
    const existing = await payload.find({
      collection: 'faqs',
      where: { question: { equals: faq.question } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    if (existing.docs.length) continue

    const category = await payload.find({
      collection: 'taxonomies',
      where: { and: [{ kind: { equals: 'faq-category' } }, { slug: { equals: faq.category } }] },
      limit: 1,
      overrideAccess: true,
    })

    await payload.create({
      collection: 'faqs',
      overrideAccess: true,
      data: {
        question: faq.question,
        answer: richText([faq.answer]) as never,
        category: category.docs[0]?.id,
        displayOrder: index,
        _status: 'published',
      },
    })
    created += 1
  }

  log(`Questions: ${created} added`)
}

/**
 * Journal articles.
 *
 * Titles and categories are published on the reference site; the article
 * bodies are not, so each is created as a draft with an empty body. Writing
 * bridal advice in the boutique's name is not ours to do.
 */
const seedJournal = async (payload: Payload) => {
  let created = 0

  for (const article of JOURNAL) {
    const slug = slugify(article.title)
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    if (existing.docs[0]) {
      // An earlier seed created these with an empty body, which cannot be
      // published. Replace an untouched outline; never an edited article.
      if (!(REFRESH && looksSeeded(existing.docs[0]))) continue
      await payload.delete({ collection: 'posts', id: existing.docs[0].id, overrideAccess: true })
    }

    const category = await payload.find({
      collection: 'taxonomies',
      where: { and: [{ kind: { equals: 'journal-category' } }, { slug: { equals: article.category } }] },
      limit: 1,
      overrideAccess: true,
    })

    /*
     * Titles and categories are the boutique's own, from the reference site.
     * The article bodies are not published there, and bridal advice written in
     * their name is not ours to invent — so each carries a short, honest note
     * pointing the reader at the team until the real piece is written.
     *
     * Created as drafts because a journal article cannot be published
     * without a photograph; `npm run import:media` attaches one and
     * publishes them.
     */
    await payload.create({
      collection: 'posts',
      overrideAccess: true,
      draft: true,
      data: {
        title: article.title,
        slug,
        category: category.docs[0]?.id,
        publishedAt: new Date().toISOString(),
        content: richText([
          'This piece is being written and will appear here shortly.',
          `In the meantime the Angelo Bridal team will happily talk it through with you: call ${SITE.phone} or email ${SITE.email}.`,
        ]) as never,
        _status: 'draft',
      },
    })
    created += 1
  }

  log(`Journal: ${created} article outline(s) created — npm run import:media adds a photograph and publishes them`)
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

const pageDefinitions = () => [
  {
    title: 'About Angelo',
    slug: 'about',
    pageType: 'about' as const,
    hero: ABOUT.hero,
    sections: [
      {
        blockType: 'split-content',
        eyebrow: ABOUT.boutique.eyebrow,
        heading: ABOUT.boutique.heading,
        description: ABOUT.boutique.description,
        imageSide: 'left',
        button: ABOUT.boutique.button,
        hidden: false,
      },
      {
        blockType: 'awards',
        eyebrow: ABOUT.awards.eyebrow,
        heading: ABOUT.awards.heading,
        description: ABOUT.awards.description,
        items: ABOUT.awards.items,
        tone: 'shell',
        hidden: false,
      },
      {
        blockType: 'call-to-action',
        heading: SITE.preFooterHeading,
        buttons: [{ label: 'Book an appointment', url: '/your-appointment' }],
        tone: 'ink',
        hidden: false,
      },
    ],
  },
  {
    title: 'Alterations',
    slug: 'alterations',
    pageType: 'alterations' as const,
    hero: ALTERATIONS.hero,
    sections: [
      {
        blockType: 'rich-text',
        eyebrow: ALTERATIONS.intro.eyebrow,
        heading: ALTERATIONS.intro.heading,
        content: richText([ALTERATIONS.intro.description]),
        width: 'narrow',
        hidden: false,
      },
      {
        blockType: 'services-grid',
        heading: 'Our alterations',
        services: ALTERATIONS.services,
        tone: 'shell',
        hidden: false,
      },
      {
        blockType: 'process-timeline',
        eyebrow: ALTERATIONS.journey.eyebrow,
        heading: ALTERATIONS.journey.heading,
        description: ALTERATIONS.journey.description,
        steps: ALTERATIONS.journey.steps,
        hidden: false,
      },
      {
        blockType: 'form',
        eyebrow: ALTERATIONS.enquiry.eyebrow,
        heading: ALTERATIONS.enquiry.heading,
        description: ALTERATIONS.enquiry.description,
        form: 'alterations',
        tone: 'shell',
        hidden: false,
      },
      { blockType: 'faq-list', heading: 'Alterations questions', hidden: false },
    ],
  },
  {
    title: 'Your appointment',
    slug: 'your-appointment',
    pageType: 'appointment' as const,
    hero: APPOINTMENT.hero,
    sections: [
      {
        blockType: 'process-timeline',
        eyebrow: APPOINTMENT.journey.eyebrow,
        heading: APPOINTMENT.journey.heading,
        steps: APPOINTMENT.journey.steps,
        hidden: false,
      },
      {
        blockType: 'form',
        eyebrow: APPOINTMENT.form.eyebrow,
        heading: APPOINTMENT.form.heading,
        description: APPOINTMENT.form.description,
        form: 'appointment',
        tone: 'shell',
        hidden: false,
      },
      { blockType: 'faq-list', heading: 'Before you come', hidden: false },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    pageType: 'contact' as const,
    hero: CONTACT.hero,
    sections: [
      {
        blockType: 'contact-information',
        heading: CONTACT.details.heading,
        showOpeningHours: true,
        hidden: false,
      },
      {
        blockType: 'form',
        eyebrow: CONTACT.form.eyebrow,
        heading: CONTACT.form.heading,
        form: 'contact',
        tone: 'shell',
        hidden: false,
      },
      { blockType: 'map', heading: 'Finding us', height: 420, hidden: false },
    ],
  },
  {
    title: 'Frequently asked questions',
    slug: 'faq',
    pageType: 'faq' as const,
    hero: FAQ_PAGE.hero,
    sections: [
      {
        blockType: 'faq-list',
        eyebrow: FAQ_PAGE.section.eyebrow,
        heading: FAQ_PAGE.section.heading,
        hidden: false,
      },
      {
        blockType: 'call-to-action',
        heading: SITE.preFooterHeading,
        buttons: [{ label: 'Book an appointment', url: '/your-appointment' }],
        tone: 'ink',
        hidden: false,
      },
    ],
  },
]

/**
 * Pages are published, because every word in them is the boutique's own.
 * Photographs still need adding, and each image field falls back to a quiet
 * "Image to follow" placeholder until one is uploaded.
 */
const seedPages = async (payload: Payload) => {
  let created = 0

  let replaced = 0

  for (const page of pageDefinitions()) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })

    if (existing.docs[0]) {
      // Replace only a page still carrying placeholder text, and only when
      // asked: anything an editor has written is never overwritten.
      if (!(REFRESH && looksSeeded(existing.docs[0]))) continue
      await payload.delete({ collection: 'pages', id: existing.docs[0].id, overrideAccess: true })
      replaced += 1
    }

    await payload.create({
      collection: 'pages',
      overrideAccess: true,
      data: {
        title: page.title,
        slug: page.slug,
        pageType: page.pageType,
        hero: {
          eyebrow: page.hero.eyebrow,
          heading: page.hero.heading,
          description: page.hero.description,
          height: 'medium',
          alignment: 'bottom-left',
          buttons: 'buttons' in page.hero ? page.hero.buttons : undefined,
        },
        sections: page.sections as never,
        _status: 'published',
      },
    })
    created += 1
  }

  log(
    `Pages: ${created} created and published` +
      (replaced ? `, ${replaced} placeholder page(s) replaced` : ''),
  )
}

/**
 * Marks the gowns the reference site features under "Most loved".
 *
 * Runs after `import:catalogue`; before the gowns exist it finds nothing
 * and says so rather than failing.
 */
const seedHighlights = async (payload: Payload) => {
  let flagged = 0
  let missing = 0

  for (const slug of MOST_LOVED_SLUGS) {
    const existing = await payload.find({
      collection: 'dresses',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    const doc = existing.docs[0]
    if (!doc) {
      missing += 1
      continue
    }
    if (doc.mostLoved) continue

    await payload.update({
      collection: 'dresses',
      id: doc.id,
      data: { mostLoved: true },
      overrideAccess: true,
    })
    flagged += 1
  }

  if (missing === MOST_LOVED_SLUGS.length) {
    log('Most loved: no gowns yet — run npm run import:catalogue first')
  } else {
    const tail = missing ? `, ${missing} not found` : ''
    log(`Most loved: ${flagged} gown(s) flagged${tail}`)
  }
}

/**
 * Legal page shells.
 *
 * The reference links Privacy, Cookies, Terms and Accessibility from every
 * page. The policy text is not published there and is not ours to write, so
 * each page carries a clearly marked notice and the boutique's contact
 * details instead. That is honest, and it means the footer links resolve
 * rather than 404 on every page of the site.
 *
 * These must be replaced with real policies before launch — the README's
 * checklist says so.
 */
const seedLegalPages = async (payload: Payload) => {
  let created = 0

  for (const legal of LEGAL_LINKS) {
    const slug = legal.url.replace(/^\//, '')
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
      draft: true,
    })
    if (existing.docs.length) continue

    await payload.create({
      collection: 'pages',
      overrideAccess: true,
      data: {
        title: legal.title,
        slug,
        pageType: 'standard',
        hero: { heading: legal.title, height: 'medium', alignment: 'bottom-left' },
        sections: [
          {
            blockType: 'rich-text',
            content: richText([
              `This ${legal.title.toLowerCase()} statement is being prepared and will be published here shortly.`,
              `In the meantime, the Angelo Bridal team will answer any question directly: call ${SITE.phone} or email ${SITE.email}.`,
            ]),
            width: 'narrow',
            hidden: false,
          },
        ],
        _status: 'published',
      } as never,
    })
    created += 1
  }

  log(`Legal pages: ${created} created (replace the notice with real policy text)`)
}

const main = async () => {
  const payload = await getPayload({ config })

  console.log('\nSeeding Angelo Bridal from the boutique’s own content\n')

  await seedTaxonomies(payload)
  await seedDesigners(payload)
  await seedSiteSettings(payload)
  await seedNavigation(payload)
  await seedFooter(payload)
  await seedHomepage(payload)
  await seedFormSettings(payload)
  await seedGiftCards(payload)
  await seedFaqs(payload)
  await seedJournal(payload)
  await seedPages(payload)
  await seedLegalPages(payload)
  await seedHighlights(payload)

  const users = await payload.count({ collection: 'users', overrideAccess: true })

  console.log('\nDone.\n')

  if (users.totalDocs === 0) {
    console.log('Next: open http://localhost:3000/admin and create the first Super Admin account.\n')
  }

  console.log('Then:')
  console.log('  1. npm run import:catalogue    — the 76 gowns and their photographs')
  console.log('  2. Media library               — add boutique and hero photographs')
  console.log('  3. Homepage / Pages            — attach images to the hero and split sections')
  console.log('  4. Journal                     — write the three article bodies, then publish')
  console.log('  5. Site settings               — add social links and analytics IDs\n')

  process.exit(0)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
