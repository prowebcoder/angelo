import type { DressSummary } from '@/actions/dresses'

/**
 * Shared shapes for Ask Angelo.
 *
 * Kept out of `actions/assistant.ts` because a `'use server'` module may only
 * export async functions. This is also the seam an AI provider would sit
 * behind later: anything that returns an `AssistantReply` can drive the same
 * interface.
 */
export type AssistantReply = {
  /** Short prose answer. */
  text: string
  /** Gowns to show beneath the answer, drawn from the real catalogue. */
  dresses?: DressSummary[]
  /** Follow-up actions, as links. */
  links?: { label: string; href: string }[]
  /** Suggested next questions. */
  suggestions?: string[]
}

/** Starter prompts shown when the assistant is first opened. */
export const STARTER_QUESTIONS = [
  'Which appointment should I book?',
  'Show me romantic lace gowns',
  'How do alterations work?',
  'Where is Angelo Bridal?',
  'What designers do you carry?',
  'Do you have plus-size samples?',
  'What happens at my appointment?',
] as const
