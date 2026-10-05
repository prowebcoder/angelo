import type { CollectionConfig } from 'payload'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../lib/revalidate'
import { canManageContent, publishedOrAuthenticated } from './access'
import { seoField, slugField } from './fields'
import { previewConfig } from './preview'

/**
 * Designer collections.
 *
 * Publishing a designer creates `/designers/<url>` and adds them to the
 * Designers mega menu and the designer grids — no code change needed.
 */
export const Designers: CollectionConfig = {
  slug: 'designers',
  labels: { singular: 'Designer', plural: 'Designers' },
  admin: {
    useAsTitle: 'name',
    group: 'Gowns & designers',
    defaultColumns: ['name', 'featured', 'displayOrder', '_status'],
    listSearchableFields: ['name'],
    description:
      'The houses the boutique carries. The Order number in the sidebar decides where each one appears on the site — lower numbers first.',
    ...previewConfig('designers'),
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: canManageContent,
    read: publishedOrAuthenticated,
    update: canManageContent,
    delete: canManageContent,
  },
  versions: { drafts: true },
  defaultSort: 'displayOrder',
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Designer name' },
    slugField('name'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Feature this designer',
      admin: { position: 'sidebar', description: 'Featured designers lead the menu panel.' },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      label: 'Order',
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'The house',
          fields: [
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Header photograph',
              admin: { description: 'Used at the top of the designer page and on their card.' },
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Short description',
              admin: { description: 'One or two sentences, shown on cards.' },
            },
            { name: 'longDescription', type: 'richText', label: 'Full introduction' },
            { name: 'website', type: 'text', label: "Designer's own website" },
          ],
        },
        { label: 'Search engines', fields: [seoField({ withCanonical: true })] },
      ],
    },
  ],
}
