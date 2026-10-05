import Image from 'next/image'
import Link from 'next/link'
import { getFooterContent, getSiteSettings } from '@/lib/queries'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import { ButtonLink } from '@/components/ui/Button'
import { imageFrom } from '@/lib/media'
import { OpeningHoursList } from './OpeningHours'

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
}

/** The reference's order, which is not alphabetical. */
const SOCIAL_ORDER = ['instagram', 'tiktok', 'facebook', 'youtube', 'pinterest']

/** Column headings: small, letter-spaced, and brighter than the links beneath. */
const HEADING = 'mb-5 text-[0.625rem] font-semibold tracking-[0.16em] text-on-ink uppercase'

/** Links and facts share one rhythm — 13px on a 1.75 line, no extra gaps. */
const LINE = 'text-[0.8125rem] leading-[1.75] text-[#d6d2cb]'

/**
 * Global footer.
 *
 * One dark block, as the reference has it. The appointment band sits inside
 * that block rather than above it: the light logo at the left, the invitation
 * set large across the middle, and the booking button at the right, the three
 * sharing a baseline. A hairline then separates that from four columns of
 * facts — Visit, Explore, Opening hours, Follow — and a bottom bar carries the
 * copyright and the legal links.
 *
 * The address, phone, email, hours and social links are not duplicated in the
 * Footer global; they are read from Site settings, so the boutique changes a
 * phone number in one place and it changes everywhere it appears.
 */
export const SiteFooter = async () => {
  const [footer, settings] = await Promise.all([getFooterContent(), getSiteSettings()])

  const contact = settings.contact
  const social = settings.social ?? {}
  const socials = SOCIAL_ORDER.map((key) => ({
    key,
    url: (social as Record<string, string | null | undefined>)[key],
  })).filter((entry): entry is { key: string; url: string } => Boolean(entry.url))

  const preFooter = footer.preFooter
  const preFooterButton =
    preFooter?.button?.label && preFooter.button.url
      ? { label: preFooter.button.label, url: preFooter.button.url }
      : null

  // The light artwork reads on the dark band. If only the dark logo has been
  // uploaded it is inverted, so the band never looks broken.
  const logoLight = imageFrom(settings.branding?.logoLight, 'Angelo Bridal')
  const logoDark = imageFrom(settings.branding?.logo, 'Angelo Bridal')
  const logo = logoLight ?? logoDark

  return (
    <footer className="bg-ink text-on-ink">
      <div className="shell">
        {/* Appointment band */}
        {preFooter?.heading || logo ? (
          <div className="grid items-end gap-x-[clamp(2rem,4vw,5rem)] gap-y-10 pt-[clamp(4rem,8vw,9rem)] pb-[clamp(3.5rem,6vw,7.5rem)] lg:grid-cols-[auto_1fr_auto]">
            {logo ? (
              <Link href="/" aria-label="Angelo Bridal" className="block w-fit">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  sizes="240px"
                  className={`h-auto w-[clamp(9rem,13vw,13.75rem)] ${logoLight ? '' : 'brightness-0 invert'}`}
                />
              </Link>
            ) : (
              <span />
            )}

            {preFooter?.heading ? <h2 className="text-h2">{preFooter.heading}</h2> : <span />}

            {preFooterButton ? (
              <ButtonLink href={preFooterButton.url} variant="inverse" className="w-fit">
                {preFooterButton.label}
              </ButtonLink>
            ) : (
              <span />
            )}
          </div>
        ) : null}

        {/*
          Four columns on the reference's widths: Visit and Opening hours are
          the wide ones because their lines are long, Follow the narrowest.
        */}
        <div className="grid gap-x-[clamp(2rem,3vw,4rem)] gap-y-12 border-t border-white/15 pt-[clamp(3rem,5.5vw,6.5rem)] pb-[clamp(3rem,5vw,5.5rem)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.4fr_0.65fr]">
          {/* Visit */}
          <div>
            <p className={HEADING}>{footer.visitHeading ?? 'Visit'}</p>
            <address className="not-italic">
              {contact?.address ? (
                contact.googleMapsURL ? (
                  <a
                    href={contact.googleMapsURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-quiet block text-[0.8125rem] leading-[1.75] whitespace-pre-line text-on-ink"
                  >
                    {contact.address}
                  </a>
                ) : (
                  <span className="block text-[0.8125rem] leading-[1.75] whitespace-pre-line text-on-ink">
                    {contact.address}
                  </span>
                )
              ) : null}
              {contact?.phone ? (
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className={`link-quiet block ${LINE}`}>
                  {contact.phone}
                </a>
              ) : null}
              {/* The reference sets the email apart from the street and phone. */}
              {contact?.email ? (
                <a href={`mailto:${contact.email}`} className={`link-quiet mt-7 block ${LINE}`}>
                  {contact.email}
                </a>
              ) : null}
            </address>

            {footer.description ? (
              <p className="mt-6 max-w-sm text-[0.8125rem] leading-relaxed text-on-ink-muted">
                {footer.description}
              </p>
            ) : null}

            {footer.showNewsletter ? (
              <div className="mt-9 max-w-sm">
                <p className={HEADING}>The Angelo letter</p>
                <NewsletterForm source="footer" consentCopy={null} tone="dark" />
              </div>
            ) : null}
          </div>

          {/* Explore */}
          {(footer.columns ?? []).map((column) => (
            <nav key={column.id ?? column.heading} aria-label={column.heading}>
              <p className={HEADING}>{column.heading}</p>
              <ul>
                {(column.links ?? []).map((link) => (
                  <li key={link.id ?? link.url}>
                    <Link href={link.url} className={`link-quiet ${LINE}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Opening hours */}
          {settings.openingHours?.length ? (
            <div>
              <p className={HEADING}>{footer.openingHoursHeading ?? 'Opening hours'}</p>
              <OpeningHoursList hours={settings.openingHours} tone="dark" layout="inline" />
            </div>
          ) : null}

          {/* Follow */}
          {socials.length ? (
            <nav aria-label={footer.socialHeading ?? 'Follow'}>
              <p className={HEADING}>{footer.socialHeading ?? 'Follow'}</p>
              <ul>
                {socials.map((entry) => (
                  <li key={entry.key}>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`link-quiet ${LINE}`}
                    >
                      {SOCIAL_LABELS[entry.key] ?? entry.key}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-7 pb-10 text-[0.6rem] tracking-[0.12em] uppercase">
          <p className="text-on-ink-muted">
            {footer.copyright ?? `© Angelo Bridal ${new Date().getFullYear()}`}
          </p>
          {(footer.legalLinks ?? []).map((link) => (
            <Link key={link.id ?? link.url} href={link.url} className="link-quiet text-on-ink-muted">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
