import type { Homepage, Page } from '@/payload-types'

/**
 * Block types for the page builder.
 *
 * Payload inlines block shapes into each parent document type, so the Pages
 * and Homepage variants are separate declarations of the same structure (both
 * are generated from `pageBlocks`). Uniting them here gives one set of props
 * that works wherever the renderer is used.
 */
export type AnyBlock = NonNullable<Page['sections']>[number] | NonNullable<Homepage['sections']>[number]

export type BlockType = AnyBlock['blockType']

/** Narrows the union to one block, e.g. `BlockOf<'hero'>`. */
export type BlockOf<T extends BlockType> = Extract<AnyBlock, { blockType: T }>

/** Background tone shared by most blocks. */
export type Tone = 'paper' | 'shell' | 'ink'

export const toneOf = (value: Tone | null | undefined): Tone => value ?? 'paper'

/** A CMS link group, which may be half-filled while an editor is working. */
export type MaybeLink = { label?: string | null; url?: string | null } | null | undefined

/** Returns a link only when both halves are present. */
export const usableLink = (link: MaybeLink): { label: string; url: string } | null =>
  link?.label && link?.url ? { label: link.label, url: link.url } : null
