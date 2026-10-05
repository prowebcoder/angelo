import type { Block, Field } from 'payload'

/**
 * Page-builder blocks.
 *
 * Every block is written for a non-technical editor: plain-language labels,
 * short descriptions explaining what the field does on the page, and no JSON.
 * Each one also carries a `hidden` switch so a section can be taken off the
 * page without deleting the content.
 *
 * Adding a block here is half the work — `src/components/blocks/RenderBlocks.tsx`
 * maps the slug to the component that draws it.
 */

const linkFields: Field[] = [
  { name: 'label', type: 'text', required: true, admin: { description: 'The words on the button.' } },
  {
    name: 'url',
    type: 'text',
    required: true,
    admin: { description: 'Where it goes, e.g. /dresses or /your-appointment.' },
  },
]

/** Appended to every block so editors can hide a section temporarily. */
const visibility: Field = {
  name: 'hidden',
  type: 'checkbox',
  defaultValue: false,
  label: 'Hide this section',
  admin: { description: 'Keeps the content but removes the section from the live page.' },
}

const sectionTone: Field = {
  name: 'tone',
  type: 'select',
  defaultValue: 'paper',
  label: 'Background',
  options: [
    { label: 'Paper (default)', value: 'paper' },
    { label: 'Soft shell', value: 'shell' },
    { label: 'Dark', value: 'ink' },
  ],
}

