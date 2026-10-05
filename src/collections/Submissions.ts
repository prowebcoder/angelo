import type { CollectionConfig, Field } from 'payload'
import { canManageSubmissions } from './access'

/**
 * Everything a visitor sends the boutique.
 *
 * These four collections are read-only in spirit: the website creates the
 * documents, and staff work through them. So the admin is arranged for
 * *handling* rather than authoring — newest first, the status always in the
 * sidebar, and the submitted details laid out as a legible record instead of
 * a form.
 */

const submissionAccess = {
  admin: ({ req }: { req: { user?: unknown } }) => Boolean(req.user),
  // Only the website's own server actions create these.
  create: () => false,
  read: canManageSubmissions,
  update: canManageSubmissions,
  delete: canManageSubmissions,
}

/**
 * Where an enquiry has got to.
 *
 * In the sidebar because it is the one field staff change, and it should be
 * reachable without scrolling past everything the visitor wrote.
 */
const statusField: Field = {
  name: 'status',
  type: 'select',
  defaultValue: 'new',
  label: 'Where this has got to',
  admin: {
    position: 'sidebar',
    description: 'Change this as you work through the enquiry. The dashboard counts anything still marked New.',
  },
  options: [
    { label: 'New — not yet answered', value: 'new' },
    { label: 'In progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Archived', value: 'archived' },
  ],
}

/** The visitor's name, on one line. */
const nameRow: Field = {
  type: 'row',
  fields: [
    { name: 'firstName', type: 'text', required: true, label: 'First name', admin: { width: '50%' } },
    { name: 'lastName', type: 'text', required: true, label: 'Last name', admin: { width: '50%' } },
  ],
}

/** How to reach them, on one line. */
const contactRow: Field = {
  type: 'row',
  fields: [
    { name: 'email', type: 'email', required: true, label: 'Email', admin: { width: '50%' } },
    { name: 'phone', type: 'text', label: 'Phone', admin: { width: '50%' } },
  ],
}

/** Shared admin shape: newest first, no duplicating, plain-English help. */
const submissionAdmin = (description: string, defaultColumns: string[]) => ({
  useAsTitle: 'email',
  group: 'Enquiries',
  defaultColumns,
  listSearchableFields: ['email'],
  description,
  pagination: { defaultLimit: 25 },
})

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  labels: { singular: 'Appointment request', plural: 'Appointment requests' },
  admin: submissionAdmin(
    'Requests sent from the booking form. Reply to the bride directly, then mark the request as completed.',
    ['email', 'appointmentType', 'preferredDate', 'status', 'createdAt'],
  ),
  access: submissionAccess,
  // Newest first: a request from this morning matters more than one from June.
  defaultSort: '-createdAt',
  disableDuplicate: true,
  fields: [
    statusField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Who got in touch',
          fields: [
            nameRow,
            contactRow,
            {
              type: 'row',
              fields: [
                { name: 'weddingDate', type: 'date', label: 'Wedding date', admin: { width: '50%' } },
                { name: 'venue', type: 'text', label: 'Venue', admin: { width: '50%' } },
              ],
            },
            {
              name: 'marketingConsent',
              type: 'checkbox',
              defaultValue: false,
              label: 'Happy to receive the newsletter',
              admin: { description: 'Ticked by the bride on the form. Do not add anyone who did not tick it.' },
            },
          ],
        },
        {
          label: 'The appointment',
          fields: [
            {
              name: 'appointmentType',
              type: 'text',
              required: true,
              label: 'Type of appointment',
              admin: { description: 'One of the types set under Settings → Form settings.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'preferredDate', type: 'date', label: 'Preferred date', admin: { width: '50%' } },
                { name: 'preferredTime', type: 'text', label: 'Preferred time', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'size', type: 'text', label: 'Dress size', admin: { width: '50%' } },
                {
                  name: 'designerPreferences',
                  type: 'text',
                  label: 'Designers they mentioned',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'selectedDresses',
              type: 'relationship',
              relationTo: 'dresses',
              hasMany: true,
              label: 'Gowns on their try-on list',
              admin: { description: 'Chosen on the website. Prepare these for the appointment where you can.' },
            },
            { name: 'dressPreferences', type: 'textarea', label: 'What they are looking for' },
            { name: 'message', type: 'textarea', label: 'Their message' },
          ],
        },
      ],
    },
  ],
}

export const AlterationEnquiries: CollectionConfig = {
  slug: 'alteration-enquiries',
  labels: { singular: 'Alterations enquiry', plural: 'Alterations enquiries' },
  admin: submissionAdmin(
    'Enquiries about alterations, including any photographs the bride attached.',
    ['email', 'weddingDate', 'gownStatus', 'status', 'createdAt'],
  ),
  access: submissionAccess,
  defaultSort: '-createdAt',
  disableDuplicate: true,
  fields: [
    statusField,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Who got in touch',
          fields: [
            nameRow,
            contactRow,
            {
              type: 'row',
              fields: [
                { name: 'weddingDate', type: 'date', label: 'Wedding date', admin: { width: '50%' } },
                {
                  name: 'travelDate',
                  type: 'date',
                  label: 'Travelling from',
                  admin: { width: '50%', description: 'When they leave, if the wedding is abroad.' },
                },
              ],
            },
          ],
        },
        {
          label: 'The gown',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'purchaseLocation',
                  type: 'text',
                  label: 'Where the gown was bought',
                  admin: { width: '50%' },
                },
                {
                  name: 'gownStatus',
                  type: 'text',
                  label: 'Whether they have it yet',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              label: 'What they need doing',
            },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Photographs they sent',
              admin: { description: 'Uploaded with the enquiry. These are not shown anywhere on the website.' },
            },
          ],
        },
      ],
    },
  ],
}

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Message', plural: 'Messages' },
  admin: {
    ...submissionAdmin('Messages sent from the contact page.', [
      'name',
      'email',
      'subject',
      'status',
      'createdAt',
    ]),
    useAsTitle: 'name',
    listSearchableFields: ['name', 'email', 'subject'],
  },
  access: submissionAccess,
  defaultSort: '-createdAt',
  disableDuplicate: true,
  fields: [
    statusField,
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Name', admin: { width: '50%' } },
        { name: 'email', type: 'email', required: true, label: 'Email', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', label: 'Phone', admin: { width: '50%' } },
        { name: 'subject', type: 'text', label: 'Subject', admin: { width: '50%' } },
      ],
    },
    { name: 'message', type: 'textarea', required: true, label: 'Their message' },
  ],
}

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: { singular: 'Newsletter signup', plural: 'Newsletter signups' },
  admin: {
    ...submissionAdmin(
      'Everyone who asked for the newsletter. Export this list when you send a campaign — and respect anyone marked unsubscribed.',
      ['email', 'source', 'status', 'createdAt'],
    ),
    useAsTitle: 'email',
  },
  access: submissionAccess,
  defaultSort: '-createdAt',
  disableDuplicate: true,
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'subscribed',
      label: 'Status',
      admin: {
        position: 'sidebar',
        description: 'Mark anyone who asks to be removed as unsubscribed rather than deleting them.',
      },
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    { name: 'email', type: 'email', required: true, unique: true, label: 'Email' },
    {
      name: 'consent',
      type: 'checkbox',
      required: true,
      label: 'They agreed to be contacted',
      admin: { description: 'Recorded when they signed up. Proof of consent — do not change it.' },
    },
    {
      name: 'source',
      type: 'text',
      label: 'Where they signed up',
      admin: { description: 'Which part of the website the sign-up came from.' },
    },
  ],
}
