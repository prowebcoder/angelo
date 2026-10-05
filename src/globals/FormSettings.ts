import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { isSuperAdmin } from '../collections/access'

/**
 * How the appointment form behaves.
 *
 * The types of appointment offered, any extra questions asked, where the
 * notification goes and the consent wording shown beneath every form. Changed
 * rarely, and only by a Super Admin — an extra required question that nobody
 * can answer stops brides booking.
 */
export const FormSettings: GlobalConfig = {
  slug: 'form-settings',
  label: 'Form settings',
  admin: {
    group: 'Settings',
    description:
      'The appointment types brides can choose from, any extra questions you ask, and where their request is sent.',
  },
  access: { read: () => true, update: isSuperAdmin },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'notificationEmail',
      type: 'email',
      label: 'Send enquiries to',
      admin: {
        description:
          'Where a copy of every enquiry is emailed. Every enquiry is also saved under Enquiries, so nothing is lost if this is empty.',
      },
    },
    {
      name: 'appointmentTypes',
      type: 'array',
      label: 'Types of appointment',
      labels: { singular: 'Appointment type', plural: 'Types of appointment' },
      admin: {
        description:
          'What a bride picks from when booking. Drag to reorder. Untick “Offer this” to take one off the form without losing it.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, label: 'Name', admin: { width: '70%' } },
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Offer this',
              admin: { width: '30%' },
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'What it involves',
          admin: { description: 'One or two sentences, shown beside the name on the form.' },
        },
      ],
    },
    {
      name: 'appointmentFields',
      type: 'array',
      label: 'Extra questions',
      labels: { singular: 'Question', plural: 'Extra questions' },
      admin: {
        description:
          'Questions asked on top of the standard ones. Keep these few — every extra question is one more reason not to finish the form.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'The question',
              admin: { width: '50%', description: 'What the bride reads, e.g. “How did you hear about us?”' },
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              label: 'Reference',
              admin: {
                width: '50%',
                description: 'A short one-word tag used to store the answer, e.g. heardAbout. No spaces.',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              label: 'Kind of answer',
              admin: { width: '50%' },
              options: [
                { label: 'Short text', value: 'text' },
                { label: 'Email address', value: 'email' },
                { label: 'Phone number', value: 'tel' },
                { label: 'Date', value: 'date' },
                { label: 'Choose from a list', value: 'select' },
                { label: 'Long text', value: 'textarea' },
                { label: 'Tick box', value: 'checkbox' },
              ],
            },
            {
              name: 'required',
              type: 'checkbox',
              defaultValue: false,
              label: 'Must be answered',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'options',
          type: 'array',
          label: 'The choices',
          labels: { singular: 'Choice', plural: 'Choices' },
          admin: {
            description: 'Only used by “Choose from a list”.',
            condition: (_, siblingData) => siblingData?.type === 'select',
          },
          fields: [{ name: 'label', type: 'text', required: true, label: 'Choice' }],
        },
      ],
    },
    {
      name: 'consentCopy',
      type: 'textarea',
      label: 'Consent wording',
      admin: {
        description:
          'The line beneath every form explaining what happens to someone’s details. Shown with the tick box they have to agree to.',
      },
    },
  ],
}
