import type { Metadata } from 'next'
import type { Media, SiteSetting } from '@/payload-types'
import { absoluteURL, getServerURL } from './env'
import { resolveMedia } from './media'

type SeoGroup = {
  title?: string | null
  description?: string | null
  image?: (number | null) | Media
  canonicalURL?: string | null
  noIndex?: boolean | null
} | null | undefined

type MetadataInput = {
  /** Entity-specific SEO group from the CMS; always wins when populated. */
  seo?: SeoGroup
  /** Fallbacks derived from the document itself. */
  fallbackTitle?: string | null
  fallbackDescription?: string | null
  fallbackImage?: (number | null) | Media
  /** Canonical path, e.g. `/dress/amy`. */
  path: string
  settings: SiteSetting
  type?: 'website' | 'article' | 'profile'
  /**
   * Set for filter permutations and other pages that must not be indexed
   * even though they are publicly reachable.
   */
  noIndex?: boolean
}

const SITE_NAME = 'Angelo Bridal'

const absoluteImage = (value: (number | null) | Media | undefined): string | null => {
  const media = resolveMedia(value)
  if (!media?.url) return null
  return media.url.startsWith('http') ? media.url : absoluteURL(media.url)
}

/**
 * Single source of page metadata.
 *
 * Priority is: entity SEO fields → the document's own content → site defaults.
 * Nothing is invented; a missing description is simply omitted.
 */
export const buildMetadata = ({
  seo,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  path,
  settings,
  type = 'website',
  noIndex,
}: MetadataInput): Metadata => {
  const title = seo?.title?.trim() || fallbackTitle?.trim() || settings.seo?.defaultTitle?.trim() || SITE_NAME
  const description =
    seo?.description?.trim() || fallbackDescription?.trim() || settings.seo?.defaultDescription?.trim() || undefined

  const image =
    absoluteImage(seo?.image) ?? absoluteImage(fallbackImage) ?? absoluteImage(settings.seo?.defaultOGImage)

  const canonical = seo?.canonicalURL?.trim() || absoluteURL(path)
  const blockIndexing = noIndex || seo?.noIndex === true

  return {
    title,
    description,
    alternates: { canonical },
    robots: blockIndexing ? { index: false, follow: true } : undefined,
    openGraph: {
      type: type === 'profile' ? 'profile' : type,
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_IE',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Structured data                                                            */
/*                                                                            */
/* Only CMS-recorded facts are emitted. No ratings, reviews or availability    */
/* are fabricated — absent data simply produces a smaller graph.               */
/* -------------------------------------------------------------------------- */

type JsonLd = Record<string, unknown>

export const organizationSchema = (settings: SiteSetting): JsonLd => {
  const logo = absoluteImage(settings.branding?.logo)
  const socials = Object.values(settings.social ?? {}).filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: getServerURL(),
    ...(logo ? { logo } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  }
}

const OPENING_DAY_CODES: Record<string, string> = {
  Monday: 'Mo',
  Tuesday: 'Tu',
  Wednesday: 'We',
  Thursday: 'Th',
  Friday: 'Fr',
  Saturday: 'Sa',
  Sunday: 'Su',
}

export const localBusinessSchema = (settings: SiteSetting): JsonLd => {
  const hours = (settings.openingHours ?? [])
    .filter((entry) => !entry.closed && entry.openingTime && entry.closingTime)
    .map((entry) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: OPENING_DAY_CODES[entry.day] ?? entry.day,
      opens: entry.openingTime,
      closes: entry.closingTime,
    }))

  const image = absoluteImage(settings.seo?.defaultOGImage)

  return {
    '@context': 'https://schema.org',
    '@type': 'BridalShop',
    name: SITE_NAME,
    url: getServerURL(),
    ...(settings.contact?.phone ? { telephone: settings.contact.phone } : {}),
    ...(settings.contact?.email ? { email: settings.contact.email } : {}),
    ...(settings.contact?.address
      ? { address: { '@type': 'PostalAddress', streetAddress: settings.contact.address } }
      : {}),
    ...(settings.contact?.googleMapsURL ? { hasMap: settings.contact.googleMapsURL } : {}),
    ...(image ? { image } : {}),
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
  }
}

export const breadcrumbSchema = (crumbs: { name: string; href: string }[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: absoluteURL(crumb.href),
  })),
})

export const productSchema = (input: {
  name: string
  description?: string | null
  image?: string | null
  brand?: string | null
  sku?: string | null
  price?: number | null
  currency?: string | null
  url: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: input.name,
  url: absoluteURL(input.url),
  ...(input.description ? { description: input.description } : {}),
  ...(input.image ? { image: input.image } : {}),
  ...(input.brand ? { brand: { '@type': 'Brand', name: input.brand } } : {}),
  ...(input.sku ? { sku: input.sku } : {}),
  // An offer is only emitted when a real price exists in the CMS.
  ...(input.price != null
    ? {
        offers: {
          '@type': 'Offer',
          price: input.price,
          priceCurrency: input.currency ?? 'EUR',
          url: absoluteURL(input.url),
        },
      }
    : {}),
})

export const articleSchema = (input: {
  headline: string
  description?: string | null
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
  author?: string | null
  url: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: input.headline,
  url: absoluteURL(input.url),
  ...(input.description ? { description: input.description } : {}),
  ...(input.image ? { image: input.image } : {}),
  ...(input.datePublished ? { datePublished: input.datePublished } : {}),
  ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  ...(input.author ? { author: { '@type': 'Person', name: input.author } } : {}),
  publisher: { '@type': 'Organization', name: SITE_NAME },
})

export const eventSchema = (input: {
  name: string
  description?: string | null
  image?: string | null
  startDate?: string | null
  endDate?: string | null
  location?: string | null
  address?: string | null
  url: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: input.name,
  url: absoluteURL(input.url),
  ...(input.description ? { description: input.description } : {}),
  ...(input.image ? { image: input.image } : {}),
  ...(input.startDate ? { startDate: input.startDate } : {}),
  ...(input.endDate ? { endDate: input.endDate } : {}),
  ...(input.location || input.address
    ? {
        location: {
          '@type': 'Place',
          name: input.location ?? SITE_NAME,
          ...(input.address ? { address: { '@type': 'PostalAddress', streetAddress: input.address } } : {}),
        },
      }
    : {}),
})

export const faqSchema = (entries: { question: string; answer: string }[]): JsonLd | null => {
  const valid = entries.filter((entry) => entry.question && entry.answer)
  if (!valid.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}

export { absoluteImage }
