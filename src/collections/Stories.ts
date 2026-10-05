import type { CollectionConfig } from 'payload'
import { revalidateCollection, revalidateCollectionAfterDelete } from '../lib/revalidate'
import { canManageContent, publishedOrAuthenticated } from './access'
import { publishedAtField, seoField, slugField } from './fields'
import { previewConfig } from './preview'

const contentAccess = {
  admin: ({ req }: { req: { user?: unknown } }) => Boolean(req.user),
  create: canManageContent,
  read: publishedOrAuthenticated,
  update: canManageContent,
  delete: canManageContent,
}

const revalidationHooks = {
  afterChange: [revalidateCollection],
  afterDelete: [revalidateCollectionAfterDelete],
}

const previewURL = (collection: string) => previewConfig(collection)

/** Taxonomy picker limited to one kind, so editors see only relevant terms. */
const categoryPicker = (name: string, kind: string, label: string, hasMany = false) => ({
  name,
  type: 'relationship' as const,
  relationTo: 'taxonomies' as const,
  hasMany,
  label,
  filterOptions: () => ({ kind: { equals: kind } }),
})

/* -------------------------------------------------------------------------- */
/* Accessories                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Veils, shoes, jewellery and belts.
 *
 * Priced and SKU'd so a basket can be added later, but there is no checkout
 * yet — the site invites an enquiry instead of promising a purchase.
 */
export const Accessories: CollectionConfig = {
  slug: 'accessories',
  labels: { singular: 'Accessory', plural: 'Accessories' },
  admin: {
    useAsTitle: 'name',
    group: 'Gowns & designers',
    defaultColumns: ['name', 'category', 'price', 'availability', '_status'],
    listSearchableFields: ['name', 'sku'],
    description:
      'Veils, shoes and the other pieces sold alongside the gowns. These are what appears under “Complete the look” on a gown page.',
  },
  defaultSort: 'name',
  access: contentAccess,
  versions: { drafts: true },
  hooks: revalidationHooks,
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { ...categoryPicker('category', 'accessory-category', 'Category'), required: true, admin: { position: 'sidebar' } },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Feature this piece',
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'The piece',
          description: 'What it is and what it costs.',
          fields: [
            {
              name: 'description',
              type: 'textarea',
              label: 'Short description',
              admin: { description: 'One or two sentences, shown on the card and on the gown pages it is styled with.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  min: 0,
                  label: 'Price',
                  admin: { width: '50%', description: 'Leave empty when the price is confirmed in the boutique.' },
                },
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'EUR',
                  label: 'Currency',
                  options: [{ label: 'Euro (€)', value: 'EUR' }],
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'sku',
                  type: 'text',
                  index: true,
                  label: 'Reference code',
                  admin: { width: '50%', description: 'The supplier’s code, if there is one.' },
                },
                {
                  name: 'availability',
                  type: 'select',
                  defaultValue: 'confirm-with-boutique',
                  label: 'Availability',
                  admin: { width: '50%' },
                  options: [
                    { label: 'In the boutique', value: 'available' },
                    { label: 'Currently unavailable', value: 'unavailable' },
                    { label: 'Confirm with boutique', value: 'confirm-with-boutique' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Photographs',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Main photograph',
              admin: { description: 'Shown on the card and at the top of the piece’s own page.' },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'More photographs',
              admin: { description: 'Optional. Other views, shown after the main photograph.' },
            },
          ],
        },
        { label: 'Search engines', fields: [seoField()] },
      ],
    },
  ],
}

/* -------------------------------------------------------------------------- */
/* Real brides                                                               */
/* -------------------------------------------------------------------------- */

export const RealBrides: CollectionConfig = {
  slug: 'real-brides',
  labels: { singular: 'Real bride', plural: 'Real brides' },
  admin: {
    useAsTitle: 'brideName',
    group: 'Stories & journal',
    defaultColumns: ['brideName', 'weddingDate', 'location', 'featured', '_status'],
    listSearchableFields: ['brideName', 'location'],
    description: 'Wedding-day stories. Only publish with the couple’s permission.',
    ...previewURL('real-brides'),
  },
  access: contentAccess,
  versions: { drafts: true },
  defaultSort: '-weddingDate',
  hooks: revalidationHooks,
  fields: [
    { name: 'brideName', type: 'text', required: true, label: 'Bride’s name' },
    slugField('brideName'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Feature this story',
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'The wedding',
          description: 'Who she is, where she married and what she wore.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'weddingDate', type: 'date', label: 'Wedding date', admin: { width: '50%' } },
                { name: 'location', type: 'text', label: 'Where they married', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'dress',
                  type: 'relationship',
                  relationTo: 'dresses',
                  label: 'Gown worn',
                  admin: {
                    width: '50%',
                    description: 'Links her story to the gown’s page, and the gown back to her.',
                  },
                },
                {
                  name: 'designer',
                  type: 'relationship',
                  relationTo: 'designers',
                  label: 'Designer',
                  admin: { width: '50%', description: 'Only needed if the gown is not listed above.' },
                },
              ],
            },
            { name: 'story', type: 'richText', label: 'Her story' },
          ],
        },
        {
          label: 'Photographs',
          description: 'Only images the couple and their photographer have agreed you may publish.',
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Cover photograph',
              admin: { description: 'The one that appears on her card and at the top of her story.' },
            },
            {
              name: 'images',
              type: 'array',
              label: 'Wedding photographs',
              labels: { singular: 'Photograph', plural: 'Photographs' },
              admin: { description: 'Drag to rearrange. Credit the photographer in the caption.' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'alt', type: 'text', required: true, label: 'Describe the photograph' },
                { name: 'caption', type: 'text', label: 'Caption or photographer credit' },
              ],
            },
          ],
        },
        { label: 'Search engines', fields: [seoField()] },
      ],
    },
  ],
}

