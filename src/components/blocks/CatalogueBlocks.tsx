import type { Designer, Dress } from '@/payload-types'
import { ButtonLink } from '@/components/ui/Button'
import { Section, SectionHeading } from '@/components/ui/Section'
import { CollectionExplorer } from '@/components/dresses/CollectionExplorer'
import { DressRail } from '@/components/dresses/DressRail'
import { DesignerGrid } from '@/components/designers/DesignerCard'
import { DesignerSequence } from '@/components/designers/DesignerSequence'
import { getDesigners, getDressesByIds, getFlaggedDresses } from '@/lib/queries'
import { isPopulated, resolveMedia } from '@/lib/media'
import type { RawSearchParams } from '@/lib/filters'
import { type BlockOf, toneOf, usableLink } from './types'

/** Relationship fields arrive populated at depth ≥ 1; fall back to a fetch. */
const resolveDresses = async (value: BlockOf<'featured-dresses'>['dresses']): Promise<Dress[]> => {
  const list = value ?? []
  if (!list.length) return []

  const populated = list.filter((item): item is Dress => isPopulated<Dress>(item))
  if (populated.length === list.length) return populated

  const ids = list.map((item) => (isPopulated<Dress>(item) ? item.id : item))
  return getDressesByIds(ids)
}

const resolveDesigners = async (value: BlockOf<'featured-designers'>['designers']): Promise<Designer[]> => {
  const list = value ?? []
  if (!list.length) return []

  const populated = list.filter((item): item is Designer => isPopulated<Designer>(item))
  if (populated.length === list.length) return populated

  const all = await getDesigners()
  const ids = new Set(list.map((item) => (isPopulated<Designer>(item) ? item.id : item)))
  return all.filter((designer) => ids.has(designer.id))
}

/** A hand-picked row of gowns. */
export const FeaturedDressesBlock = async ({ block }: { block: BlockOf<'featured-dresses'> }) => {
  const dresses = await resolveDresses(block.dresses)
  if (!dresses.length) return null

  const link = usableLink(block.link)

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
          {link ? (
            <ButtonLink href={link.url} variant="ghost" className="shrink-0">
              {link.label}
            </ButtonLink>
          ) : null}
        </div>
        <DressRail dresses={dresses} />
      </div>
    </Section>
  )
}

/** A row that fills itself from a catalogue flag, e.g. "most loved". */
export const DressGridBlock = async ({ block }: { block: BlockOf<'dress-grid'> }) => {
  const dresses = await getFlaggedDresses(block.source, block.limit ?? 8)
  if (!dresses.length) return null

  const link = usableLink(block.link)

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
          {link ? (
            <ButtonLink href={link.url} variant="ghost" className="shrink-0">
              {link.label}
            </ButtonLink>
          ) : null}
        </div>
        <DressRail dresses={dresses} />
      </div>
    </Section>
  )
}

/**
 * The browsable catalogue as a page section.
 *
 * It needs the page's `searchParams` to stay in step with the URL, so the
 * renderer passes them down.
 */
export const CollectionExplorerBlock = ({
  block,
  searchParams,
  basePath,
}: {
  block: BlockOf<'collection-explorer'>
  searchParams: RawSearchParams
  basePath: string
}) => (
  <Section>
    <div className="shell">
      <SectionHeading title={block.heading} description={block.description} className="mb-10" />
      <CollectionExplorer searchParams={searchParams} basePath={basePath} />
    </div>
  </Section>
)

export const FeaturedDesignersBlock = async ({ block }: { block: BlockOf<'featured-designers'> }) => {
  const designers = await resolveDesigners(block.designers)
  if (!designers.length) return null

  const link = usableLink(block.link)

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={block.eyebrow} title={block.heading} description={block.description} />
          {link ? (
            <ButtonLink href={link.url} variant="ghost" className="shrink-0">
              {link.label}
            </ButtonLink>
          ) : null}
        </div>
        <DesignerGrid designers={designers} columns={designers.length >= 4 ? 4 : 3} />
      </div>
    </Section>
  )
}

export const DesignerGridBlock = async ({ block }: { block: BlockOf<'designer-grid'> }) => {
  const all = await getDesigners()
  const designers = all.slice(0, block.limit ?? 12)
  if (!designers.length) return null

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-10"
        />
        <DesignerGrid designers={designers} columns={3} />
      </div>
    </Section>
  )
}

/**
 * The homepage designer sequence.
 *
 * Reads the designers in their CMS order and hands the sequence only what it
 * needs to draw, so Payload documents stay out of the client bundle.
 */
export const DesignerSequenceBlock = async ({ block }: { block: BlockOf<'designer-sequence'> }) => {
  const all = await getDesigners()
  const designers = all.slice(0, block.limit ?? 10)
  if (!designers.length) return null

  return (
    <DesignerSequence
      eyebrow={block.eyebrow}
      heading={block.heading}
      designers={designers.map((designer) => {
        const media = resolveMedia(designer.heroImage ?? designer.logo)
        return {
          id: designer.id,
          name: designer.name,
          slug: designer.slug,
          description: designer.description,
          image: media?.url ? { src: media.url, alt: media.alt || designer.name } : null,
        }
      })}
    />
  )
}
