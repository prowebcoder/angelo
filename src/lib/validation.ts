import { z } from 'zod'

/**
 * Shared validation schemas.
 *
 * The same schema runs in the browser (React Hook Form) and again on the
 * server inside the action, so a crafted request cannot bypass the rules.
 */

const name = z.string().trim().min(1, 'Required').max(80, 'Too long')
const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, 'Too long')
    .optional()
    .transform((value) => (value ? value : undefined))

const email = z.email('Enter a valid email address').max(160)

/** Permissive on purpose: international formats vary and this is a contact field. */
const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[0-9+()\-.\s]*$/, 'Enter a valid phone number')
  .optional()
  .transform((value) => (value ? value : undefined))

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')
  .optional()
  .transform((value) => (value ? value : undefined))

/**
 * Anti-spam fields present on every form.
 *
 * `botField` is a hidden honeypot — real users never fill it. `renderedAt` is
 * the moment the form mounted; a submission faster than a human could type is
 * rejected. Both are cheap and need no third-party service, and a CAPTCHA
 * provider can be added later without touching the schemas.
 */
export const spamGuardSchema = z.object({
  botField: z.string().max(0, 'Rejected').optional(),
  renderedAt: z.coerce.number().int().nonnegative().optional(),
})

export const MIN_FILL_SECONDS = 2

export const newsletterSchema = spamGuardSchema.extend({
  email,
  consent: z.literal(true, { message: 'Please confirm you would like to receive the letter' }),
  source: z.string().trim().max(60).optional(),
})

export const contactSchema = spamGuardSchema.extend({
  name,
  email,
  phone,
  subject: optionalText(120),
  message: z.string().trim().min(10, 'Please add a little more detail').max(4000),
})

export const appointmentSchema = spamGuardSchema.extend({
  firstName: name,
  lastName: name,
  email,
  phone,
  weddingDate: isoDate,
  venue: optionalText(160),
  appointmentType: z.string().trim().min(1, 'Choose an appointment type').max(120),
  preferredDate: isoDate,
  preferredTime: optionalText(60),
  size: optionalText(60),
  designerPreferences: optionalText(200),
  dressPreferences: optionalText(1000),
  /** Dress IDs carried over from the try-on list. */
  selectedDresses: z.array(z.coerce.number().int().positive()).max(20).optional(),
  message: optionalText(2000),
  marketingConsent: z.coerce.boolean().optional(),
})

export const alterationsSchema = spamGuardSchema.extend({
  firstName: name,
  lastName: name,
  email,
  phone,
  weddingDate: isoDate,
  travelDate: isoDate,
  purchaseLocation: optionalText(160),
  gownStatus: optionalText(120),
  description: z.string().trim().min(10, 'Please describe what you need').max(4000),
})

export type NewsletterInput = z.input<typeof newsletterSchema>
export type ContactInput = z.input<typeof contactSchema>
export type AppointmentInput = z.input<typeof appointmentSchema>
export type AlterationsInput = z.input<typeof alterationsSchema>

/** Result shape every form action returns, so the UI handles one contract. */
export type FormState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> }

/** Flattens Zod issues into `{ field: message }` for inline display. */
export const toFieldErrors = (error: z.ZodError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.')
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}
