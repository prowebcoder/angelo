import type { Faq } from '@/payload-types'
import { Accordion } from '@/components/ui/Accordion'
import { RichText } from '@/components/ui/RichText'
import { Reveal } from '@/components/ui/Reveal'
import { Section, SectionHeading } from '@/components/ui/Section'
import { AlterationsForm } from '@/components/forms/AlterationsForm'
import { AppointmentFormLoader } from '@/components/forms/AppointmentFormLoader'
import { ContactForm } from '@/components/forms/ContactForm'
import { NewsletterForm } from '@/components/forms/NewsletterForm'
import { getFaqs, getFaqsByIds, getFormSettings } from '@/lib/queries'
import { isPopulated } from '@/lib/media'
import { type BlockOf, toneOf } from './types'

export const ServicesGridBlock = ({ block }: { block: BlockOf<'services-grid'> }) => {
  const services = block.services ?? []
  if (!services.length) return null

  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-12"
        />
        <ul className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <li key={service.id ?? index}>
              <Reveal delay={Math.min(index, 5) * 70}>
                <div className="border-t border-line pt-5">
                  <h3 className={`font-serif text-xl ${tone === 'ink' ? 'text-on-ink' : 'text-ink'}`}>
                    {service.title}
                  </h3>
                  {service.description ? (
                    <p className={`mt-2 text-sm leading-relaxed ${tone === 'ink' ? 'text-on-ink/80' : 'text-ink-soft'}`}>
                      {service.description}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

/** Numbered journey, used by the appointment and alterations pages. */
export const ProcessTimelineBlock = ({ block }: { block: BlockOf<'process-timeline'> }) => {
  const steps = block.steps ?? []
  if (!steps.length) return null

  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-12"
        />
        <ol className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.id ?? index}>
              <Reveal delay={Math.min(index, 5) * 70}>
                <p
                  className={`font-serif text-4xl ${tone === 'ink' ? 'text-on-ink-muted' : 'text-line-strong'}`}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className={`mt-3 font-serif text-xl ${tone === 'ink' ? 'text-on-ink' : 'text-ink'}`}>
                  {step.title}
                </h3>
                {step.description ? (
                  <p className={`mt-2 text-sm leading-relaxed ${tone === 'ink' ? 'text-on-ink/80' : 'text-ink-soft'}`}>
                    {step.description}
                  </p>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

export const FaqBlock = async ({ block }: { block: BlockOf<'faq-list'> }) => {
  const chosen = (block.faqs ?? []).filter((item): item is Faq => isPopulated<Faq>(item))
  const ids = (block.faqs ?? []).map((item) => (isPopulated<Faq>(item) ? item.id : item))

  // Chosen questions keep the editor's order; otherwise show them all.
  const faqs = chosen.length === ids.length && chosen.length ? chosen : ids.length ? await getFaqsByIds(ids) : await getFaqs()
  if (!faqs.length) return null

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell-narrow">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-10"
        />
        <Accordion
          items={faqs.map((faq) => ({
            id: String(faq.id),
            question: faq.question,
            answer: <RichText data={faq.answer} />,
          }))}
        />
      </div>
    </Section>
  )
}

/** Renders whichever form the editor chose for this section. */
export const FormBlock = async ({ block }: { block: BlockOf<'form'> }) => {
  const settings = await getFormSettings()

  const form =
    block.form === 'appointment' ? (
      <AppointmentFormLoader
        appointmentTypes={(settings.appointmentTypes ?? [])
          .filter((type) => type.enabled !== false)
          .map((type) => ({ label: type.label, description: type.description }))}
        extraFields={(settings.appointmentFields ?? []).map((field) => ({
          label: field.label,
          name: field.name,
          type: field.type,
          required: field.required,
          options: field.options,
        }))}
        consentCopy={settings.consentCopy}
      />
    ) : block.form === 'alterations' ? (
      <AlterationsForm />
    ) : (
      <ContactForm />
    )

  return (
    <Section tone={toneOf(block.tone)}>
      <div className="shell-narrow">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          className="mb-10"
        />
        {form}
      </div>
    </Section>
  )
}

export const NewsletterBlock = ({ block }: { block: BlockOf<'newsletter'> }) => {
  const tone = toneOf(block.tone)

  return (
    <Section tone={tone}>
      <div className="shell-narrow text-center">
        <SectionHeading
          eyebrow={block.eyebrow}
          title={block.heading}
          description={block.description}
          align="center"
          className="mb-8"
        />
        <div className="mx-auto max-w-md text-left">
          <NewsletterForm
            source="page-section"
            consentCopy={block.consentCopy}
            tone={tone === 'ink' ? 'dark' : 'light'}
          />
        </div>
      </div>
    </Section>
  )
}