const headingFields: Field[] = [
  { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
  { name: 'heading', type: 'text', required: true },
  { name: 'description', type: 'textarea', label: 'Short introduction' },
]

const seoImageField = (name = 'image', required = false): Field => ({
  name,
  type: 'upload',
  relationTo: 'media',
  required,
  admin: { description: 'Alt text is taken from the media library entry.' },
})

/**
 * Block factory.
 *
 * Payload blocks carry no description of their own, so per-block guidance
 * goes on the fields themselves. The picker heading comes from
 * `BLOCK_GROUPS` below rather than an argument here, so it cannot be left off.
 */
const block = (slug: string, singular: string, plural: string, fields: Field[]): Block => ({
  slug,
  labels: { singular, plural },
  fields: [...fields, visibility],
})

/**
 * How the "add section" picker is divided up.
 *
 * Without headings an editor faces thirty-three flat entries and has to read
 * every one. Grouped, they skim five short lists named after what they are
 * trying to do. The groups are phrased as a person would say them — "Gowns &
 * designers", not "Catalogue" — and every block must appear in exactly one,
 * which `sectionsWithGroups` enforces.
 */
const BLOCK_GROUPS: Record<string, string[]> = {
  'Text & images': [
    'hero',
    'rich-text',
    'two-column-text',
    'statement',
    'split-content',
    'full-width-image',
    'gallery',
    'video-hero',
    'feature-panel',
    'split-panel',
  ],
  'Gowns & designers': [
    'featured-dresses',
    'dress-grid',
    'collection-explorer',
    'category-links',
    'featured-designers',
    'designer-sequence',
    'designer-grid',
  ],
  'Stories & journal': [
    'real-brides',
    'testimonials',
    'awards',
    'journal-list',
    'event-list',
    'instagram-preview',
  ],
  'The boutique': [
    'services-grid',
    'process-timeline',
    'faq-list',
    'opening-hours',
    'contact-information',
    'map',
  ],
  'Prompts & forms': ['call-to-action', 'form', 'newsletter'],
  Layout: ['spacer'],
}

/**
 * Applies the picker headings, and refuses to build a config where a block
 * has been added without one — a developer sees the error immediately, so an
 * editor never meets a stray ungrouped entry.
 */
const sectionsWithGroups = (blocks: Block[]): Block[] => {
  const groupOf = new Map<string, string>()
  for (const [group, slugs] of Object.entries(BLOCK_GROUPS)) {
    for (const slug of slugs) groupOf.set(slug, group)
  }

  const missing = blocks.map((entry) => entry.slug).filter((slug) => !groupOf.has(slug))
  if (missing.length) {
    throw new Error(
      `Page builder: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not listed in BLOCK_GROUPS in src/blocks.ts. Add each one to the group it belongs under.`,
    )
  }

  return blocks.map((entry) => ({ ...entry, admin: { ...entry.admin, group: groupOf.get(entry.slug) } }))
}

const sections: Block[] = [
  /* ------------------------------------------------------------------ */
  /* Editorial                                                          */
  /* ------------------------------------------------------------------ */
  block(
    'hero',
    'Hero',
    'Hero sections',
    [
      { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
      { name: 'heading', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
      seoImageField('image'),
      {
        name: 'mobileImage',
        type: 'upload',
        relationTo: 'media',
        label: 'Mobile image',
        admin: { description: 'Optional upright crop used on phones.' },
      },
      {
        name: 'videoURL',
        type: 'text',
        label: 'Background video URL',
        admin: { description: 'Optional. An MP4 file URL; the image is used as the poster and fallback.' },
      },
      {
        name: 'height',
        type: 'select',
        defaultValue: 'tall',
        label: 'Height',
        options: [
          { label: 'Full screen', value: 'full' },
          { label: 'Tall', value: 'tall' },
          { label: 'Medium', value: 'medium' },
        ],
      },
      {
        name: 'alignment',
        type: 'select',
        defaultValue: 'center',
        label: 'Text position',
        options: [
          { label: 'Centre', value: 'center' },
          { label: 'Left', value: 'left' },
          { label: 'Bottom left', value: 'bottom-left' },
        ],
      },
      { name: 'buttons', type: 'array', maxRows: 2, label: 'Buttons', fields: linkFields },
    ],
  ),

  block('rich-text', 'Text', 'Text sections', [
    { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text' },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'narrow',
      label: 'Column width',
      options: [
        { label: 'Narrow (easiest to read)', value: 'narrow' },
        { label: 'Wide', value: 'wide' },
      ],
    },
    sectionTone,
  ]),

  block(
    'split-content',
    'Image and text',
    'Image and text sections',
    [
      ...headingFields,
      { name: 'body', type: 'richText', label: 'Longer text (optional)' },
      // Optional: the section is useful as text alone while a photograph is
      // still being chosen, and the image slot shows a quiet placeholder.
      seoImageField('image'),
      {
        name: 'imageSide',
        type: 'select',
        defaultValue: 'left',
        label: 'Image position',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
        ],
      },
      { name: 'button', type: 'group', label: 'Button (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
      sectionTone,
    ],
  ),

  block('two-column-text', 'Two columns of text', 'Two-column text sections', [
    ...headingFields,
    { name: 'leftColumn', type: 'richText', label: 'Left column', required: true },
    { name: 'rightColumn', type: 'richText', label: 'Right column', required: true },
    sectionTone,
  ]),

  block(
    'full-width-image',
    'Full width image',
    'Full width images',
    [
      seoImageField('image', true),
      { name: 'mobileImage', type: 'upload', relationTo: 'media', label: 'Mobile image' },
      { name: 'caption', type: 'text' },
      {
        name: 'height',
        type: 'select',
        defaultValue: 'medium',
        label: 'Height',
        options: [
          { label: 'Tall', value: 'tall' },
          { label: 'Medium', value: 'medium' },
          { label: 'Short', value: 'short' },
        ],
      },
      { name: 'overlayHeading', type: 'text', label: 'Heading over the image (optional)' },
      { name: 'button', type: 'group', label: 'Button (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    ],
  ),

  block('gallery', 'Image gallery', 'Image galleries', [
    { name: 'heading', type: 'text' },
    { name: 'description', type: 'textarea' },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      label: 'Layout',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Side-scrolling row', value: 'scroll' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Photograph', plural: 'Photographs' },
      fields: [seoImageField('image', true), { name: 'caption', type: 'text' }],
    },
  ]),

  block(
    'video-hero',
    'Video section',
    'Video sections',
    [
      { name: 'heading', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'videoURL', type: 'text', required: true, label: 'Video URL', admin: { description: 'An MP4 file URL.' } },
      seoImageField('posterImage', true),
      { name: 'button', type: 'group', label: 'Button (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    ],
  ),

  block(
    'feature-panel',
    'Photograph with copy over it',
    'Photograph panels',
    [
      ...headingFields,
      // Optional so a section can be created before its photograph is
      // chosen; the image slot shows a quiet placeholder until then.
      seoImageField('image'),
      {
        name: 'height',
        type: 'select',
        defaultValue: 'medium',
        label: 'Height',
        options: [
          { label: 'Tall', value: 'tall' },
          { label: 'Medium', value: 'medium' },
          { label: 'Short', value: 'short' },
        ],
      },
      {
        name: 'crop',
        type: 'select',
        defaultValue: 'upper',
        label: 'Where to crop the photograph',
        options: [
          { label: 'Towards the top', value: 'top' },
          { label: 'Upper middle', value: 'upper' },
          { label: 'Centre', value: 'centre' },
        ],
      },
      {
        name: 'scrim',
        type: 'select',
        defaultValue: 'soft',
        label: 'Darkening behind the text',
        admin: { description: 'Use the stronger option when the photograph is pale behind the words.' },
        options: [
          { label: 'Soft', value: 'soft' },
          { label: 'Strong', value: 'strong' },
        ],
      },
      { name: 'buttons', type: 'array', maxRows: 2, label: 'Buttons', fields: linkFields },
    ],
  ),

  block(
    'split-panel',
    'Full-width photograph beside copy',
    'Full-width split panels',
    [
      ...headingFields,
      seoImageField('image'),
      {
        name: 'imageSide',
        type: 'select',
        defaultValue: 'right',
        label: 'Photograph position',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
        ],
      },
      { name: 'button', type: 'group', label: 'Button (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    ],
  ),

  block(
    'statement',
    'Centred statement',
    'Centred statements',
    [
      ...headingFields,
      { name: 'button', type: 'group', label: 'Link (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    ],
  ),

  block('call-to-action', 'Call to action', 'Calls to action', [
    ...headingFields,
    seoImageField('image'),
    { name: 'buttons', type: 'array', maxRows: 2, label: 'Buttons', fields: linkFields },
    sectionTone,
  ]),

  /* ------------------------------------------------------------------ */
  /* Catalogue                                                          */
  /* ------------------------------------------------------------------ */
  block(
    'featured-dresses',
    'Chosen gowns',
    'Chosen gown sections',
    [
      ...headingFields,
      {
        name: 'dresses',
        type: 'relationship',
        relationTo: 'dresses',
        hasMany: true,
        label: 'Gowns to show',
        admin: { description: 'Pick the gowns in the order you want them to appear.' },
      },
      { name: 'link', type: 'group', label: 'Link below the gowns (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
      sectionTone,
    ],
  ),

  block(
    'dress-grid',
    'Automatic gown row',
    'Automatic gown rows',
    [
      ...headingFields,
      {
        name: 'source',
        type: 'select',
        required: true,
        defaultValue: 'mostLoved',
        label: 'Which gowns',
        options: [
          { label: 'Most loved', value: 'mostLoved' },
          { label: 'New arrivals', value: 'newArrival' },
          { label: 'Sample sale and off the rack', value: 'sampleSale' },
          { label: 'Featured', value: 'featured' },
        ],
        admin: { description: 'Updates by itself as you tick those boxes on each gown.' },
      },
      { name: 'limit', type: 'number', defaultValue: 8, min: 2, max: 24, label: 'How many to show' },
      { name: 'link', type: 'group', label: 'Link below the gowns (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
      sectionTone,
    ],
  ),

  block('collection-explorer', 'Browsable catalogue', 'Browsable catalogues', [
    { name: 'heading', type: 'text' },
    { name: 'description', type: 'textarea' },
  ]),

  block('featured-designers', 'Chosen designers', 'Chosen designer sections', [
    ...headingFields,
    { name: 'designers', type: 'relationship', relationTo: 'designers', hasMany: true, label: 'Designers to show' },
    { name: 'link', type: 'group', label: 'Link below (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    sectionTone,
  ]),

  block(
    'designer-sequence',
    'Designer scroll sequence',
    'Designer scroll sequences',
    [
      ...headingFields,
      { name: 'limit', type: 'number', defaultValue: 10, min: 2, max: 20, label: 'How many to show' },
    ],
  ),

  block(
    'designer-grid',
    'All designers',
    'All designer sections',
    [...headingFields, { name: 'limit', type: 'number', defaultValue: 12, min: 2, max: 60, label: 'How many to show' }, sectionTone],
  ),

  block(
    'category-links',
    'Category links',
    'Category link sections',
    [
      ...headingFields,
      {
        name: 'links',
        type: 'array',
        minRows: 2,
        labels: { singular: 'Category', plural: 'Categories' },
        fields: [...linkFields, seoImageField('image')],
      },
    ],
  ),

  /* ------------------------------------------------------------------ */
  /* Stories                                                            */
  /* ------------------------------------------------------------------ */
  block('real-brides', 'Real brides', 'Real bride sections', [
    ...headingFields,
    {
      name: 'brides',
      type: 'relationship',
      relationTo: 'real-brides',
      hasMany: true,
      label: 'Brides to show',
      admin: { description: 'Leave empty to show the most recent stories.' },
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 2, max: 12, label: 'How many when chosen automatically' },
    { name: 'link', type: 'group', label: 'Link below (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    sectionTone,
  ]),

  block(
    'testimonials',
    'Quotes',
    'Quote sections',
    [
      ...headingFields,
      {
        name: 'quotes',
        type: 'array',
        minRows: 1,
        labels: { singular: 'Quote', plural: 'Quotes' },
        fields: [
          { name: 'quote', type: 'textarea', required: true },
          { name: 'attribution', type: 'text', label: 'Who said it' },
          { name: 'detail', type: 'text', label: 'Extra detail, e.g. a wedding date' },
        ],
      },
      sectionTone,
    ],
  ),

  block(
    'awards',
    'Awards and recognition',
    'Award sections',
    [
      ...headingFields,
      {
        name: 'items',
        type: 'array',
        minRows: 1,
        labels: { singular: 'Award', plural: 'Awards' },
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'year', type: 'text' },
          { name: 'awardedBy', type: 'text', label: 'Awarded by' },
          { name: 'url', type: 'text', label: 'Link (optional)' },
          { name: 'logo', type: 'upload', relationTo: 'media' },
        ],
      },
      sectionTone,
    ],
  ),

  block('journal-list', 'Journal', 'Journal sections', [
    ...headingFields,
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: 'Articles to show',
      admin: { description: 'Leave empty to show the latest articles.' },
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 2, max: 12, label: 'How many when chosen automatically' },
    { name: 'link', type: 'group', label: 'Link below (optional)', fields: linkFields.map((field) => ({ ...field, required: false })) },
    sectionTone,
  ]),

  block('event-list', 'Events', 'Event sections', [
    ...headingFields,
    {
      name: 'events',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      label: 'Events to show',
      admin: { description: 'Leave empty to show what is coming up.' },
    },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 12, label: 'How many when chosen automatically' },
    sectionTone,
  ]),

  block('instagram-preview', 'Social feed', 'Social feed sections', [
    ...headingFields,
    { name: 'handle', type: 'text', label: 'Account name, e.g. @angelobridal' },
    { name: 'profileURL', type: 'text', label: 'Link to the profile' },
    {
      name: 'posts',
      type: 'array',
      labels: { singular: 'Post', plural: 'Posts' },
      admin: { description: 'Upload the images you want to show and link each one to the real post.' },
      fields: [seoImageField('image', true), { name: 'url', type: 'text', label: 'Link to the post' }],
    },
    sectionTone,
  ]),

  /* ------------------------------------------------------------------ */
  /* Service pages                                                      */
  /* ------------------------------------------------------------------ */
  block('services-grid', 'Service list', 'Service lists', [
    ...headingFields,
    {
      name: 'services',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Service', plural: 'Services' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    sectionTone,
  ]),

  block('process-timeline', 'Numbered steps', 'Numbered step sections', [
    ...headingFields,
    {
      name: 'steps',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Step', plural: 'Steps' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    sectionTone,
  ]),

  block('faq-list', 'Questions and answers', 'Question sections', [
    ...headingFields,
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      label: 'Questions to show',
      admin: { description: 'Leave empty to show every published question.' },
    },
    sectionTone,
  ]),

  block('form', 'Form', 'Forms', [
    ...headingFields,
    {
      name: 'form',
      type: 'select',
      required: true,
      label: 'Which form',
      options: [
        { label: 'Appointment request', value: 'appointment' },
        { label: 'Alterations enquiry', value: 'alterations' },
        { label: 'Contact', value: 'contact' },
      ],
    },
    sectionTone,
  ]),

  block('newsletter', 'Newsletter sign-up', 'Newsletter sign-ups', [
    ...headingFields,
    { name: 'consentCopy', type: 'textarea', label: 'Wording beside the tick box' },
    sectionTone,
  ]),

  /* ------------------------------------------------------------------ */
  /* Boutique details                                                   */
  /* ------------------------------------------------------------------ */
  block(
    'opening-hours',
    'Opening hours',
    'Opening hours sections',
    [...headingFields, sectionTone],
  ),

  block(
    'contact-information',
    'Contact details',
    'Contact detail sections',
    [...headingFields, { name: 'showOpeningHours', type: 'checkbox', defaultValue: true, label: 'Include opening hours' }, sectionTone],
  ),

  block('map', 'Map', 'Maps', [
    { name: 'heading', type: 'text' },
    {
      name: 'embedURL',
      type: 'text',
      label: 'Map embed URL',
      admin: { description: 'Leave empty to use the map URL from Site settings.' },
    },
    { name: 'height', type: 'number', defaultValue: 420, min: 200, max: 800, label: 'Height in pixels' },
  ]),

  block('spacer', 'Blank space', 'Blank spaces', [
    {
      name: 'size',
      type: 'select',
      defaultValue: 'medium',
      label: 'Amount of space',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
    },
    { name: 'divider', type: 'checkbox', defaultValue: false, label: 'Show a hairline divider' },
  ]),
]

export const pageBlocks: Block[] = sectionsWithGroups(sections)

/** Hero fields reused by the Pages collection and the Homepage global. */
export const heroFields: Field[] = (pageBlocks.find((entry) => entry.slug === 'hero')?.fields ?? []).filter(
  (field) => !('name' in field) || field.name !== 'hidden',
)
