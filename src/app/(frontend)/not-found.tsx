import { ButtonLink } from '@/components/ui/Button'
import { Section, SectionHeading } from '@/components/ui/Section'

/** 404. Offers the routes people are usually looking for. */
const NotFound = () => (
  <Section>
    <div className="shell-narrow text-center">
      <SectionHeading
        eyebrow="Page not found"
        title="This page has moved on"
        description="The link may be old, or the page may have been renamed. Here is where most people are heading."
        align="center"
      />
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/dresses">Wedding dresses</ButtonLink>
        <ButtonLink href="/designers" variant="secondary">
          Designers
        </ButtonLink>
        <ButtonLink href="/your-appointment" variant="secondary">
          Book an appointment
        </ButtonLink>
        <ButtonLink href="/" variant="ghost">
          Back to the homepage
        </ButtonLink>
      </div>
    </div>
  </Section>
)

export default NotFound
