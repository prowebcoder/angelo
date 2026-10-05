/**
 * Content taken from the live Angelo Bridal site.
 *
 * Every string here is the boutique's own copy, read from
 * angelo-bridal.outworkmedia.ie, so the seeded site carries the real wording
 * rather than placeholders. Kept in its own module so the seed script stays
 * about *how* content is created and this file is about *what* it says —
 * which also makes it easy to diff when the boutique revises their copy.
 *
 * Everything seeded from here remains fully editable in the admin; this is a
 * starting point, not a source of truth the CMS defers to.
 */

export const SITE = {
  announcement: 'Sunday walk-ins · 11am–5pm · Bridal Boutique of the Year 2026',
  address: '38 Lower Dorset Street, Dublin 1, D01 N8X2',
  phone: '01 727 7123',
  email: 'info@angelobridal.ie',
  metaTitle: 'Angelo Bridal — Award-winning bridal boutique in Dublin',
  metaDescription:
    'An award-winning bridal boutique in Dublin, with experienced consultants, private appointments and in-house alterations.',
  footerDescription:
    'An award-winning bridal boutique in Dublin, with experienced consultants, private appointments and in-house alterations.',
  copyright: '© Angelo Bridal 2026',
  preFooterHeading: 'Your bridal journey starts here.',
}

/** Exactly as published on the site. */
export const OPENING_HOURS: {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  closed: boolean
  openingTime?: string
  closingTime?: string
  specialNote?: string
}[] = [
  { day: 'Monday', closed: true },
  { day: 'Tuesday', closed: false, openingTime: '10am', closingTime: '6pm' },
  { day: 'Wednesday', closed: false, openingTime: '10am', closingTime: '6pm' },
  { day: 'Thursday', closed: false, openingTime: '10am', closingTime: '7pm' },
  { day: 'Friday', closed: false, openingTime: '10am', closingTime: '7pm' },
  { day: 'Saturday', closed: false, openingTime: '9am', closingTime: '7pm' },
  { day: 'Sunday', closed: false, specialNote: '11am–5pm (walk-ins)' },
]

/**
 * The ten designer collections, with the boutique's own one-line description
 * and the order they appear in on the homepage.
 */
export const DESIGNERS: { name: string; slug: string; description: string }[] = [
  { name: 'Rosa Clará', slug: 'rosa-clara', description: 'Spanish bridal craft, romantic structure and refined contemporary detail.' },
  { name: 'Maria Anette', slug: 'maria-anette', description: 'Modern glamour, clean confidence and transformative bridal silhouettes.' },
  { name: 'Luce Sposa', slug: 'luce-sposa', description: 'Sculptural silhouettes, intricate finish and confident romance.' },
  { name: 'Morilee', slug: 'morilee', description: 'Modern bridal glamour with an unmistakably feminine point of view.' },
  { name: 'Pronovias Privée', slug: 'pronovias-privee', description: 'Couture proportions and refined detail from an international design house.' },
  { name: 'House of St. Patrick', slug: 'house-of-st-patrick', description: 'Elegant structure, beautiful fabrics and quietly dramatic finish.' },
  { name: 'Arina Galagan', slug: 'arina-galagan', description: 'Fashion-led bridal design with graceful movement and fine detail.' },
  { name: 'Ariamo', slug: 'ariamo', description: 'A contemporary collection shaped by clean lines and expressive form.' },
  { name: 'Mayra', slug: 'mayra', description: 'Romantic bridal silhouettes made to feel considered from every angle.' },
  { name: 'Anifael', slug: 'anifael', description: 'Modern romance with a light, assured couture sensibility.' },
]

/**
 * The gowns the reference site features under "Most loved", in its order.
 *
 * Slugs rather than names, because the catalogue is keyed by slug and two
 * designers can use the same gown name.
 */
export const MOST_LOVED_SLUGS = [
  'anifael-amour-2',
  'morilee-galatea-1',
  'morilee-dalia-24',
  'house-of-st-patrick-helea-1',
  'ariamo-l619-6',
  'luce-sposa-jacqui-1',
]

/**
 * Main navigation, in the site's own order.
 *
 * The reference splits its destinations either side of the centred wordmark:
 * the first four sit to the left, the remaining five to the right, with the
 * search, wishlist, portal and appointment button after them. Staff can move
 * any item between sides in the admin.
 */
