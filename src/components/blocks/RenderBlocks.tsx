import type { RawSearchParams } from '@/lib/filters'
import {
  CategoryLinksBlock,
  CTABlock,
  FullWidthImageBlock,
  GalleryBlock,
  HeroBlock,
  RichTextBlock,
  SpacerBlock,
  SplitContentBlock,
  TwoColumnTextBlock,
  VideoBlock,
} from './EditorialBlocks'
import { FeaturePanelBlock, SplitPanelBlock, StatementBlock } from './FeaturePanel'
import {
  CollectionExplorerBlock,
  DesignerGridBlock,
  DesignerSequenceBlock,
  DressGridBlock,
  FeaturedDesignersBlock,
  FeaturedDressesBlock,
} from './CatalogueBlocks'
import {
  AwardsBlock,
  EventListBlock,
  InstagramBlock,
  JournalListBlock,
  RealBridesBlock,
  TestimonialsBlock,
} from './StoryBlocks'
import { FaqBlock, FormBlock, NewsletterBlock, ProcessTimelineBlock, ServicesGridBlock } from './ServiceBlocks'
import { ContactInformationBlock, MapBlock, OpeningHoursBlock } from './BoutiqueBlocks'
import type { AnyBlock } from './types'

type Props = {
  blocks: AnyBlock[] | null | undefined
  /**
   * Current query string. Needed by the browsable-catalogue block so its
   * filters reflect the URL.
   */
  searchParams?: RawSearchParams
  /** Path the catalogue block links back to. */
  basePath?: string
}

/**
 * Maps page-builder sections to components.
 *
 * Each block renders itself and returns nothing when it has no content, so a
 * half-finished section never leaves an empty band on the page. Sections an
 * editor has ticked as hidden are dropped here.
 *
 * Unknown block types are skipped rather than thrown: a page should survive a
 * block being removed from the code before the content is migrated.
 */
export const RenderBlocks = ({ blocks, searchParams = {}, basePath = '/dresses' }: Props) => {
  const visible = (blocks ?? []).filter((block) => !block.hidden)
  if (!visible.length) return null

  return (
    <>
      {visible.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`

        switch (block.blockType) {
          /* Editorial */
          case 'hero':
            return <HeroBlock key={key} data={block} priority={index === 0} />
          case 'rich-text':
            return <RichTextBlock key={key} block={block} />
          case 'two-column-text':
            return <TwoColumnTextBlock key={key} block={block} />
          case 'split-content':
            return <SplitContentBlock key={key} block={block} />
          case 'full-width-image':
            return <FullWidthImageBlock key={key} block={block} />
          case 'gallery':
            return <GalleryBlock key={key} block={block} />
          case 'video-hero':
            return <VideoBlock key={key} block={block} />
          case 'call-to-action':
            return <CTABlock key={key} block={block} />
          case 'feature-panel':
            return <FeaturePanelBlock key={key} block={block} />
          case 'split-panel':
            return <SplitPanelBlock key={key} block={block} />
          case 'statement':
            return <StatementBlock key={key} block={block} />
          case 'spacer':
            return <SpacerBlock key={key} block={block} />
          case 'category-links':
            return <CategoryLinksBlock key={key} block={block} />

          /* Catalogue */
          case 'featured-dresses':
            return <FeaturedDressesBlock key={key} block={block} />
          case 'dress-grid':
            return <DressGridBlock key={key} block={block} />
          case 'collection-explorer':
            return (
              <CollectionExplorerBlock key={key} block={block} searchParams={searchParams} basePath={basePath} />
            )
          case 'featured-designers':
            return <FeaturedDesignersBlock key={key} block={block} />
          case 'designer-grid':
            return <DesignerGridBlock key={key} block={block} />
          case 'designer-sequence':
            return <DesignerSequenceBlock key={key} block={block} />

          /* Stories */
          case 'real-brides':
            return <RealBridesBlock key={key} block={block} />
          case 'testimonials':
            return <TestimonialsBlock key={key} block={block} />
          case 'awards':
            return <AwardsBlock key={key} block={block} />
          case 'journal-list':
            return <JournalListBlock key={key} block={block} />
          case 'event-list':
            return <EventListBlock key={key} block={block} />
          case 'instagram-preview':
            return <InstagramBlock key={key} block={block} />

          /* Service pages */
          case 'services-grid':
            return <ServicesGridBlock key={key} block={block} />
          case 'process-timeline':
            return <ProcessTimelineBlock key={key} block={block} />
          case 'faq-list':
            return <FaqBlock key={key} block={block} />
          case 'form':
            return <FormBlock key={key} block={block} />
          case 'newsletter':
            return <NewsletterBlock key={key} block={block} />

          /* The boutique */
          case 'opening-hours':
            return <OpeningHoursBlock key={key} block={block} />
          case 'contact-information':
            return <ContactInformationBlock key={key} block={block} />
          case 'map':
            return <MapBlock key={key} block={block} />

          default:
            return null
        }
      })}
    </>
  )
}
