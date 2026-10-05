import { getDesigners, getDressCount, getNavigation, getSiteSettings, getTaxonomyGroups } from '@/lib/queries'
import { AnnouncementBar } from './AnnouncementBar'
import { HeaderNav } from './HeaderNav'
import { buildHeaderData } from './nav-data'

/**
 * Server half of the header: reads the CMS once per render and passes a small
 * serialisable model to the interactive nav, so Payload documents never reach
 * the client bundle.
 */
export const SiteHeader = async () => {
  const [navigation, settings, designers, taxonomies, dressCount] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
    getDesigners(),
    getTaxonomyGroups(),
    getDressCount(),
  ])

  const data = buildHeaderData({ navigation, settings, designers, taxonomies })

  return (
    /*
     * Zero-height wrapper: both children are fixed/absolute so the header
     * floats over the hero rather than pushing the page down, which is how
     * the reference lays it out. Pages without a hero get their own top
     * padding from `main` in the layout.
     */
    <header className="relative z-[100]">
      <AnnouncementBar announcement={data.announcement} />
      <HeaderNav data={data} dressCount={dressCount} />
    </header>
  )
}
