import path from 'node:path'
import type { CollectionConfig } from 'payload'
import { revalidateCollection } from '../lib/revalidate'
import { canManageContent } from './access'

/**
 * Media library.
 *
 * Generated sizes match how images are actually used on the site — card,
 * portrait and wide — so `next/image` is handed a sensibly sized source
 * rather than scaling a full-resolution upload.
 *
 * SVG is deliberately excluded. An SVG is executable markup, and allowing
 * editors to upload one served from our own origin is a stored-XSS route.
 * Brand marks should be supplied as PNG or WebP; if a true SVG logo is needed
 * it belongs in `public/` under developer review.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Media library' },
  upload: {
    staticDir: path.resolve(process.cwd(), 'public/media'),
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 500, position: 'centre' },
      { name: 'card', width: 900, height: 1125, position: 'centre' },
      { name: 'portrait', width: 1400, height: 1750, position: 'centre' },
      { name: 'wide', width: 2000, height: 1125, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Photographs',
    defaultColumns: ['alt', 'folder', 'updatedAt'],
    listSearchableFields: ['alt', 'caption', 'filename'],
    description:
      'Every photograph on the site. Upload once and use it anywhere. Always describe the image — that description is what someone using a screen reader hears, and what shows if the photograph fails to load.',
    pagination: { defaultLimit: 50, limits: [25, 50, 100] },
  },
  // Newest uploads first: you have usually just added what you are looking for.
  defaultSort: '-createdAt',
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: canManageContent,
    read: () => true,
    update: canManageContent,
    delete: canManageContent,
  },
  hooks: { afterChange: [revalidateCollection] },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Describe this image',
      admin: {
        description:
          'What someone would need to hear if they could not see it, e.g. "Bride in a fitted lace gown on the boutique staircase".',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Optional. Shown under the image in galleries, and used for photographer credits.' },
    },
    {
      name: 'folder',
      type: 'select',
      label: 'Group',
      admin: { description: 'Helps you find the image again.' },
      options: [
        { label: 'Gowns', value: 'Dresses' },
        { label: 'Designers', value: 'Designers' },
        { label: 'The boutique', value: 'Boutique' },
        { label: 'Real brides', value: 'Real Brides' },
        { label: 'Journal', value: 'Journal' },
        { label: 'Events', value: 'Events' },
        { label: 'Brand', value: 'Brand' },
      ],
    },
  ],
}
