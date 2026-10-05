'use server'

import { getDesigners, getFaqs, getSiteSettings, getTaxonomies, queryDresses } from '@/lib/queries'
import { designerName } from '@/lib/format'
import { resolveMedia } from '@/lib/media'
import { plainTextFrom } from '@/lib/richtext'
import { STARTER_QUESTIONS, type AssistantReply } from '@/lib/assistant-shared'
import type { DressSummary } from './dresses'

const BOOK_LINK = { label: 'Book an appointment', href: '/your-appointment' }

/**
 * Ask Angelo — a deterministic bridal concierge.
 *
 * Intentionally rule-based rather than generative: every answer is either
 * editor-written content or a real catalogue query, so the assistant cannot
 * invent a gown, a price or an opening time. An AI provider could be slotted
 * in behind this same return shape later — the UI would not change.
 */

type Intent =
  | 'appointment'
  | 'alterations'
  | 'location'
  | 'hours'
  | 'designers'
  | 'price'
  | 'plus-size'
  | 'sample-sale'
  | 'gowns'
  | 'unknown'

const MATCHERS: { intent: Intent; patterns: RegExp[] }[] = [
  { intent: 'alterations', patterns: [/alter/i, /fitting/i, /hem/i, /taken in/i, /seamstress/i] },
  { intent: 'hours', patterns: [/open/i, /hours/i, /what time/i, /closed/i, /sunday/i] },
  { intent: 'location', patterns: [/where/i, /address/i, /find you/i, /parking/i, /directions/i, /located/i] },
  { intent: 'designers', patterns: [/designer/i, /label/i, /brand/i, /who do you (?:carry|stock)/i] },
  { intent: 'plus-size', patterns: [/plus[- ]?size/i, /curve/i, /size 1[6-9]/i, /size 2[0-9]/i, /bigger size/i] },
  { intent: 'sample-sale', patterns: [/sample sale/i, /off the rack/i, /discount/i, /sale/i, /take home today/i] },
  { intent: 'price', patterns: [/price/i, /cost/i, /how much/i, /budget/i, /afford/i] },
  {
    intent: 'appointment',
    patterns: [/appointment/i, /book/i, /visit/i, /consultation/i, /what happens/i, /bring/i],
  },
]

const detectIntent = (question: string): Intent => {
  for (const matcher of MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(question))) return matcher.intent
  }
  // Anything that reads like a gown description goes to the catalogue.
  if (/gown|dress|lace|satin|silk|tulle|sleeve|train|mermaid|ballgown|a-?line|romantic|minimal|boho/i.test(question)) {
    return 'gowns'
  }
  return 'unknown'
}

const toSummaries = (
  dresses: Awaited<ReturnType<typeof queryDresses>>['docs'],
): DressSummary[] =>
  dresses.map((dress) => ({
    id: dress.id,
    name: dress.name,
    slug: dress.slug,
    designer: designerName(dress),
    styleCode: dress.styleCode ?? null,
    image: resolveMedia(dress.primaryImage)?.sizes?.card?.url ?? resolveMedia(dress.primaryImage)?.url ?? null,
  }))

/**
 * Reads the question against the managed taxonomy.
 *
 * Because the vocabulary comes from the CMS, adding a "Corset bodice" term
 * immediately makes "show me corset gowns" work — no code change.
 */
const taxonomyFiltersFor = async (question: string) => {
  const terms = await getTaxonomies()
  const lower = question.toLowerCase()

  const matched = terms.filter((term) => {
    const name = term.name.toLowerCase()
    if (name.length < 4) return false
    return lower.includes(name) || lower.includes(term.slug.replace(/-/g, ' '))
  })

  // Group matches by their dress field, mirroring the catalogue filters.
  const FIELD_BY_KIND: Record<string, string> = {
    silhouette: 'silhouette',
    style: 'style',
    feature: 'features',
    fabric: 'fabrics',
    neckline: 'neckline',
    sleeve: 'sleeve',
    train: 'train',
    size: 'sizes',
    colour: 'colour',
  }

  const grouped = new Map<string, string[]>()
  for (const term of matched) {
    const field = FIELD_BY_KIND[term.kind]
    if (!field) continue
    grouped.set(field, [...(grouped.get(field) ?? []), term.slug])
  }

  return {
    filters: Array.from(grouped, ([field, slugs]) => ({ field, slugs })),
    matchedNames: matched.map((term) => term.name),
  }
}

