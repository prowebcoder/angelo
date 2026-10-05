import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { canManageContent } from '../collections/access'

/**
 * The footer, and the appointment band that sits above it on every page.
 *
 * Laid out as the reference does: a four-column grid of Visit, Explore,
 * Opening hours and Follow, then a rule and a bottom bar carrying the
 * copyright and the legal links.
 *
 * The address, phone, email, opening hours and social links are not repeated
 * here — they are read from Site settings so the boutique keeps them in one
 * place.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'The website',
    description: 'The footer, and the appointment band shown above it on every page.',
  },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'preFooter',
      type: 'group',
      label: 'Appointment band',
      admin: { description: 'Sits above the footer on every page. Clear the heading to hide it.' },
      fields: [
        { name: 'heading', type: 'text', label: 'Heading' },
        {
          name: 'button',
          type: 'group',
          label: 'Button',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'visitHeading',
      type: 'text',
      defaultValue: 'Visit',
      label: 'Heading above the address',
    },
    {
      name: 'openingHoursHeading',
      type: 'text',
      defaultValue: 'Opening hours',
      label: 'Heading above the opening hours',
    },
    {
      name: 'socialHeading',
      type: 'text',
      defaultValue: 'Follow',
      label: 'Heading above the social links',
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Link columns',
      maxRows: 2,
      admin: {
        description:
          'Sits between the address and the opening hours. Usually one column, "Explore".',
      },
      fields: [
        { name: 'heading', type: 'text', required: true, label: 'Column heading' },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          labels: { singular: 'Link', plural: 'Links' },
          admin: {
            description: 'Drag to reorder. These appear in this order under the heading.',
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
      name: 'description',
      type: 'textarea',
      label: 'Short paragraph (optional)',
      admin: { description: 'Shown under the address. Leave empty to match the reference layout.' },
    },
    {
      name: 'showNewsletter',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show the newsletter sign-up',
      admin: { description: 'Off by default, as on the reference. The Newsletter section block is the other way to offer it.' },
    },
    { name: 'copyright', type: 'text', label: 'Copyright line' },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Legal links',
      labels: { singular: 'Legal link', plural: 'Legal links' },
      admin: {
        description: 'Shown in the bottom bar beside the copyright — privacy, cookies, terms and the like.',
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
}
