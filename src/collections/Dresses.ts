import type { CollectionConfig } from 'payload'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../lib/revalidate'
import { canManageContent, publishedOrAuthenticated } from './access'
import { seoField, slugField } from './fields'
import { previewConfig } from './preview'

/** Taxonomy pickers are filtered by kind so editors see only relevant terms. */
const taxonomyPicker = (
  name: string,
  label: string,
  kind: string,
  description: string,
  hasMany = false,
) => ({
  name,
  type: 'relationship' as const,
  relationTo: 'taxonomies' as const,
  hasMany,
  label,
  filterOptions: () => ({ kind: { equals: kind } }),
  admin: { description },
})

/**
 * The gown catalogue — the heart of the site.
 *
 * Taxonomy is held in relationships rather than free text so the filters on
 * `/dresses`, the mega menu and Ask Angelo all read from the same managed
 * vocabulary. Price and availability stay optional: many gowns are confirmed
 * in person, and an empty field is shown as "confirm with the boutique"
 * rather than being invented.
 */
export const Dresses: CollectionConfig = {
  slug: 'dresses',
  labels: { singular: 'Gown', plural: 'Gowns' },
  admin: {
    useAsTitle: 'name',
    group: 'Gowns & designers',
    defaultColumns: ['name', 'designer', 'styleCode', 'mostLoved', 'newArrival', '_status'],
    listSearchableFields: ['name', 'styleCode', 'collection'],
    description:
      'Every gown in the boutique. Add one here and it appears in the catalogue automatically. Use "Group by" to see them designer by designer, and Duplicate to add a gown much like one you already have.',
    // There are more gowns than fit a 25-row page, and they are usually
    // worked through a designer at a time.
    groupBy: true,
    pagination: { defaultLimit: 50, limits: [25, 50, 100] },
    ...previewConfig('dresses'),
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: canManageContent,
    read: publishedOrAuthenticated,
    update: canManageContent,
    delete: canManageContent,
  },
  // Alphabetical, so a gown can be found by name without sorting first.
  defaultSort: 'name',
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Gown name' },
    slugField('name'),
    {
      name: 'designer',
      type: 'relationship',
      relationTo: 'designers',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'The gown',
          fields: [
            { name: 'collection', type: 'text', index: true, label: 'Collection', admin: { description: 'The designer collection this gown belongs to, if any.' } },
            { name: 'styleCode', type: 'text', index: true, label: 'Style code' },
            {
              name: 'description',
              type: 'textarea',
              label: 'Short description',
              admin: { description: 'One or two sentences. Used on cards and in search results.' },
            },
            { name: 'designStory', type: 'richText', label: 'The longer story' },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  min: 0,
                  admin: {
                    width: '50%',
                    description: 'Leave empty when there is no confirmed price. Nothing is shown rather than a guess.',
                  },
                },
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'EUR',
                  options: [{ label: 'Euro (€)', value: 'EUR' }],
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'sampleSize', type: 'text', label: 'Sample size', admin: { width: '50%' } },
                {
                  name: 'availability',
                  type: 'select',
                  defaultValue: 'confirm-with-boutique',
                  admin: { width: '50%' },
                  options: [
                    { label: 'Confirm with boutique', value: 'confirm-with-boutique' },
                    { label: 'Sample available to try', value: 'sample-available' },
                    { label: 'Sample not available', value: 'sample-unavailable' },
                    { label: 'Archived', value: 'archived' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Photographs',
          description: 'The first image is used on cards and when the gown is shared.',
          fields: [
            {
              name: 'primaryImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Main photograph',
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'More photographs',
              labels: { singular: 'Photograph', plural: 'Photographs' },
              admin: { description: 'Drag to reorder. These appear in the gallery on the gown page.' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                {
                  name: 'alt',
                  type: 'text',
                  required: true,
                  label: 'Describe the photograph',
                  admin: { description: 'For visitors using a screen reader, e.g. "Back view showing the buttoned train".' },
                },
                { name: 'caption', type: 'text' },
              ],
            },
            {
              name: 'mobileImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Phone photograph',
              admin: { description: 'Optional upright crop for phones.' },
            },
            { name: 'videoURL', type: 'text', label: 'Video URL', admin: { description: 'Optional MP4 file URL.' } },
          ],
        },
        {
          label: 'Filters',
          description: 'These control where the gown appears in the catalogue filters and menus.',
          fields: [
            taxonomyPicker('silhouette', 'Silhouette', 'silhouette', 'The overall shape.'),
            taxonomyPicker('style', 'Style', 'style', 'The mood, e.g. romantic or minimal.', true),
            taxonomyPicker('features', 'Features', 'feature', 'Details such as lace, sleeves or an open back.', true),
            taxonomyPicker('fabrics', 'Fabrics', 'fabric', 'What the gown is made from.', true),
            taxonomyPicker('neckline', 'Neckline', 'neckline', 'The neckline shape.'),
            taxonomyPicker('sleeve', 'Sleeves', 'sleeve', 'The sleeve type.'),
            taxonomyPicker('train', 'Train', 'train', 'The train length.'),
            taxonomyPicker('sizes', 'Size and fit', 'size', 'Add "plus size" here when a sample is available in extended sizes.', true),
            taxonomyPicker('colour', 'Colour', 'colour', 'The shade of the gown.'),
            {
              name: 'accessories',
              type: 'relationship',
              relationTo: 'accessories',
              hasMany: true,
              label: 'Suggested accessories',
              admin: { description: 'Shown on the gown page as pieces that work well with it.' },
            },
          ],
        },
        {
          label: 'Highlights',
          description: 'Ticking these adds the gown to the matching homepage sections and menu links.',
          fields: [
            { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Featured' },
            { name: 'mostLoved', type: 'checkbox', defaultValue: false, label: 'Most loved' },
            { name: 'newArrival', type: 'checkbox', defaultValue: false, label: 'New arrival' },
            { name: 'sampleSale', type: 'checkbox', defaultValue: false, label: 'Sample sale / off the rack' },
          ],
        },
        {
          label: 'Search engines',
          fields: [seoField({ withCanonical: true })],
        },
      ],
    },
  ],
}