const findFaqAnswer = async (patterns: RegExp[]): Promise<string | null> => {
  const faqs = await getFaqs()
  const match = faqs.find((faq) => patterns.some((pattern) => pattern.test(faq.question)))
  if (!match) return null
  const text = plainTextFrom(match.answer)
  return text || null
}

export const askAngelo = async (rawQuestion: string): Promise<AssistantReply> => {
  const question = rawQuestion.trim().slice(0, 300)
  if (!question) {
    return {
      text: 'Ask me about gowns, designers, appointments or alterations.',
      suggestions: [...STARTER_QUESTIONS].slice(0, 4),
    }
  }

  const intent = detectIntent(question)

  switch (intent) {
    case 'location': {
      const settings = await getSiteSettings()
      const address = settings.contact?.address
      if (!address) {
        return {
          text: 'The boutique address is listed on our contact page.',
          links: [{ label: 'Contact and directions', href: '/contact' }],
        }
      }
      return {
        text: `You will find us at ${address.replace(/\n/g, ', ')}.`,
        links: [
          ...(settings.contact?.googleMapsURL
            ? [{ label: 'Open in maps', href: settings.contact.googleMapsURL }]
            : []),
          { label: 'Contact and opening hours', href: '/contact' },
        ],
        suggestions: ['What are your opening hours?', 'Which appointment should I book?'],
      }
    }

    case 'hours': {
      const settings = await getSiteSettings()
      const hours = settings.openingHours ?? []
      if (!hours.length) {
        return {
          text: 'Our opening hours are on the contact page.',
          links: [{ label: 'Opening hours', href: '/contact' }],
        }
      }
      const lines = hours.map((entry) =>
        entry.closed
          ? `${entry.day}: closed`
          : entry.specialNote
            ? `${entry.day}: ${entry.specialNote}`
            : entry.openingTime && entry.closingTime
              ? `${entry.day}: ${entry.openingTime}–${entry.closingTime}`
              : `${entry.day}: by appointment`,
      )
      return {
        text: `We are open ${lines.join(' · ')}. Appointments are recommended so a consultant is free for you.`,
        links: [BOOK_LINK],
      }
    }

    case 'designers': {
      const designers = await getDesigners()
      if (!designers.length) {
        return {
          text: 'Our designer collections are listed on the designers page.',
          links: [{ label: 'See the designers', href: '/designers' }],
        }
      }
      const names = designers.map((designer) => designer.name)
      return {
        text: `We carry ${names.slice(0, -1).join(', ')}${names.length > 1 ? ` and ${names[names.length - 1]}` : names[0]}.`,
        links: [{ label: 'See all designers', href: '/designers' }, BOOK_LINK],
        suggestions: ['Show me most loved gowns', 'Which appointment should I book?'],
      }
    }

    case 'alterations': {
      const answer = await findFaqAnswer([/alter/i, /fitting/i])
      return {
        text:
          answer ??
          'Alterations are carried out in house. We take you through fit, length, bodice and train at a series of fittings, and the alterations page explains each stage and what it involves.',
        links: [{ label: 'About alterations', href: '/alterations' }],
        suggestions: ['When should I start alterations?', 'Where is Angelo Bridal?'],
      }
    }

    case 'appointment': {
      const answer = await findFaqAnswer([/appointment/i, /what happens/i, /bring/i])
      return {
        text:
          answer ??
          'A first appointment is a private hour or so with a consultant who listens, then brings you gowns to try. Bring whoever you want with you, and any shoes or underwear you already have in mind. Request a time and we will confirm by email.',
        links: [BOOK_LINK, { label: 'Your appointment', href: '/your-appointment' }],
        suggestions: ['Do you have plus-size samples?', 'What designers do you carry?'],
      }
    }

    case 'price': {
      return {
        text:
          'Prices vary by designer and gown, and some are confirmed in the boutique rather than listed. Where we hold a confirmed price it is shown on the gown. Tell your consultant your budget when you book and they will pull gowns that sit inside it.',
        links: [{ label: 'Browse the collection', href: '/dresses' }, BOOK_LINK],
        suggestions: ['Show me sample sale gowns'],
      }
    }

    case 'plus-size': {
      const results = await queryDresses({
        taxonomies: [{ field: 'sizes', slugs: ['plus-size'] }],
        limit: 4,
      })
      if (!results.docs.length) {
        return {
          text:
            'Sample sizes vary by gown. Tell us your size when you request an appointment and your consultant will confirm what is available to try before you come in.',
          links: [BOOK_LINK],
        }
      }
      return {
        text: `Yes — we hold ${results.totalDocs} ${results.totalDocs === 1 ? 'gown' : 'gowns'} with extended-size samples. Here are a few.`,
        dresses: toSummaries(results.docs),
        links: [{ label: 'See all plus size gowns', href: '/dresses/plus-size' }, BOOK_LINK],
      }
    }

    case 'sample-sale': {
      const results = await queryDresses({ sampleSale: true, limit: 4 })
      if (!results.docs.length) {
        return {
          text: 'There is nothing in the sample sale at the moment. Join the Angelo letter and we will tell you when gowns are released.',
          links: [{ label: 'Browse the collection', href: '/dresses' }],
        }
      }
      return {
        text: `We have ${results.totalDocs} ${results.totalDocs === 1 ? 'gown' : 'gowns'} available off the rack.`,
        dresses: toSummaries(results.docs),
        links: [{ label: 'See the sample sale', href: '/dresses/sample-sale' }, BOOK_LINK],
      }
    }

    case 'gowns':
    default: {
      const { filters, matchedNames } = await taxonomyFiltersFor(question)

      if (filters.length) {
        const results = await queryDresses({ taxonomies: filters, limit: 4 })
        if (results.docs.length) {
          const query = new URLSearchParams()
          for (const group of filters) {
            // Map the dress field back to its catalogue query parameter.
            const param =
              group.field === 'features'
                ? 'feature'
                : group.field === 'fabrics'
                  ? 'fabric'
                  : group.field === 'sizes'
                    ? 'size'
                    : group.field
            for (const slug of group.slugs) query.append(param, slug)
          }

          return {
            text: `Here ${results.docs.length === 1 ? 'is a gown' : 'are some gowns'} matching ${matchedNames.join(' and ').toLowerCase()} — ${results.totalDocs} in total.`,
            dresses: toSummaries(results.docs),
            links: [{ label: 'See them all', href: `/dresses?${query.toString()}` }, BOOK_LINK],
          }
        }

        return {
          text: `I could not find a gown matching ${matchedNames.join(' and ').toLowerCase()} in the collection right now. Your consultant may still have something close — it is worth asking at an appointment.`,
          links: [{ label: 'Browse everything', href: '/dresses' }, BOOK_LINK],
        }
      }

      // Nothing recognised: search by words instead of guessing.
      const results = await queryDresses({ search: question, limit: 4 })
      if (results.docs.length) {
        return {
          text: `Here is what I found for “${question}”.`,
          dresses: toSummaries(results.docs),
          links: [{ label: 'See all results', href: `/search?q=${encodeURIComponent(question)}` }],
        }
      }

      return {
        text: 'I did not quite catch that. I can help with gowns, designers, appointments, alterations and finding the boutique — or the team will answer anything I cannot.',
        links: [{ label: 'Contact the boutique', href: '/contact' }, BOOK_LINK],
        suggestions: [...STARTER_QUESTIONS].slice(0, 4),
      }
    }
  }
}
