import type { Metadata } from 'next'
import { AccessoryGrid, accessoryCategory } from '@/components/accessories/AccessoryCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getAccessories, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  return buildMetadata({
    fallbackTitle: 'Accessories',
    fallbackDescription: 'Veils, shoes, jewellery and belts to finish your gown.',
    path: '/accessories',
    settings,
  })
}

/**
 * Accessories listing, grouped by category.
 *
 * Categories come from the taxonomy, so the groups follow whatever the
 * boutique stocks rather than a fixed list in code.
 */
const AccessoriesPage = async () => {
  const accessories = await getAccessories(80)

  const groups = accessories.reduce<{ name: string; items: typeof accessories }[]>((result, accessory) => {
    const name = accessoryCategory(accessory) ?? 'Other pieces'
    const existing = result.find((group) => group.name === name)
    if (existing) existing.items.push(accessory)
    else result.push({ name, items: [accessory] })
    return result
  }, [])

  return (
    <>
      <Section spacing="tight">
        <div className="shell">
          <Breadcrumbs crumbs={[{ name: 'Accessories', href: '/accessories' }]} className="mb-6" />
          <p className="eyebrow">The finishing touch</p>
          <h1 className="mt-3 text-h1">Bridal accessories</h1>
          <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-soft">
            {accessories.length
              ? 'Verified products currently marked available on the Angelo Bridal online shop.'
              : 'Accessories are being added to the site. Ask your consultant what is in the boutique.'}
          </p>
        </div>
      </Section>

      {groups.length ? (
        groups.map((group, index) => (
          <Section key={group.name} tone={index % 2 === 1 ? 'shell' : 'paper'} spacing="tight" className="pb-16">
            <div className="shell">
              <SectionHeading level={2} title={group.name} className="mb-8" />
              <AccessoryGrid accessories={group.items} />
            </div>
          </Section>
        ))
      ) : (
        <Section spacing="tight" className="pb-(--spacing-section)">
          <div className="shell">
            <AccessoryGrid accessories={[]} />
          </div>
        </Section>
      )}

      <Section tone="shell">
        <div className="shell-narrow text-center">
          <SectionHeading
            eyebrow="To buy"
            title="Accessories are bought in the boutique"
            description="There is no checkout here yet: live stock, tax, shipping, returns and payments remain on the current shop. Tell your consultant what caught your eye and they will have it ready at your fitting."
            align="center"
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/your-appointment">Book an appointment</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Ask about a piece
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  )
}

export default AccessoriesPage