/* -------------------------------------------------------------------------- */
/* Events                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Trunk shows, designer weekends, walk-in Sundays and wedding fairs.
 *
 * Status is worked out from the dates, so past events archive themselves. The
 * override exists for the exceptions — a postponed event, or one that should
 * stay featured.
 */
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    useAsTitle: 'title',
    group: 'Stories & journal',
    defaultColumns: ['title', 'startDate', 'endDate', 'statusOverride', '_status'],
    listSearchableFields: ['title'],
    description: 'Past events move to the archive automatically, based on their dates.',
    ...previewURL('events'),
  },
  access: contentAccess,
  versions: { drafts: true },
  defaultSort: 'startDate',
  hooks: revalidationHooks,
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Event title' },
    slugField('title'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Feature this event',
      admin: { position: 'sidebar' },
    },
    {
      name: 'statusOverride',
      type: 'select',
      defaultValue: 'automatic',
      label: 'Status',
      admin: {
        position: 'sidebar',
        description: 'Leave on automatic unless you need to force this event into a particular list.',
      },
      options: [
        { label: 'Automatic (from the dates)', value: 'automatic' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Happening now', value: 'live' },
        { label: 'Past', value: 'past' },
      ],
    },
    { ...categoryPicker('eventType', 'event-type', 'Event type'), admin: { position: 'sidebar' } },
    {
      type: 'row',
      fields: [
        { name: 'startDate', type: 'date', required: true, timezone: true, index: true, label: 'Start date', admin: { width: '50%' } },
        { name: 'endDate', type: 'date', timezone: true, label: 'End date', admin: { width: '50%', description: 'Leave empty for a single day.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startTime', type: 'text', label: 'Start time', admin: { width: '50%', placeholder: '11:00' } },
        { name: 'endTime', type: 'text', label: 'End time', admin: { width: '50%', placeholder: '17:00' } },
      ],
    },
    { name: 'recurring', type: 'checkbox', defaultValue: false, label: 'This event repeats' },
    { name: 'shortDescription', type: 'textarea', label: 'Short description', admin: { description: 'Shown on cards and listings.' } },
    { name: 'description', type: 'richText', label: 'Full details' },
    {
      type: 'row',
      fields: [
        { name: 'location', type: 'text', label: 'Location name', admin: { width: '50%' } },
        {
          name: 'attendanceType',
          type: 'select',
          label: 'How to attend',
          admin: { width: '50%' },
          options: [
            { label: 'By appointment', value: 'appointment' },
            { label: 'Walk-ins welcome', value: 'walk-in' },
            { label: 'RSVP required', value: 'RSVP' },
            { label: 'Register externally', value: 'external-registration' },
          ],
        },
      ],
    },
    { name: 'address', type: 'textarea', label: 'Address' },
    {
      type: 'row',
      fields: [
        { name: 'rsvpURL', type: 'text', label: 'RSVP link', admin: { width: '50%' } },
        { name: 'appointmentURL', type: 'text', label: 'Booking link', admin: { width: '50%', description: 'Leave empty to use the appointment page.' } },
      ],
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'Header photograph' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, label: 'Photographs' },
    seoField(),
  ],
}

/* -------------------------------------------------------------------------- */
/* Journal                                                                   */
/* -------------------------------------------------------------------------- */

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Journal article', plural: 'Journal' },
  admin: {
    useAsTitle: 'title',
    group: 'Stories & journal',
    defaultColumns: ['title', 'category', 'publishedAt', 'featured', '_status'],
    listSearchableFields: ['title', 'excerpt'],
    description: 'Practical bridal guidance and boutique news.',
    ...previewURL('posts'),
  },
  access: contentAccess,
  versions: { drafts: true },
  defaultSort: '-publishedAt',
  hooks: revalidationHooks,
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Article title' },
    slugField('title'),
    publishedAtField,
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Feature this article',
      admin: { position: 'sidebar' },
    },
    { ...categoryPicker('category', 'journal-category', 'Category'), admin: { position: 'sidebar' } },
    { ...categoryPicker('tags', 'journal-tag', 'Tags', true), admin: { position: 'sidebar' } },
    {
      type: 'row',
      fields: [
        { name: 'author', type: 'text', label: 'Written by', admin: { width: '50%' } },
        {
          name: 'readingTime',
          type: 'number',
          min: 1,
          label: 'Reading time in minutes',
          admin: { width: '50%', description: 'Optional. Shown beside the date.' },
        },
      ],
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Short summary',
      admin: { description: 'Shown on cards and in search results.' },
    },
    { name: 'featuredImage', type: 'upload', relationTo: 'media', required: true, label: 'Header photograph' },
    { name: 'content', type: 'richText', required: true, label: 'Article' },
    seoField({ withCanonical: true }),
  ],
}

/* -------------------------------------------------------------------------- */
/* FAQs                                                                      */
/* -------------------------------------------------------------------------- */

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'Question', plural: 'Questions and answers' },
  admin: {
    useAsTitle: 'question',
    group: 'Stories & journal',
    defaultColumns: ['question', 'category', 'displayOrder', '_status'],
    listSearchableFields: ['question'],
    description: 'Shown on the questions page and in any Questions section you add to a page.',
  },
  access: contentAccess,
  versions: { drafts: true },
  defaultSort: 'displayOrder',
  hooks: revalidationHooks,
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true },
    { ...categoryPicker('category', 'faq-category', 'Category'), admin: { position: 'sidebar' } },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Order',
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
}
