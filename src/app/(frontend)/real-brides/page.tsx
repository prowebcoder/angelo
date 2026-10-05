import type { Metadata } from 'next'
import { BrideGrid } from '@/components/brides/BrideCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section } from '@/components/ui/Section'
import { getRealBrides, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: 'Real brides',
    fallbackDescription: 'Wedding days of brides who found their gown with us.',
    path: '/real-brides',
    settings,
  })
}

const RealBridesPage = async () => {
  const brides = await getRealBrides(60)

  return (
    <Section spacing="tight" className="pb-(--spacing-section)">
      <div className="shell">
        <Breadcrumbs crumbs={[{ name: 'Real brides', href: '/real-brides' }]} className="mb-6" />
        <h1 className="text-h1">Stories of yes</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {brides.length
            ? 'Brides who said yes in the boutique, on their wedding day.'
            : 'Bride stories are being gathered, with their permission.'}
        </p>

        <div className="mt-14">
          <BrideGrid brides={brides} />
        </div>
      </div>
    </Section>
  )
}

export default RealBridesPage
