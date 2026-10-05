import type { Metadata } from 'next'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { HeroBlock } from '@/components/blocks/EditorialBlocks'
import { Section, SectionHeading } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { getHomepage, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateMetadata = async (): Promise<Metadata> => {
  const [homepage, settings] = await Promise.all([getHomepage(), getSiteSettings()])

  return buildMetadata({
    seo: homepage.seo,
    fallbackTitle: settings.seo?.defaultTitle ?? 'Angelo Bridal',
    fallbackDescription: settings.seo?.defaultDescription,
    fallbackImage: homepage.hero?.image,
    path: '/',
    settings,
  })
}

/**
 * The homepage.
 *
 * Both the opening section and every section below it are read from the
 * Homepage global, so staff reorder, hide or replace any part of this page
 * from the admin. The fallback below only appears before the CMS has been
 * filled in — it never masks real content.
 *
 * Deliberately does not read `searchParams`: touching it would make the most
 * visited page on the site render on every request instead of being served as
 * static HTML. The consequence is that a browsable-catalogue section placed
 * here shows the unfiltered first page; filtering belongs on `/dresses`,
 * which is dynamic for exactly that reason.
 */
const HomePage = async () => {
  const homepage = await getHomepage()
  const hero = homepage.hero
  const hasHero = Boolean(hero?.heading || hero?.image || hero?.videoURL)
  const sections = homepage.sections ?? []

  return (
    <>
      {hasHero && hero ? <HeroBlock data={hero} priority /> : null}

      <RenderBlocks blocks={sections} basePath="/dresses" />

      {!hasHero && !sections.length ? (
        <Section>
          <div className="shell-narrow text-center">
            <SectionHeading
              eyebrow="Angelo Bridal"
              title="The homepage is ready to be written"
              description="Sign in to the admin, open Homepage under Site management, and add the opening section and the sections below it. Everything on this page is editable there."
              align="center"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/admin/globals/homepage">Edit the homepage</ButtonLink>
              <ButtonLink href="/dresses" variant="secondary">
                Browse gowns
              </ButtonLink>
            </div>
          </div>
        </Section>
      ) : null}
    </>
  )
}

export default HomePage
