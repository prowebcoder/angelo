import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse'

/**
 * Controls follow the reference exactly: square, 48px minimum height,
 * uppercase Montserrat at 0.66rem with 0.11em tracking, and a hairline border
 * that inverts on hover. The `.btn*` classes live in `globals.css` so the
 * definition sits beside the other design tokens.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  inverse: 'btn btn-inverse',
  // A text link in the same letter-spaced style, for "see all" affordances.
  ghost:
    'inline-flex items-center gap-2 font-sans text-[0.66rem] font-semibold tracking-[0.11em] uppercase underline decoration-line-strong underline-offset-[0.4em] hover:decoration-current',
}

const classesFor = (variant: Variant, className?: string) =>
  [VARIANTS[variant], className].filter(Boolean).join(' ')

type ButtonLinkProps = {
  href: string
  variant?: Variant
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'className' | 'children'>

/** Internal links prefetch through `next/link`; external ones open safely. */
export const ButtonLink = ({ href, variant = 'primary', className, children, ...rest }: ButtonLinkProps) => {
  const classes = classesFor(variant, className)
  const isExternal = /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        rel="noopener noreferrer"
        target={href.startsWith('http') ? '_blank' : undefined}
      >
        {children}
      </a>
    )
  }

  // In-page anchors must not go through the router.
  if (href.startsWith('#')) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  )
}

type ButtonProps = {
  variant?: Variant
} & ComponentPropsWithoutRef<'button'>

export const Button = ({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) => (
  <button type={type} className={classesFor(variant, className)} {...rest} />
)
