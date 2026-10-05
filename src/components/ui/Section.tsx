import type { ReactNode } from 'react'

type Tone = 'paper' | 'shell' | 'ink' | 'none'

/**
 * Backgrounds, matching the reference palette: paper for most sections,
 * ivory for alternating bands, ink for the dark panels.
 *
 * `shell` is the stored value for the ivory ground. The name predates the
 * palette being taken from the reference and is kept because it is what the
 * CMS has saved against existing sections; the token it maps to is the one
 * that matters.
 */
const TONES: Record<Tone, string> = {
  paper: 'bg-paper text-ink',
  shell: 'bg-ivory text-ink',
  ink: 'bg-ink text-on-ink',
  none: '',
}

type SectionProps = {
  children: ReactNode
  tone?: Tone
  /** Vertical rhythm. `flush` is for edge-to-edge media. */
  spacing?: 'default' | 'tight' | 'flush'
  className?: string
  id?: string
  as?: 'section' | 'div' | 'article' | 'aside'
  'aria-labelledby'?: string
}

const SPACING = {
  default: 'py-(--spacing-section)',
  tight: 'py-16 md:py-24',
  flush: '',
} as const

/** One vertical-rhythm primitive, so no section invents its own spacing. */
export const Section = ({
  children,
  tone = 'paper',
  spacing = 'default',
  className,
  id,
  as: Tag = 'section',
  ...rest
}: SectionProps) => (
  <Tag id={id} className={[TONES[tone], SPACING[spacing], className].filter(Boolean).join(' ')} {...rest}>
    {children}
  </Tag>
)

type HeadingProps = {
  eyebrow?: string | null
  title?: string | null
  description?: string | null
  level?: 2 | 3
  align?: 'left' | 'center'
  /**
   * `display` is the reference's full-size section heading; `compact` is the
   * smaller one used where a heading sits beside other content.
   */
  size?: 'display' | 'compact'
  id?: string
  className?: string
  children?: ReactNode
}

/**
 * Section heading: eyebrow, serif display title, lede.
 *
 * The title sizes come straight from the reference site — very large Georgia
 * with tight negative tracking — which is the dominant note of the design.
 * Any part can be omitted so CMS sections stay tidy when only some fields
 * are filled in.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  description,
  level = 2,
  align = 'left',
  size = 'display',
  id,
  className,
  children,
}: HeadingProps) => {
  if (!eyebrow && !title && !description && !children) return null
  const Tag = level === 2 ? 'h2' : 'h3'

  return (
    <div
      className={[
        'flex flex-col',
        align === 'center' ? 'items-center text-center mx-auto max-w-3xl' : 'max-w-3xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {title ? (
        <Tag id={id} className={`mt-3 ${size === 'display' ? 'text-h2' : 'text-h2-sm'}`}>
          {title}
        </Tag>
      ) : null}
      {description ? (
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed opacity-80">{description}</p>
      ) : null}
      {children}
    </div>
  )
}
