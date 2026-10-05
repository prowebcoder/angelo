import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { HeroBlock } from '@/components/blocks/EditorialBlocks'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { JsonLd } from '@/components/ui/JsonLd'
import { Section } from '@/components/ui/Section'
import { getFaqs, getPageBySlug, getPageSlugs, getSiteSettings } from '@/lib/queries'
import { buildMetadata, faqSchema } from '@/lib/seo'
import { plainTextFrom } from '@/lib/richtext'

export const revalidate = 3600

/**
 * Prerenders every published page at build time; pages added later are
 * rendered on first request and then cached.
 */
export const generateStaticParams = async () => {
  const slugs = await getPageSlugs()
  return slugs.filter((slug) => slug !== 'home').map((slug) => ({ slug }))
}

/**
 * Paths that can never be a CMS page.
 *
 * As the catch-all route, this file is asked to resolve anything the rest of
 * the app did not claim — including browser probes for `/favicon.ico` and
 * similar. Page slugs never contain a dot, so rejecting those here avoids a
 * pointless database round trip on every such request.
 */
const isAssetPath = (slug: string): boolean => slug.includes('.')

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  if (isAssetPath(slug)) return {}

  const [page, settings] = await Promise.all([getPageBySlug(slug), getSiteSettings()])
  if (!page) return {}

  return buildMetadata({
    seo: page.seo,
    fallbackTitle: page.title,
    fallbackDescription: page.hero?.description,
    fallbackImage: page.hero?.image,
    path: `/${slug}`,
    settings,
  })
}

/**
 * Catch-all route for CMS pages.
 *
 * About, alterations, your appointment, contact, questions and anything else
 * staff create all resolve here from their slug, so publishing a page in the
 * admin is enough to put it live.
 */
const CmsPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  if (isAssetPath(slug)) notFound()

  const page = await getPageBySlug(slug)

  if (!page) notFound()

  const hero = page.hero
  const hasHero = Boolean(hero?.heading || hero?.image || hero?.videoURL)

  // A questions page gets FAQPage structured data from its published entries.
  const faqs = page.pageType === 'faq' ? await getFaqs() : []
  const faqGraph = faqs.length
    ? faqSchema(faqs.map((faq) => ({ question: faq.question, answer: plainTextFrom(faq.answer) })))
    : null

  return (
    <>
      {hasHero && hero ? <HeroBlock data={hero} priority /> : null}

      <div className="shell pt-8">
        <Breadcrumbs crumbs={[{ name: page.title, href: `/${slug}` }]} />
      </div>

      {!hasHero ? (
        <Section spacing="tight">
          <div className="shell">
            <h1 className="text-h1">{page.title}</h1>
            {hero?.description ? (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{hero.description}</p>
            ) : null}
          </div>
        </Section>
      ) : null}

      <RenderBlocks blocks={page.sections} basePath="/dresses" />

      {faqGraph ? <JsonLd data={faqGraph} /> : null}
    </>
  )
}

export default CmsPage
