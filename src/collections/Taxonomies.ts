import type { CollectionConfig } from 'payload'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../lib/revalidate'
import { canManageContent } from './access'
import { slugField } from './fields'

/**
 * The managed vocabulary behind every filter, menu column and category.
 *
 * Keeping silhouettes, fabrics, features and the rest here — rather than in
 * hard-coded arrays — means staff can add "Corset bodice" and have it appear
 * in the catalogue filters and the gown form straight away.
 */
export const Taxonomies: CollectionConfig = {
  slug: 'taxonomies',
  labels: { singular: 'Filter term', plural: 'Filter terms' },
  admin: {
    useAsTitle: 'name',
    group: 'Gowns & designers',
    defaultColumns: ['name', 'kind', 'slug', 'published'],
    listSearchableFields: ['name', 'slug'],
    description:
      'The words used by the catalogue filters, the menus and the journal categories. Choose the type, then the name.',
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: canManageContent,
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    update: canManageContent,
    delete: canManageContent,
  },
  defaultSort: 'name',
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: 'Type of term',
      admin: { description: 'Decides which filter or menu this term belongs to.' },
      options: [
        { label: 'Silhouette', value: 'silhouette' },
        { label: 'Style / Mood', value: 'style' },
        { label: 'Feature', value: 'feature' },
        { label: 'Size / Fit', value: 'size' },
        { label: 'Fabric', value: 'fabric' },
        { label: 'Neckline', value: 'neckline' },
        { label: 'Sleeve', value: 'sleeve' },
        { label: 'Train', value: 'train' },
        { label: 'Colour', value: 'colour' },
        { label: 'Journal category', value: 'journal-category' },
        { label: 'Journal tag', value: 'journal-tag' },
        { label: 'Event type', value: 'event-type' },
        { label: 'Accessory category', value: 'accessory-category' },
        { label: 'Question category', value: 'faq-category' },
      ],
    },
    { name: 'name', type: 'text', required: true, label: 'Name shown on the site' },
    // Not globally unique: the same word can be two different kinds of term
    // ("Lace" is a fabric and a feature). The composite index below enforces
    // uniqueness where it actually matters — one slug per kind.
    slugField('name', { unique: false }),
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Order',
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show on the site',
      admin: { position: 'sidebar' },
    },
  ],
  indexes: [{ fields: ['kind', 'slug'], unique: true }],
}
