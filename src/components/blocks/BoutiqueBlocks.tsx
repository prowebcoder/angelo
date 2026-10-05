import { Section, SectionHeading } from '@/components/ui/Section'
import { OpeningHoursList } from '@/components/layout/OpeningHours'
import { getSiteSettings } from '@/lib/queries'
import { type BlockOf, toneOf } from './types'

/** Opening hours, read from Site settings so they live in one place only. */
export const OpeningHoursBlock = async ({ block }: { block: BlockOf<'opening-hours'> }) => {
  const settings = await getSiteSettings()
  const hours = settings.openingHours ?? []
  if (!hours.length) return null

  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell-narrow">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-8"
        />
        <OpeningHoursList hours={hours} tone={tone === 'ink' ? 'dark' : 'light'} />
      </div>
    </Section>
  )
}

/** Address, phone and email, with hours optionally alongside. */
export const ContactInformationBlock = async ({ block }: { block: BlockOf<'contact-information'> }) => {
  const settings = await getSiteSettings()
  const contact = settings.contact
  const hours = settings.openingHours ?? []
  const showHours = block.showOpeningHours !== false && hours.length > 0

  if (!contact?.address && !contact?.phone && !contact?.email && !showHours) return null

  const tone = toneOf(block.tone)
  const bodyColour = tone === 'ink' ? 'text-on-ink/90' : 'text-ink-soft'
  const labelColour = tone === 'ink' ? 'text-on-ink-muted' : 'text-ink-muted'

  return (
    <Section tone={tone}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-10"
        />

        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            {contact?.address ? (
              <div>
                <p className={`mb-2 text-[0.625rem] font-medium tracking-[0.22em] uppercase ${labelColour}`}>
                  The boutique
                </p>
                <address className={`whitespace-pre-line text-base not-italic ${bodyColour}`}>
                  {contact.address}
                </address>
                {contact.googleMapsURL ? (
                  <a
                    href={contact.googleMapsURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-quiet mt-2 inline-block text-[0.625rem] tracking-[0.18em] uppercase"
                  >
                    Get directions
                  </a>
                ) : null}
              </div>
            ) : null}

            {contact?.phone || contact?.email || contact?.whatsApp ? (
              <div>
                <p className={`mb-2 text-[0.625rem] font-medium tracking-[0.22em] uppercase ${labelColour}`}>
                  Get in touch
                </p>
                <ul className={`space-y-1.5 text-base ${bodyColour}`}>
                  {contact.phone ? (
                    <li>
                      <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="link-quiet">
                        {contact.phone}
                      </a>
                    </li>
                  ) : null}
                  {contact.email ? (
                    <li>
                      <a href={`mailto:${contact.email}`} className="link-quiet">
                        {contact.email}
                      </a>
                    </li>
                  ) : null}
                  {contact.whatsApp ? (
                    <li>
                      <a
                        href={`https://wa.me/${contact.whatsApp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-quiet"
                      >
                        WhatsApp
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>

          {showHours ? (
            <div>
              <p className={`mb-3 text-[0.625rem] font-medium tracking-[0.22em] uppercase ${labelColour}`}>
                Opening hours
              </p>
              <OpeningHoursList hours={hours} tone={tone === 'ink' ? 'dark' : 'light'} />
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}

/**
 * Map embed.
 *
 * Loaded lazily and only when a URL exists, so no third-party frame is
 * requested on pages that do not use one.
 */
export const MapBlock = async ({ block }: { block: BlockOf<'map'> }) => {
  const settings = await getSiteSettings()
  const src = block.embedURL?.trim() || settings.contact?.mapEmbedURL?.trim()
  if (!src) return null

  return (
    <Section spacing="flush">
      {block.heading ? (
        <div className="shell pb-6">
          <h2 className="text-h2-sm">{block.heading}</h2>
        </div>
      ) : null}
      <iframe
        src={src}
        title={block.heading ?? 'Map of Angelo Bridal'}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full border-0"
        style={{ height: `${block.height ?? 420}px` }}
      />
    </Section>
  )
}
