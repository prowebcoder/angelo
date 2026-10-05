import type { Designer, Navigation, SiteSetting, Taxonomy } from '@/payload-types'
import { INDEXABLE_CATEGORIES } from '@/lib/filters'
import { resolveMedia } from '@/lib/media'

/**
 * Flattened navigation model handed to the client header.
 *
 * Only what the UI needs crosses the server/client boundary — keeping Payload
 * documents out of the client bundle.
 */
export type NavLink = { label: string; href: string }

export type NavColumn = { heading?: string; links: NavLink[] }

export type NavItem = {
  label: string
  href: string
  /** Rendered as a mega-menu panel when present. */
  panel?: {
    columns: NavColumn[]
    /** Optional visual lead-in for the designers panel. */
    feature?: { label: string; href: string; image?: { src: string; alt: string } }
  }
}

export type HeaderData = {
  /** Items left of the wordmark, in order. */
  leftItems: NavItem[]
  /** Items right of the wordmark, before the utilities. */
  rightItems: NavItem[]
  appointmentLabel: string
  bridalPortalURL?: string
  logo?: { src: string; alt: string; width: number; height: number }
  /** Light artwork for use over the hero; absent means invert the dark one. */
  logoLight?: { src: string; alt: string; width: number; height: number }
  announcement?: { message: string; url?: string; style: 'brand' | 'light' | 'dark' }
}

/**
 * Two navigation items are enriched with live CMS data instead of hand-kept
 * link lists: the item pointing at `/dresses` gains catalogue categories, and
 * the one pointing at `/designers` lists the designer collection.
 *
 * Editors keep full control of labels, order and any other item; these two
 * simply stay in step with the catalogue automatically.
 */
const DRESSES_HREF = '/dresses'
const DESIGNERS_HREF = '/designers'

/** Catalogue categories, grouped the way the boutique talks about them. */
const dressPanelColumns = (silhouettes: Taxonomy[], fabrics: Taxonomy[], features: Taxonomy[]): NavColumn[] => {
  const curated = (keys: string[]): NavLink[] =>
    keys
      .filter((key) => INDEXABLE_CATEGORIES[key])
      .map((key) => ({ label: INDEXABLE_CATEGORIES[key].title.replace(/ wedding dresses$/i, ''), href: `/dresses/${key}` }))

  return [
    {
      heading: 'The collection',
      links: [
        { label: 'All wedding dresses', href: '/dresses' },
        ...curated(['new-arrivals', 'most-loved', 'plus-size', 'sample-sale']),
      ],
    },
    {
      heading: 'Silhouette',
      links: silhouettes.slice(0, 8).map((term) => ({
        label: term.name,
        href: `/dresses?silhouette=${term.slug}`,
      })),
    },
    {
      heading: 'Fabric',
      links: fabrics.slice(0, 8).map((term) => ({ label: term.name, href: `/dresses?fabric=${term.slug}` })),
    },
    {
      heading: 'Detail',
      links: features.slice(0, 8).map((term) => ({ label: term.name, href: `/dresses?feature=${term.slug}` })),
    },
  ].filter((column) => column.links.length > 0)
}

/** Designers split into balanced columns so the panel stays readable. */
const designerPanelColumns = (designers: Designer[]): NavColumn[] => {
  const links: NavLink[] = designers.map((designer) => ({
    label: designer.name,
    href: `/designers/${designer.slug}`,
  }))
  if (!links.length) return []

  const perColumn = Math.ceil(links.length / Math.min(3, Math.ceil(links.length / 4) || 1))
  const columns: NavColumn[] = []
  for (let index = 0; index < links.length; index += perColumn) {
    columns.push({ links: links.slice(index, index + perColumn) })
  }
  columns.push({ links: [{ label: 'All designers', href: '/designers' }] })
  return columns
}

export const buildHeaderData = ({
  navigation,
  settings,
  designers,
  taxonomies,
}: {
  navigation: Navigation
  settings: SiteSetting
  designers: Designer[]
  taxonomies: Record<string, Taxonomy[]>
}): HeaderData => {
  const featuredDesigner = designers.find((designer) => designer.featured) ?? designers[0]
  const featuredImage = resolveMedia(featuredDesigner?.heroImage ?? featuredDesigner?.logo)

  const build = (item: NonNullable<Navigation['items']>[number]): NavItem => {
    const base: NavItem = { label: item.label, href: item.url }

    if (item.url === DRESSES_HREF) {
      const columns = dressPanelColumns(
        taxonomies.silhouette ?? [],
        taxonomies.fabric ?? [],
        taxonomies.feature ?? [],
      )
      return columns.length ? { ...base, panel: { columns } } : base
    }

    if (item.url === DESIGNERS_HREF) {
      const columns = designerPanelColumns(designers)
      return columns.length
        ? {
            ...base,
            panel: {
              columns,
              feature: featuredDesigner
                ? {
                    label: featuredDesigner.name,
                    href: `/designers/${featuredDesigner.slug}`,
                    image: featuredImage?.url
                      ? { src: featuredImage.url, alt: featuredImage.alt ?? featuredDesigner.name }
                      : undefined,
                  }
                : undefined,
            },
          }
        : base
    }

    // Editor-defined children become a single-column panel.
    const children = (item.children ?? []).map((child) => ({ label: child.label, href: child.url }))
    return children.length ? { ...base, panel: { columns: [{ links: children }] } } : base
  }

  /*
   * The header is a three-column grid with the wordmark centred, so the menu
   * is split either side of it rather than being one list. Each item carries
   * its own side, set in the admin.
   */
  const all = navigation.items ?? []
  const leftItems = all.filter((item) => (item.side ?? 'left') === 'left').map(build)
  const rightItems = all.filter((item) => item.side === 'right').map(build)

  const logoMedia = resolveMedia(settings.branding?.logo)
  const logoLightMedia = resolveMedia(settings.branding?.logoLight)
  const announcement = settings.announcement

  return {
    leftItems,
    rightItems,
    appointmentLabel: navigation.appointmentLabel ?? 'Book an appointment',
    bridalPortalURL: navigation.bridalPortalURL ?? undefined,
    logo:
      logoMedia?.url && logoMedia.width && logoMedia.height
        ? {
            src: logoMedia.url,
            alt: logoMedia.alt || 'Angelo Bridal',
            width: logoMedia.width,
            height: logoMedia.height,
          }
        : undefined,
    logoLight:
      logoLightMedia?.url && logoLightMedia.width && logoLightMedia.height
        ? {
            src: logoLightMedia.url,
            // Decorative: the dark logo beside it carries the accessible name.
            alt: '',
            width: logoLightMedia.width,
            height: logoLightMedia.height,
          }
        : undefined,
    announcement:
      announcement?.enabled && announcement.message
        ? {
            message: announcement.message,
            url: announcement.url ?? undefined,
            style: announcement.backgroundStyle ?? 'brand',
          }
        : undefined,
  }
}
