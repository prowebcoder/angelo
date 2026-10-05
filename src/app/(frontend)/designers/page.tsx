import type { Metadata } from 'next'
import { DesignerGrid } from '@/components/designers/DesignerCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Section } from '@/components/ui/Section'
import { getDesigners, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: 'Our designers',
    fallbackDescription: 'The bridal houses we carry at the boutique in Dublin.',
    path: '/designers',
    settings,
  })
}

const DesignersPage = async () => {
  const designers = await getDesigners()

  return (
    <Section spacing="tight" className="pb-(--spacing-section)">
      <div className="shell">
        <Breadcrumbs crumbs={[{ name: 'Designers', href: '/designers' }]} className="mb-6" />
        <h1 className="text-h1">Our designers</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {designers.length
            ? 'Each house brings something different. Explore a collection, then book a time to try the gowns in person.'
            : 'Designer collections are being added to the site.'}
        </p>

        <div className="mt-14">
          <DesignerGrid designers={designers} columns={3} />
        </div>
      </div>
    </Section>
  )
}

export default DesignersPage
