import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { heroFields, pageBlocks } from '../blocks'
import { canManageContent } from '../collections/access'

/**
 * The homepage.
 *
 * Its own global rather than a page, so it can never be deleted or
 * accidentally unpublished — but laid out in exactly the same tabs as a page,
 * with the same sections to choose from, so an editor only has one thing to
 * learn.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: {
    group: 'The website',
    description:
      'The front page. Add, reorder and hide sections the same way as on any other page — what you save here is live.',
  },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Opening section',
          description: 'The full-height section at the top, with the film and the first heading.',
          fields: [{ name: 'hero', type: 'group', label: ' ', fields: heroFields }],
        },
        {
          label: 'Sections',
          description:
            'Everything below the opening section, in order. Drag a section by its handle to move it, or untick “Hide this section” to bring one back.',
          fields: [
            {
              name: 'sections',
              type: 'blocks',
              label: ' ',
              labels: { singular: 'Section', plural: 'Sections' },
              blocks: pageBlocks,
              admin: { initCollapsed: true },
            },
          ],
        },
        {
          label: 'Search engines',
          description: 'How the homepage appears in Google and when its link is shared.',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Title in search results',
                  admin: { description: 'Leave empty to use the default from Site settings.' },
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Description in search results',
                  admin: { description: 'Around 155 characters. Leave empty to use the default from Site settings.' },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Sharing image',
                  admin: { description: 'Shown when the homepage link is pasted into WhatsApp or social media.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
