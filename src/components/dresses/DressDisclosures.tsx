import type { Dress } from '@/payload-types'
import { Accordion } from '@/components/ui/Accordion'
import { RichText } from '@/components/ui/RichText'
import { availabilityLabel, dressDetailGroups, formatPrice } from '@/lib/format'
import { isEmptyRichText } from '@/lib/richtext'

/**
 * Product details, as the reference presents them.
 *
 * A disclosure list rather than a flat table: the design story, the
 * commercial facts, and a note about the photography each open on demand, so
 * the page stays quiet until someone wants the detail.
 *
 * Every value shown is one the boutique recorded. Where a price or sample
 * size is absent the row is omitted rather than filled with a guess, and the
 * caveats below each group are the reference's own wording — they matter
 * commercially, because sample availability genuinely does change.
 */
export const DressDisclosures = ({ dress, photographCount }: { dress: Dress; photographCount: number }) => {
  const price = formatPrice(dress.price, dress.currency ?? 'EUR')
  const details = dressDetailGroups(dress)

  const facts: { label: string; value: string }[] = [
    ...(price ? [{ label: 'Listed price', value: price }] : []),
    ...(dress.sampleSize ? [{ label: 'Boutique sample', value: dress.sampleSize }] : []),
    { label: 'Availability', value: availabilityLabel(dress) },
    ...(dress.collection ? [{ label: 'Collection', value: dress.collection }] : []),
    ...(dress.styleCode ? [{ label: 'Style code', value: dress.styleCode }] : []),
  ]

  const items = [
    ...(!isEmptyRichText(dress.designStory)
      ? [
          {
            id: 'story',
            question: 'Design story',
            answer: <RichText data={dress.designStory} />,
          },
        ]
      : dress.description
        ? [
            {
              id: 'story',
              question: 'Design story',
              answer: <p className="prose-editorial">{dress.description}</p>,
            },
          ]
        : []),
    {
      id: 'price',
      question: 'Price, colour & sample',
      answer: (
        <>
          <dl className="divide-y divide-line border-t border-line text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-6 py-3">
                <dt className="w-40 shrink-0 text-ink-muted">{fact.label}</dt>
                <dd className="text-ink-soft">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            Sample fit, colour and availability may change. Angelo Bridal will confirm the latest information
            before your appointment.
          </p>
        </>
      ),
    },
    ...(details.length
      ? [
          {
            id: 'detail',
            question: 'Silhouette, fabric & detail',
            answer: (
              <dl className="divide-y divide-line border-t border-line text-sm">
                {details.map((group) => (
                  <div key={group.label} className="flex gap-6 py-3">
                    <dt className="w-40 shrink-0 text-ink-muted">{group.label}</dt>
                    <dd className="text-ink-soft">{group.values.join(', ')}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
        ]
      : []),
    {
      id: 'viewing',
      question: 'Viewing experience',
      answer: (
        <p className="prose-editorial">
          {`${photographCount} approved product photograph${photographCount === 1 ? '' : 's'} support this restrained gallery experience; unphotographed views are not invented.`}
        </p>
      ),
    },
  ]

  return <Accordion items={items} />
}
