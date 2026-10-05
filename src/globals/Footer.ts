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
      type: 'tabs',
      tabs: [
        {
          label: 'Appointment band',
          description: 'The invitation across the top of the footer, with the logo and the booking button.',
          fields: [
            {
              name: 'preFooter',
              type: 'group',
              label: ' ',
              admin: { description: 'Clear the heading to hide the band and start the footer at the columns.' },
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  label: 'Heading',
                  admin: { description: 'Set large across the footer, e.g. “Your bridal journey starts here.”' },
                },
                {
                  name: 'button',
                  type: 'group',
                  label: 'Button',
                  admin: { description: 'Shown at the right of the band. Both fields are needed, or no button appears.' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', type: 'text', label: 'What it says', admin: { width: '50%' } },
                        { name: 'url', type: 'text', label: 'Where it goes', admin: { width: '50%' } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Columns',
          description: 'The four columns of the footer. The address, opening hours and social links themselves come from Site settings — only their headings are set here.',
          fields: [
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
          ],
        },
        {
          label: 'Bottom bar',
          description: 'The line under the columns: the copyright and the legal links.',
          fields: [
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
        },
      ],
    },
  ],
}
