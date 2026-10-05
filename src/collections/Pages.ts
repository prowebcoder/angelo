import type { CollectionConfig } from 'payload'
import { heroFields, pageBlocks } from '../blocks'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../lib/revalidate'
import { canManageContent, publishedOrAuthenticated } from './access'
import { publishedAtField, seoField, slugField } from './fields'
import { previewConfig } from './preview'

/**
 * Editable pages, assembled from page-builder blocks.
 *
 * Routes resolve through `/[slug]`, so adding a page in the admin publishes a
 * new URL with no developer involvement. The `home` slug is reserved — the
 * homepage is its own global so it can never be deleted by accident.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    group: 'The website',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    description:
      'Every page on the site apart from the homepage. Open one, add sections under the Sections tab, then Save as draft to keep working or Publish to put it live. Preview shows you the page before anyone else sees it.',
    ...previewConfig('pages'),
  },
  defaultSort: 'title',
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: canManageContent,
    read: publishedOrAuthenticated,
    update: canManageContent,
    delete: canManageContent,
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Page title' },
    slugField('title'),
    {
      name: 'pageType',
      type: 'select',
      required: true,
      defaultValue: 'standard',
      label: 'Page type',
      admin: {
        position: 'sidebar',
        description: 'Used for breadcrumbs and structured data. Does not change the layout.',
      },
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'About', value: 'about' },
        { label: 'Alterations', value: 'alterations' },
        { label: 'Appointment', value: 'appointment' },
        { label: 'Contact', value: 'contact' },
        { label: 'Questions and answers', value: 'faq' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    publishedAtField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Opening section',
          description: 'The first thing a visitor sees. Leave the heading empty to start the page with a section instead.',
          fields: [{ name: 'hero', type: 'group', label: ' ', fields: heroFields }],
        },
        {
          label: 'Sections',
          description: 'Add, reorder, duplicate or hide the sections that make up this page.',
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
          fields: [seoField({ withCanonical: true, withNoIndex: true })],
        },
      ],
    },
  ],
}
