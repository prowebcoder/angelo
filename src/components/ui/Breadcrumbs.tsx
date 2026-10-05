import Link from 'next/link'
import { JsonLd } from './JsonLd'
import { breadcrumbSchema } from '@/lib/seo'

export type Crumb = { name: string; href: string }

/**
 * Breadcrumb trail plus matching `BreadcrumbList` structured data, so the
 * visible path and the markup can never drift apart.
 *
 * The final crumb is the current page and is not a link.
 */
export const Breadcrumbs = ({ crumbs, className }: { crumbs: Crumb[]; className?: string }) => {
  if (crumbs.length < 2) return null
  const trail = [{ name: 'Home', href: '/' }, ...crumbs.filter((crumb) => crumb.href !== '/')]

  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1
            return (
              <li key={`${crumb.href}-${crumb.name}`} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="text-ink-soft">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.href} className="link-quiet hover:text-ink">
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true" className="text-line-strong">
                      /
                    </span>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(trail)} />
    </>
  )
}
