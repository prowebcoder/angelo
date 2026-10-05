import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { canManageContent } from '../collections/access'

/**
 * Gift card page content.
 *
 * Amounts are editable rows rather than a hard-coded list, so the boutique can
 * change what it offers without a release. There is no payment integration
 * yet: the page sends the visitor to whatever checkout link is set here, and
 * shows an enquiry route when none is.
 */
export const GiftCards: GlobalConfig = {
  slug: 'gift-cards',
  label: 'Gift cards',
  admin: { group: 'The website', description: 'The amounts and wording on the gift card page.' },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Opening section',
          description: 'The top of the gift card page.',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                  label: 'Small label above the heading',
                  admin: { description: 'A few words in capitals, e.g. “Gift cards”.' },
                },
                { name: 'heading', type: 'text', label: 'Heading' },
                { name: 'description', type: 'textarea', label: 'Opening paragraph' },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Photograph',
                  admin: { description: 'Sits behind or beside the heading.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Amounts',
          description: 'What a visitor can buy, and where the Buy button sends them.',
          fields: [
            {
              name: 'amounts',
              type: 'array',
              label: 'Available amounts',
              labels: { singular: 'Amount', plural: 'Amounts' },
              admin: { description: 'Drag to reorder. These are the buttons a visitor chooses from.' },
              fields: [
                { name: 'value', type: 'number', required: true, min: 1, label: 'Amount' },
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'EUR',
                  options: [{ label: 'Euro (€)', value: 'EUR' }],
                },
                { name: 'note', type: 'text', label: 'Note beside the amount (optional)' },
              ],
            },
            {
              name: 'allowCustomAmount',
              type: 'checkbox',
              defaultValue: true,
              label: 'Allow a custom amount',
            },
            {
              type: 'row',
              fields: [
                { name: 'minimumCustomAmount', type: 'number', min: 1, defaultValue: 25, label: 'Smallest custom amount', admin: { width: '50%' } },
                { name: 'maximumCustomAmount', type: 'number', min: 1, defaultValue: 2000, label: 'Largest custom amount', admin: { width: '50%' } },
              ],
            },
            {
              name: 'checkoutURL',
              type: 'text',
              label: 'Checkout link',
              admin: {
                description:
                  'Where the Buy button sends the visitor. Leave empty and the page will invite them to contact the boutique instead.',
              },
            },
          ],
        },
        {
          label: 'Wording & terms',
          fields: [
            { name: 'expiryInformation', type: 'textarea', label: 'Expiry information' },
            { name: 'personalMessageCopy', type: 'textarea', label: 'Wording about adding a personal message' },
            { name: 'terms', type: 'richText', label: 'Terms' },
          ],
        },
      ],
    },
  ],
}
