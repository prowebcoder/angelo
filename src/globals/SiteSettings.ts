import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { isSuperAdmin } from '../collections/access'

/**
 * The facts about the boutique that appear all over the site.
 *
 * Everything here is written once and read everywhere — the address in the
 * footer and on the contact page is this address; the opening hours in the
 * footer are these hours. So an editor changes a phone number in one place
 * and it is right everywhere.
 *
 * Arranged in tabs in the order staff actually need them, with the things
 * they change often first. Colour and typeface are deliberately *not* here:
 * they are fixed in the site's stylesheet to match the brand, and a control
 * that silently does nothing is worse than no control at all.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Settings',
    description:
      'The boutique’s address, opening hours and social links, used everywhere they appear on the site.',
  },
  access: {
    read: () => true,
    update: isSuperAdmin,
  },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact details',
          description: 'Shown in the footer, on the contact page and in the information Google holds about you.',
          fields: [
            {
              name: 'contact',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'address',
                  type: 'textarea',
                  label: 'Address',
                  admin: {
                    description:
                      'Written the way you would say it, e.g. “38 Lower Dorset Street, Dublin 1, D01 N8X2”. Start a new line only where you want one on the site.',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'phone',
                      type: 'text',
                      label: 'Phone',
                      admin: { width: '50%', description: 'Becomes a tap-to-call link on a phone.' },
                    },
                    { name: 'email', type: 'email', label: 'Email', admin: { width: '50%' } },
                  ],
                },
                {
                  name: 'whatsApp',
                  type: 'text',
                  label: 'WhatsApp number',
                  admin: {
                    description:
                      'Optional. With the country code and no spaces, e.g. 353871234567. Leave empty to hide the WhatsApp option.',
                  },
                },
                {
                  name: 'googleMapsURL',
                  type: 'text',
                  label: 'Google Maps link',
                  admin: {
                    description:
                      'Where the address links to. Find the boutique on Google Maps, press Share, and copy the link.',
                  },
                },
                {
                  name: 'mapEmbedURL',
                  type: 'text',
                  label: 'Map to show on the page',
                  admin: {
                    description:
                      'Optional. On Google Maps press Share → Embed a map, then copy only the address inside src="…".',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Opening hours',
          description:
            'Shown in the footer and on the contact page. Closed days are listed too, so nobody has to guess.',
          fields: [
            {
              name: 'openingHours',
              type: 'array',
              label: ' ',
              labels: { singular: 'Day', plural: 'Days' },
              admin: {
                description: 'Add all seven days so the list is complete. Drag to reorder.',
                components: { RowLabel: '/src/admin/OpeningHoursRowLabel' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'day',
                      type: 'select',
                      required: true,
                      label: 'Day',
                      admin: { width: '50%' },
                      options: [
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday',
                      ],
                    },
                    {
                      name: 'closed',
                      type: 'checkbox',
                      defaultValue: false,
                      label: 'Closed all day',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'openingTime',
                      type: 'text',
                      label: 'Opens',
                      admin: { width: '50%', description: 'Written as you want it read, e.g. 10am.' },
                    },
                    {
                      name: 'closingTime',
                      type: 'text',
                      label: 'Closes',
                      admin: { width: '50%', description: 'e.g. 6pm.' },
                    },
                  ],
                },
                {
                  name: 'specialNote',
                  type: 'text',
                  label: 'Instead of the times, show',
                  admin: {
                    description:
                      'Replaces the opening and closing times for this day, e.g. “11am–5pm (walk-ins)”. Leave empty to use the times above.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Announcement bar',
          description: 'The single line that can sit above the menu, for an offer or a seasonal note.',
          fields: [
            {
              name: 'announcement',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Show the announcement bar',
                },
                {
                  name: 'message',
                  type: 'text',
                  label: 'What it says',
                  admin: {
                    description: 'Keep it to one short line — it has to fit across a phone screen.',
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'Where it links to',
                  admin: {
                    description: 'Optional, e.g. /events. Leave empty for a line that is not a link.',
                    condition: (_, siblingData) => Boolean(siblingData?.enabled),
                  },
                },
                {
                  name: 'backgroundStyle',
                  type: 'select',
                  label: 'Background',
                  defaultValue: 'brand',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                  options: [
                    { label: 'Brand', value: 'brand' },
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Social links',
          description: 'Listed under “Follow” in the footer. Leave one empty to hide it.',
          fields: [
            {
              name: 'social',
              type: 'group',
              label: ' ',
              admin: { description: 'Paste the full address of each profile, starting with https://.' },
              fields: [
                { name: 'instagram', type: 'text', label: 'Instagram' },
                { name: 'tiktok', type: 'text', label: 'TikTok' },
                { name: 'facebook', type: 'text', label: 'Facebook' },
                { name: 'youtube', type: 'text', label: 'YouTube' },
                { name: 'pinterest', type: 'text', label: 'Pinterest' },
              ],
            },
          ],
        },
        {
          label: 'Logo & icon',
          description: 'The boutique wordmark. Supply PNG or WebP — SVG files are not accepted.',
          fields: [
            {
              name: 'branding',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Logo — dark artwork',
                  admin: {
                    description: 'Dark lettering, for a pale background. Used once the menu turns solid white.',
                  },
                },
                {
                  name: 'logoLight',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Logo — light artwork',
                  admin: {
                    description:
                      'White lettering, for a dark background. Used over a photograph and in the footer. Without it the dark logo is used instead.',
                  },
                },
                {
                  name: 'favicon',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Browser tab icon',
                  admin: { description: 'A small square image — the mark shown on the browser tab.' },
                },
                /*
                 * Retired controls.
                 *
                 * Nothing on the site reads these: the colours and typefaces
                 * are fixed in the stylesheet to match the brand, and the
                 * header has no separate mobile logo. Leaving them visible
                 * meant an editor could change a colour, save, and see no
                 * difference — the worst kind of control.
                 *
                 * They are hidden rather than deleted because removing them
                 * would drop five live columns from `site_settings`. If that
                 * is wanted, it belongs in a reviewed migration rather than a
                 * dev schema push.
                 */
                { name: 'mobileLogo', type: 'upload', relationTo: 'media', admin: { hidden: true } },
                { name: 'primaryColour', type: 'text', admin: { hidden: true } },
                { name: 'secondaryColour', type: 'text', admin: { hidden: true } },
                { name: 'displayFont', type: 'text', admin: { hidden: true } },
                { name: 'bodyFont', type: 'text', admin: { hidden: true } },
              ],
            },
          ],
        },
        {
          label: 'Search engines & analytics',
          description: 'How the site describes itself to Google, and the tracking codes it loads.',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: ' ',
              fields: [
                {
                  name: 'defaultTitle',
                  type: 'text',
                  label: 'Default page title',
                  admin: {
                    description:
                      'Used where a page has no title of its own. Around 60 characters reads best in Google.',
                  },
                },
                {
                  name: 'defaultDescription',
                  type: 'textarea',
                  label: 'Default description',
                  admin: {
                    description:
                      'The sentence under the title in Google results. Around 155 characters before it is cut off.',
                  },
                },
                {
                  name: 'defaultOGImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Sharing image',
                  admin: {
                    description:
                      'Shown when a link to the site is pasted into WhatsApp, Instagram or Facebook. A wide photograph works best.',
                  },
                },
                {
                  name: 'googleAnalyticsID',
                  type: 'text',
                  label: 'Google Analytics ID',
                  admin: { description: 'Begins with G-. Leave empty and nothing is loaded.' },
                },
                {
                  name: 'googleTagManagerID',
                  type: 'text',
                  label: 'Google Tag Manager ID',
                  admin: { description: 'Begins with GTM-.' },
                },
                {
                  name: 'metaPixelID',
                  type: 'text',
                  label: 'Meta Pixel ID',
                  admin: { description: 'The numeric ID from Meta Events Manager, for Facebook and Instagram ads.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