export const NAVIGATION: { label: string; url: string; side: 'left' | 'right' }[] = [
  { label: 'Wedding Dresses', url: '/dresses', side: 'left' },
  { label: 'Designers', url: '/designers', side: 'left' },
  { label: 'Alterations', url: '/alterations', side: 'left' },
  { label: 'Our Brides', url: '/real-brides', side: 'left' },
  { label: 'Accessories', url: '/accessories', side: 'right' },
  { label: 'Gift Cards', url: '/gift-card', side: 'right' },
  { label: 'Events', url: '/events', side: 'right' },
  { label: 'Journal', url: '/journal', side: 'right' },
  { label: 'About Angelo', url: '/about', side: 'right' },
]

/** The boutique's own accounts, as linked in the reference footer. */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/angelobridal/',
  tiktok: 'https://www.tiktok.com/@angelobridal',
  facebook: 'https://www.facebook.com/angelobridaldublin/',
  youtube: 'https://www.youtube.com/@angelobridal',
}

/**
 * Legal links in the footer's bottom bar.
 *
 * The pages themselves are seeded as shells carrying an honest "being
 * prepared" notice — real policy text is not ours to write, and a footer link
 * that 404s on every page is worse than a page that says so.
 */
export const LEGAL_LINKS = [
  { label: 'Privacy', url: '/privacy', title: 'Privacy' },
  { label: 'Cookies', url: '/cookies', title: 'Cookies' },
  { label: 'Terms', url: '/terms', title: 'Terms' },
  { label: 'Accessibility', url: '/accessibility', title: 'Accessibility' },
]

export const FOOTER_EXPLORE = [
  { label: 'Wedding Dresses', url: '/dresses' },
  { label: 'Designers', url: '/designers' },
  { label: 'Alterations', url: '/alterations' },
  { label: 'Our Brides', url: '/real-brides' },
  { label: 'Accessories', url: '/accessories' },
  { label: 'Gift Cards', url: '/gift-card' },
  { label: 'Events', url: '/events' },
  { label: 'Journal', url: '/journal' },
  { label: 'About Angelo', url: '/about' },
  { label: 'Your Appointment', url: '/your-appointment' },
]

/**
 * Not in the reference footer, which has a single Explore column. Kept so the
 * boutique can add a second column from the admin if they want one.
 */
export const FOOTER_HELP: { label: string; url: string }[] = []

/** Silhouette entry points shown on the homepage. */
export const SILHOUETTE_LINKS = [
  { label: 'A-Line', url: '/dresses/a-line' },
  { label: 'Ballgown', url: '/dresses/ballgown' },
  { label: 'Mermaid & Fitted', url: '/dresses/mermaid-fitted' },
  { label: 'Minimal', url: '/dresses/minimal' },
  { label: 'Sleeves', url: '/dresses/sleeves' },
  { label: 'Plus Size', url: '/dresses/plus-size' },
]

export const HOMEPAGE = {
  hero: {
    eyebrow: 'Award-winning bridal boutique · Dublin',
    heading: 'Your dress. Your moment.',
    description: 'A private, personal bridal experience created around you.',
    buttons: [
      { label: 'Book an appointment', url: '/your-appointment' },
      { label: 'Explore wedding dresses', url: '/dresses' },
    ],
  },
  story: {
    eyebrow: 'The Angelo experience',
    heading: 'More than a dress. A feeling you’ll remember.',
    description:
      'Welcome to Angelo Bridal, an award-winning bridal boutique in Dublin. Our experienced consultants pair genuine warmth with designer expertise, private appointments and in-house alterations—so every step feels considered.',
    button: { label: 'Discover our story', url: '/about' },
  },
  designers: {
    eyebrow: 'Designer collections',
    heading: 'Discover our designers',
  },
  silhouettes: {
    eyebrow: 'Curated for you',
    heading: 'Find the silhouette that feels like yours.',
    link: { label: 'View all dresses', url: '/dresses' },
  },
  mostLoved: {
    eyebrow: 'Saved again and again',
    heading: 'Most loved',
    link: { label: 'The full collection', url: '/dresses' },
  },
  experience: {
    eyebrow: 'Private · Personal · Unhurried',
    heading: 'The Angelo experience',
    description:
      'From your first appointment through fittings and in-house alterations, our senior bridal team is with you.',
    buttons: [
      { label: 'Discover the experience', url: '/your-appointment' },
      { label: 'Book an appointment', url: '/your-appointment' },
    ],
  },
  sampleSale: {
    eyebrow: 'Sample sale & off the rack',
    heading: 'Your dress, ready sooner.',
    description:
      'Explore current sample-sale opportunities and Sunday walk-ins. Availability is confirmed by our boutique team.',
    link: { label: 'Explore sample sale', url: '/dresses/sample-sale' },
  },
  search: {
    eyebrow: 'Find your dress',
    heading: 'Search the collection, your way.',
    description:
      'Search by name or designer, then refine by verified silhouette, style, features, fabric and boutique sample information.',
    button: { label: 'Find your dress', url: '/dresses' },
  },
  brides: {
    eyebrow: 'Real Angelo brides',
    heading: 'Stories of yes.',
    link: { label: 'Meet our brides', url: '/real-brides' },
    quote: 'The details are not just the details. They make the design.',
    attribution: 'Angelo Bridal · Dublin',
  },
  award: {
    eyebrow: 'Recognised · Reviewed · Recommended',
    heading: 'Bridal Boutique of the Year 2026',
    description:
      'Visit the current verified Google Reviews profile and discover why brides trust Angelo with one of life’s most meaningful choices.',
  },
  journal: {
    eyebrow: 'The bridal journal',
    heading: 'Notes for the journey.',
    link: { label: 'Read the journal', url: '/journal' },
  },
  instagram: {
    eyebrow: 'Follow the Angelo Bridal story',
    heading: 'From the boutique, with love.',
  },
  finalCta: {
    eyebrow: 'Your appointment awaits',
    heading: 'Begin your bridal journey.',
    buttons: [
      { label: 'Book an appointment', url: '/your-appointment' },
      { label: 'Contact the boutique', url: '/contact' },
    ],
  },
}

