import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Dress } from '@/payload-types'
import { brideGownLabel } from '@/components/brides/BrideCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { MediaImage, ResponsiveHeroImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { RichText } from '@/components/ui/RichText'
import { Section } from '@/components/ui/Section'
import { getRealBrideBySlug, getRealBrideSlugs, getSiteSettings } from '@/lib/queries'
import { formatDate } from '@/lib/format'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateStaticParams = async () => {
  const slugs = await getRealBrideSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const [bride, settings] = await Promise.all([getRealBrideBySlug(slug), getSiteSettings()])
  if (!bride) return {}

  return buildMetadata({
    seo: bride.seo,
    fallbackTitle: `${bride.brideName}’s wedding day`,
    fallbackDescription: brideGownLabel(bride) ?? undefined,
    fallbackImage: bride.coverImage,
    path: `/real-brides/${slug}`,
    settings,
  })
}

const BridePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const bride = await getRealBrideBySlug(slug)

  if (!bride) notFound()

  const gown = brideGownLabel(bride)
  const dress = isPopulated<Dress>(bride.dress) ? bride.dress : null
  const date = formatDate(bride.weddingDate)
  const images = bride.images ?? []

  return (
    <>
      <section className="relative flex h-[55svh] items-end overflow-hidden bg-ink md:h-[70svh]">
        <ResponsiveHeroImage desktop={bride.coverImage} alt={`${bride.brideName} on her wedding day`} priority />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/5" />
        <div className="relative z-10 shell pb-10 md:pb-16">
          <p className="text-[0.6875rem] font-medium tracking-[0.22em] text-on-ink/80 uppercase">Real bride</p>
          <h1 className="mt-3 text-h1 text-on-ink">{bride.brideName}</h1>
          <p className="mt-3 space-x-3 text-on-ink/85">
            {bride.location ? <span>{bride.location}</span> : null}
            {date ? <time dateTime={bride.weddingDate ?? undefined}>{date}</time> : null}
          </p>
        </div>
      </section>

      <div className="shell pt-8">
        <Breadcrumbs
          crumbs={[
            { name: 'Real brides', href: '/real-brides' },
            { name: bride.brideName, href: `/real-brides/${slug}` },
          ]}
        />
      </div>

      <Section spacing="tight">
        <div className="shell">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr] md:gap-16">
            <div>{bride.story ? <RichText data={bride.story} /> : null}</div>

            <aside className="md:pt-1">
              <dl className="space-y-5 border-t border-line pt-5 text-sm">
                {gown ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
                      The gown
                    </dt>
                    <dd className="mt-1 text-ink-soft">
                      {dress ? (
                        <Link href={`/dress/${dress.slug}`} className="link-quiet">
                          {gown}
                        </Link>
                      ) : (
                        gown
                      )}
                    </dd>
                  </div>
                ) : null}
                {bride.location ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">Where</dt>
                    <dd className="mt-1 text-ink-soft">{bride.location}</dd>
                  </div>
                ) : null}
                {date ? (
                  <div>
                    <dt className="text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">When</dt>
                    <dd className="mt-1 text-ink-soft">{date}</dd>
                  </div>
                ) : null}
              </dl>

              <ButtonLink href="/your-appointment" className="mt-8 w-full">
                Book an appointment
              </ButtonLink>
            </aside>
          </div>
        </div>
      </Section>

      {images.length ? (
        <Section tone="shell">
          <div className="shell">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {images.map((item, index) => (
                <li key={item.id ?? index}>
                  <Reveal delay={Math.min(index, 6) * 60}>
                    <figure>
                      <MediaImage value={item.image} alt={item.alt} ratio="tall" sizes={IMAGE_SIZES.tile} />
                      {item.caption ? (
                        <figcaption className="pt-2 text-xs text-ink-muted">{item.caption}</figcaption>
                      ) : null}
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      ) : null}
    </>
  )
}

export default BridePage
