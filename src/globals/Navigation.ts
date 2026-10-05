import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { canManageContent } from '../collections/access'

/**
 * The main menu.
 *
 * The header places items either side of the centred wordmark, so each item
 * carries the side it belongs on. Order within a side is the order set here.
 *
 * Two items are enriched automatically rather than needing child links kept by
 * hand: the one pointing at `/dresses` gains the catalogue categories, and the
 * one pointing at `/designers` lists the designer collection. See
 * `src/components/layout/nav-data.ts`.
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    group: 'The website',
    description: 'The main menu. Each item sits to the left or right of the wordmark.',
  },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Menu items',
      labels: { singular: 'Menu item', plural: 'Menu items' },
      admin: {
        description:
          'Drag to reorder. Items appear in this order on their side of the logo, so moving one between sides changes where it sits in the header.',
        components: { RowLabel: '/src/admin/LinkRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'What it says',
              admin: { width: '50%' },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              label: 'Where it goes',
              admin: { width: '50%', description: 'A path on this site, e.g. /dresses or /about.' },
            },
          ],
        },
        {
          name: 'side',
          type: 'select',
          required: true,
          defaultValue: 'left',
          label: 'Which side of the logo',
          admin: { description: 'The header splits the menu either side of the wordmark.' },
          options: [
            { label: 'Left of the logo', value: 'left' },
            { label: 'Right of the logo', value: 'right' },
          ],
        },
        {
          name: 'children',
          type: 'array',
          label: 'Dropdown links',
          labels: { singular: 'Dropdown link', plural: 'Dropdown links' },
          admin: {
            description:
              'Optional. Adding links here turns the item into a dropdown. Wedding Dresses and Designers fill theirs in from the catalogue automatically, so they need nothing here.',
            components: { RowLabel: '/src/admin/LinkRowLabel' },
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, label: 'What it says', admin: { width: '50%' } },
                { name: 'url', type: 'text', required: true, label: 'Where it goes', admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'appointmentLabel',
      type: 'text',
      defaultValue: 'Book Appointment',
      label: 'Wording on the booking button',
      admin: { description: 'The button at the far right of the header.' },
    },
    {
      name: 'bridalPortalURL',
      type: 'text',
      label: 'Bridal portal link',
      admin: { description: 'The address of the portal brides sign in to. Leave empty to hide the portal icon.' },
    },
  ],
}