export const ABOUT = {
  hero: {
    eyebrow: 'About Angelo Bridal',
    heading: 'Warmth, expertise and beautiful detail.',
    description:
      'An award-winning bridal boutique in Dublin, with experienced consultants, private appointments and in-house alterations.',
  },
  boutique: {
    eyebrow: 'Dublin 1',
    heading: 'A personal bridal boutique.',
    description:
      'Angelo Bridal brings designer expertise and genuine care together in a relaxed city-centre boutique. The team supports brides from the first appointment through fittings and collection.',
    button: { label: 'Book appointment', url: '/your-appointment' },
  },
  awards: {
    eyebrow: 'Recognised with gratitude',
    heading: 'Awards & accolades.',
    description:
      'Recognition from the Irish wedding community reflects the care, expertise and warmth the Angelo team brings to every appointment.',
    items: [{ title: 'Bridal Boutique of the Year', year: '2026' }],
  },
}

export const ALTERATIONS = {
  hero: {
    eyebrow: 'Angelo Bridal alterations',
    heading: 'Perfected for you.',
    description:
      'Expert bridal alterations and thoughtful gown customisation, shaped around the dress you have chosen.',
    buttons: [
      { label: 'Enquire about alterations', url: '#alterations-enquiry' },
      { label: 'Contact our team', url: '/contact' },
    ],
  },
  intro: {
    eyebrow: 'Expert bridal alterations',
    heading: 'The right fit. The original design respected.',
    description:
      'Every gown is different. Our alterations team begins with the construction, fabric and finish of your dress, then discusses what is both possible and appropriate. Recommendations are made at your fitting; no two alteration plans need to be identical.',
  },
  services: [
    { title: 'Fit refinement', description: 'Adjustments are assessed around your gown, your shape and the original construction.' },
    { title: 'Length & hem', description: 'Length is reviewed with your intended shoes so the gown can move comfortably.' },
    { title: 'Bodice adjustments', description: 'The bodice can be refined where the gown’s structure and fabric allow.' },
    { title: 'Straps & sleeves', description: 'Strap or sleeve work is discussed individually and only where appropriate for the design.' },
    { title: 'Train preparation', description: 'Bustle and train requirements can be reviewed as part of your fitting plan.' },
    { title: 'Customisation', description: 'Possible design changes are considered carefully with the alterations team.' },
  ],
  journey: {
    eyebrow: 'Your fitting journey',
    heading: 'Considered at every stage.',
    description: 'The exact number and timing of fittings depends on the gown and the work required.',
    steps: [
      { title: 'Your first fitting', description: 'We assess the gown on you, discuss the finish you want and agree the work to be considered.' },
      { title: 'Refining the fit', description: 'The alterations team refines the agreed areas while protecting the balance of the original design.' },
      { title: 'Final details', description: 'The fit, movement and finishing details are reviewed ahead of collection.' },
    ],
  },
  enquiry: {
    eyebrow: 'Before you enquire',
    heading: 'Tell us about your gown.',
    description:
      'Share where your gown was purchased and what you would like done, and our alterations team will reply with next steps.',
  },
}

