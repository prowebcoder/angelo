import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/Button'
import { MediaImage } from '@/components/ui/Media'
import { RichText } from '@/components/ui/RichText'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getPayloadClient } from '@/lib/payload'
import { getSiteSettings } from '@/lib/queries'
import { formatPrice } from '@/lib/format'
import { IMAGE_SIZES } from '@/lib/media'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

const getGiftCards = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'gift-cards', depth: 1 })
}

export const generateMetadata = async (): Promise<Metadata> => {
  const [giftCards, settings] = await Promise.all([getGiftCards(), getSiteSettings()])

  return buildMetadata({
    fallbackTitle: giftCards.hero?.heading ?? 'Gift cards',
    fallbackDescription: giftCards.hero?.description ?? 'A gift card towards a gown, veil or alterations.',
    fallbackImage: giftCards.hero?.image,
    path: '/gift-card',
    settings,
  })
}

/**
 * Gift cards.
 *
 * Amounts, wording and the checkout link all come from the Gift cards global.
 * With no checkout link set the page routes people to the boutique instead of
 * showing a button that cannot complete a purchase.
 */
const GiftCardPage = async () => {
  const [giftCards, settings] = await Promise.all([getGiftCards(), getSiteSettings()])
  const amounts = giftCards.amounts ?? []
  const checkoutURL = giftCards.checkoutURL?.trim()

  return (
    <>
      <Section spacing="tight">
        <div className="shell">
          <Breadcrumbs crumbs={[{ name: 'Gift cards', href: '/gift-card' }]} className="mb-6" />

          <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              {giftCards.hero?.eyebrow ? <p className="eyebrow">{giftCards.hero.eyebrow}</p> : null}
              <h1 className="mt-3 text-h1">{giftCards.hero?.heading ?? 'Gift cards'}</h1>
              {giftCards.hero?.description ? (
                <p className="mt-5 text-lg leading-relaxed text-ink-soft">{giftCards.hero.description}</p>
              ) : null}

              {amounts.length ? (
                <>
                  <p className="mt-10 text-[0.625rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
                    Available amounts
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {amounts.map((amount, index) => (
                      <li
                        key={amount.id ?? index}
                        className="border border-line-strong px-5 py-3 text-center"
                      >
                        <span className="block font-serif text-xl">
                          {formatPrice(amount.value, amount.currency ?? 'EUR')}
                        </span>
                        {amount.note ? (
                          <span className="mt-0.5 block text-[0.5625rem] tracking-[0.16em] text-ink-muted uppercase">
                            {amount.note}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {giftCards.allowCustomAmount !== false ? (
                    <p className="mt-4 text-sm text-ink-muted">
                      {giftCards.minimumCustomAmount && giftCards.maximumCustomAmount
                        ? `Any amount between ${formatPrice(giftCards.minimumCustomAmount)} and ${formatPrice(
                            giftCards.maximumCustomAmount,
                          )} is also possible.`
                        : 'A custom amount is also possible.'}
                    </p>
                  ) : null}
                </>
              ) : null}

              <div className="mt-10 flex flex-wrap gap-3">
                {checkoutURL ? (
                  <ButtonLink href={checkoutURL}>Buy a gift card</ButtonLink>
                ) : (
                  <>
                    <ButtonLink href="/contact">Enquire about a gift card</ButtonLink>
                    {settings.contact?.phone ? (
                      <ButtonLink href={`tel:${settings.contact.phone.replace(/\s+/g, '')}`} variant="secondary">
                        {`Call ${settings.contact.phone}`}
                      </ButtonLink>
                    ) : null}
                  </>
                )}
              </div>

              {!checkoutURL ? (
                <p className="mt-4 text-sm text-ink-muted">
                  Gift cards are arranged by the boutique team, who will confirm the amount and how it is sent.
                </p>
              ) : null}
            </div>

            {giftCards.hero?.image ? (
              <MediaImage
                value={giftCards.hero.image}
                alt={giftCards.hero.heading ?? 'Angelo Bridal gift card'}
                ratio="tall"
                sizes={IMAGE_SIZES.half}
                priority
              />
            ) : null}
          </div>
        </div>
      </Section>

      {giftCards.personalMessageCopy || giftCards.expiryInformation ? (
        <Section tone="shell">
          <div className="shell grid gap-10 md:grid-cols-2 md:gap-16">
            {giftCards.personalMessageCopy ? (
              <div>
                <SectionHeading level={2} title="A note with it" />
                <p className="mt-4 leading-relaxed text-ink-soft">{giftCards.personalMessageCopy}</p>
              </div>
            ) : null}
            {giftCards.expiryInformation ? (
              <div>
                <SectionHeading level={2} title="How long it lasts" />
                <p className="mt-4 leading-relaxed text-ink-soft">{giftCards.expiryInformation}</p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {giftCards.terms ? (
        <Section spacing="tight" className="pb-(--spacing-section)">
          <div className="shell-narrow">
            <SectionHeading level={2} title="Terms" className="mb-6" />
            <RichText data={giftCards.terms} />
          </div>
        </Section>
      ) : null}
    </>
  )
}

export default GiftCardPage
