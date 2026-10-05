import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Page } from '@/payload-types'

/**
 * The shape Payload generates for a `richText` field.
 *
 * It is structurally the same data as Lexical's `SerializedEditorState` but
 * declared with a looser index signature, so one alias and one cast keep the
 * assertion in a single place instead of at every call site.
 */
export type RichTextValue = NonNullable<NonNullable<Page['sections']>[number] extends { content?: infer C }
  ? C
  : never>

/** Narrow, documented cast between the two equivalent representations. */
export const asEditorState = (value: unknown): SerializedEditorState =>
  value as SerializedEditorState

export const isEmptyRichText = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return true
  const root = (value as { root?: { children?: unknown[] } }).root
  if (!root?.children?.length) return true
  return plainTextFrom(value).trim().length === 0
}

/**
 * Flattens rich text to plain text for meta descriptions, FAQ structured data
 * and search indexing.
 */
export const plainTextFrom = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''
  try {
    return convertLexicalToPlaintext({ data: asEditorState(value) }).replace(/\s+/g, ' ').trim()
  } catch {
    // Malformed editor state should never break a page render.
    return ''
  }
}
