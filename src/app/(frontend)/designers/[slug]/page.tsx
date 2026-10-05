import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DressGrid } from '@/components/dresses/DressGrid'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { ResponsiveHeroImage } from '@/components/ui/Media'
import { RichText } from '@/components/ui/RichText'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getDesignerBySlug, getDesigners, getDressesForDesigner, getSiteSettings } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateStaticParams = async () => {
  const designers = await getDesigners()
  return designers.map((designer) => ({ slug: designer.slug }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const [designer, settings] = await Promise.all([getDesignerBySlug(slug), getSiteSettings()])
  if (!designer) return {}

  return buildMetadata({
    seo: designer.seo,
    fallbackTitle: designer.name,
    fallbackDescription: designer.description,
    fallbackImage: designer.heroImage ?? designer.logo,
    path: `/designers/${slug}`,
    settings,
  })
}

/**
 * Designer collection page.
 *
 * Publishing a designer in the admin creates this page and fills it with
 * whatever gowns are assigned to them — no route or code change needed.
 */
const DesignerPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const designer = await getDesignerBySlug(slug)

  if (!designer) notFound()

  const dresses = await getDressesForDesigner(designer.id, 48)
  const hasHero = Boolean(designer.heroImage)

  return (
    <>
      {hasHero ? (
        <section className="relative flex h-[46svh] items-end overflow-hidden bg-ink md:h-[58svh]">
          <ResponsiveHeroImage desktop={designer.heroImage} alt={designer.name} priority />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
          <div className="relative z-10 shell pb-10 md:pb-14">
            <p className="text-[0.6875rem] font-medium tracking-[0.22em] text-on-ink/80 uppercase">Designer</p>
            <h1 className="mt-3 text-h1 text-on-ink">{designer.name}</h1>
          </div>
        </section>
      ) : null}

      <div className="shell pt-8">
        <Breadcrumbs
          crumbs={[
            { name: 'Designers', href: '/designers' },
            { name: designer.name, href: `/designers/${slug}` },
          ]}
        />
      </div>

      <Section spacing="tight">
        <div className="shell">
          {!hasHero ? (
            <>
              <p className="eyebrow">Designer</p>
              <h1 className="mt-3 text-h1">{designer.name}</h1>
            </>
          ) : null}

          <div className="mt-6 grid gap-10 md:grid-cols-[2fr_1fr] md:gap-16">
            <div>
              {designer.description ? (
                <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">{designer.description}</p>
              ) : null}
              {designer.longDescription ? (
                <div className="mt-8">
                  <RichText data={designer.longDescription} />
                </div>
              ) : null}
            </div>

            <div className="md:pt-2">
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
                    In the boutique
                  </dt>
                  <dd className="mt-1 text-ink-soft">
                    {dresses.length
                      ? `${dresses.length} ${dresses.length === 1 ? 'gown' : 'gowns'}`
                      : 'Gowns are being added'}
                  </dd>
                </div>
                {designer.website ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
                      The house
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={designer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-quiet text-ink-soft"
                      >
                        Visit their website
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <ButtonLink href="/your-appointment" className="mt-8 w-full">
                Book an appointment
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="shell">
        <div className="shell">
          <SectionHeading
            eyebrow="The collection"
            title={`${designer.name} at Angelo Bridal`}
            className="mb-10"
          />
          <DressGrid
            dresses={dresses}
            columns={4}
            emptyMessage={`Gowns from ${designer.name} are being photographed. Book an appointment and we will show you what is in store.`}
          />
        </div>
      </Section>
    </>
  )
}

export default DesignerPage
