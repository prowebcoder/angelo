import type { Field } from 'payload'
import { slugify } from '../lib/format'

/**
 * Slug field that fills itself in from another field.
 *
 * Editors should never have to hand-write a URL. The value is still editable
 * (a published URL must be able to stay put when a title is reworded), but it
 * is generated on first save and always normalised to a safe form.
 */
export const slugField = (sourceField: string, options: { unique?: boolean } = {}): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  // Taxonomy terms opt out: a term is unique per kind, not site-wide, because
  // "Lace" is legitimately both a fabric and a feature.
  unique: options.unique ?? true,
  index: true,
  label: 'URL',
  admin: {
    position: 'sidebar',
    description: 'Filled in from the title. Change it only if you need a different web address.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        const candidate = typeof value === 'string' && value.trim() ? value : (data?.[sourceField] as string | undefined)
        return candidate ? slugify(candidate) : value
      },
    ],
  },
})

/** SEO group shared by every public-facing collection. */
export const seoField = (options: { withCanonical?: boolean; withNoIndex?: boolean } = {}): Field => ({
  name: 'seo',
  type: 'group',
  label: 'Search engines and sharing',
  admin: {
    description: 'Leave blank to use the page title, description and default image.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Search engine title',
      admin: { description: 'Around 60 characters reads best in results.' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Search engine description',
      admin: { description: 'Around 155 characters.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Sharing image',
      admin: { description: 'Shown when the page is shared on social media.' },
    },
    ...(options.withCanonical
      ? [
          {
            name: 'canonicalURL',
            type: 'text' as const,
            label: 'Canonical URL',
            admin: { description: 'Only needed if this content also lives at another address.' },
          },
        ]
      : []),
    ...(options.withNoIndex
      ? [
          {
            name: 'noIndex',
            type: 'checkbox' as const,
            defaultValue: false,
            label: 'Hide from search engines',
          },
        ]
      : []),
  ],
})

/** Publish date shown in the sidebar beside the draft/published control. */
export const publishedAtField: Field = {
  name: 'publishedAt',
  type: 'date',
  timezone: true,
  label: 'Publish date',
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Used for ordering and shown on the page.',
  },
}
