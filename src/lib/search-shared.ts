/**
 * Shared search vocabulary.
 *
 * Kept out of `actions/search.ts` because a `'use server'` module may only
 * export async functions — a constant there fails the build. Both the overlay
 * and the results page import from here.
 */

export type SearchGroup = 'dresses' | 'designers' | 'journal' | 'accessories' | 'events'

export type SearchHit = {
  id: string
  group: SearchGroup
  title: string
  /** Designer, category or date — whatever best identifies the hit. */
  meta?: string
  href: string
  image?: string
}

export type SearchResponse = {
  query: string
  hits: SearchHit[]
  total: number
}

/** Group headings, in the order results are shown. */
export const GROUP_LABELS: Record<SearchGroup, string> = {
  dresses: 'Wedding dresses',
  designers: 'Designers',
  accessories: 'Accessories',
  journal: 'Journal',
  events: 'Events',
}

/** Starter prompts offered by the Ask Angelo assistant. */
export const STARTER_QUESTIONS = [
  'Which appointment should I book?',
  'Show me romantic lace gowns',
  'How do alterations work?',
  'Where is Angelo Bridal?',
  'What designers do you carry?',
  'Do you have plus-size samples?',
  'What happens at my appointment?',
] as const