export const APPOINTMENT = {
  hero: {
    eyebrow: 'Your Angelo appointment',
    heading: 'A beautiful beginning.',
    description:
      'From your first conversation to taking your dress home, every stage is calm, personal and considered.',
  },
  journey: {
    eyebrow: 'The journey',
    heading: 'What happens at Angelo.',
    steps: [
      { title: 'Book your appointment', description: 'Choose the visit that fits where you are in your bridal journey.' },
      { title: 'Tell us about your wedding', description: 'Share your date, venue, style, size and the details that matter to you.' },
      { title: 'Meet your consultant', description: 'A trusted senior bridal consultant welcomes you and listens first.' },
      { title: 'Explore your edit', description: 'Your consultant shapes a considered selection from the Angelo collection.' },
      { title: 'Try your dresses', description: 'Take your time in a private, supportive appointment setting.' },
      { title: 'Find the one', description: 'There is no performance—only the moment a dress feels completely yours.' },
      { title: 'Order your gown', description: 'The team explains verified timing, next steps and payment details clearly.' },
      { title: 'In-house alterations', description: 'Your fitting journey respects the construction and character of your gown.' },
      { title: 'Final fitting', description: 'Fit, movement and finishing details are reviewed ahead of collection.' },
      { title: 'Take your dress home', description: 'Leave ready for the next chapter, with the Angelo team still close by.' },
    ],
  },
  form: {
    eyebrow: 'Request a time',
    heading: 'Begin with an appointment.',
    description: 'Tell us when suits and what you are hoping to find. We will confirm by email.',
  },
}

export const CONTACT = {
  hero: {
    eyebrow: 'Dublin 1',
    heading: 'Visit Angelo Bridal',
    description: 'Warmth, expertise and beautiful detail.',
  },
  details: { heading: 'The boutique' },
  form: {
    eyebrow: 'Send a message',
    heading: 'Ask us anything.',
  },
}

export const FAQ_PAGE = {
  hero: {
    eyebrow: 'Helpful answers',
    heading: 'Frequently asked questions',
    description:
      'For questions about appointments, gowns, alterations or visiting the boutique, contact the Angelo Bridal team for current guidance.',
  },
  section: { eyebrow: 'Before your visit', heading: 'Good to know.' },
}

/** The questions published on the reference site, with their answers. */
export const FAQS: { question: string; answer: string; category: string }[] = [
  {
    question: 'Where is Angelo Bridal?',
    answer: '38 Lower Dorset Street, Dublin 1, D01 N8X2.',
    category: 'the-boutique',
  },
  {
    question: 'Do I need an appointment?',
    answer:
      'Bridal appointments can be requested online. Angelo Bridal also currently welcomes Sunday walk-ins from 11am–5pm.',
    category: 'appointments',
  },
  {
    question: 'How do alterations work?',
    answer:
      'Visit the alterations page for guidance based on where your gown was purchased and whether Angelo Bridal is currently holding it.',
    category: 'alterations',
  },
  {
    question: 'When does the gift card expire?',
    answer: 'The current Angelo Bridal eGift card expires 24 months after purchase.',
    category: 'ordering',
  },
  {
    question: 'Can I choose my own gift card amount?',
    answer:
      'Yes. The current gift-card configuration includes an “Other amount” option alongside the listed values.',
    category: 'ordering',
  },
]

export const GIFT_CARDS = {
  hero: {
    eyebrow: 'Angelo Bridal gift cards',
    heading: 'A beautiful gift for the bride-to-be.',
    description: 'Give someone special the freedom to choose something they love from Angelo Bridal.',
  },
  amounts: [25, 50, 100, 150, 200, 500, 1000, 2000],
  expiry: 'Angelo Bridal eGift cards expire 24 months after purchase.',
  personalMessage:
    'An Angelo Bridal gift card gives the recipient the freedom to choose through the boutique’s existing gift-card service. Add a recipient and a personal message before you continue to checkout.',
}

/**
 * Journal article titles published on the reference site.
 *
 * Only titles and categories were available — the article bodies are not on
 * the public pages, so each is seeded as a draft with an empty body for the
 * team to write, rather than inventing bridal advice in the boutique's name.
 */
export const JOURNAL: { title: string; category: string; excerpt: string }[] = [
  {
    title: 'What to bring to your bridal appointment',
    category: 'appointment-advice',
    excerpt: 'What to have with you so your appointment is as useful as it is enjoyable.',
  },
  {
    title: 'The wedding dress styles that celebrate curves',
    category: 'silhouettes',
    excerpt: 'Silhouettes, structure and finish that flatter and feel wonderful to wear.',
  },
  {
    title: 'Satin or lace: finding your texture',
    category: 'fabrics',
    excerpt: 'How fabric changes the way a gown falls, moves and photographs.',
  },
]

export const ASSISTANT_INTRO =
  'Welcome. I can help you choose an appointment, explore real Angelo gowns, or prepare for your visit.'
