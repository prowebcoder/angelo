'use server'

import { z } from 'zod'
import { getPayloadClient } from '@/lib/payload'
import { getFormSettings } from '@/lib/queries'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  alterationsSchema,
  appointmentSchema,
  contactSchema,
  MIN_FILL_SECONDS,
  newsletterSchema,
  toFieldErrors,
  type FormState,
} from '@/lib/validation'

const GENERIC_ERROR = 'Something went wrong on our side. Please try again, or call the boutique.'
const RATE_LIMITED = 'That is a few requests in a short time. Please try again shortly.'

/**
 * Rejects submissions that tripped the honeypot or arrived implausibly fast.
 * Returns the same wording as a validation failure so a bot learns nothing.
 */
const failsSpamGuard = (input: { botField?: string; renderedAt?: number }): boolean => {
  if (input.botField) return true
  if (input.renderedAt && Date.now() - input.renderedAt < MIN_FILL_SECONDS * 1000) return true
  return false
}

/** Notification email. Never allowed to fail a submission that was stored. */
const notify = async (subject: string, lines: string[]) => {
  try {
    const [payload, settings] = await Promise.all([getPayloadClient(), getFormSettings()])
    const to = settings.notificationEmail
    if (!to) return

    await payload.sendEmail({
      to,
      subject,
      text: lines.join('\n'),
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6">${lines
        .map((line) => `<p style="margin:0 0 8px">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
        .join('')}</div>`,
    })
  } catch (error) {
    console.error('[forms] notification email failed', error)
  }
}

/**
 * Drops the anti-spam fields before anything is stored.
 *
 * They exist only to judge the submission; keeping them would put a honeypot
 * value and a timestamp on every record for no reason.
 */
const withoutSpamFields = <T extends { botField?: string; renderedAt?: number }>(
  input: T,
): Omit<T, 'botField' | 'renderedAt'> => {
  const data = { ...input }
  delete data.botField
  delete data.renderedAt
  return data
}

const parsed = <Schema extends z.ZodType>(
  schema: Schema,
  raw: unknown,
): { ok: true; data: z.output<Schema> } | { ok: false; state: FormState } => {
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      state: {
        status: 'error',
        message: 'Please check the highlighted fields.',
        fieldErrors: toFieldErrors(result.error),
      },
    }
  }
  return { ok: true, data: result.data }
}

/* -------------------------------------------------------------------------- */
/* Newsletter                                                                 */
/* -------------------------------------------------------------------------- */

export const subscribeToNewsletter = async (raw: unknown): Promise<FormState> => {
  const result = parsed(newsletterSchema, raw)
  if (!result.ok) return result.state

  // Silent success: a bot gets no signal that it was detected.
  if (failsSpamGuard(result.data)) return { status: 'success', message: 'Thank you — you are on the list.' }

  const limit = await checkRateLimit('newsletter', { limit: 5, windowSeconds: 600 })
  if (!limit.ok) return { status: 'error', message: RATE_LIMITED }

  try {
    const payload = await getPayloadClient()
    const email = result.data.email.toLowerCase()

    const existing = await payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      // Re-subscribing an unsubscribed address should simply work again.
      if (existing.docs[0].status !== 'subscribed') {
        await payload.update({
          collection: 'newsletter-subscribers',
          id: existing.docs[0].id,
          data: { status: 'subscribed', consent: true },
          overrideAccess: true,
        })
      }
      return { status: 'success', message: 'You are already on the list — thank you.' }
    }

    await payload.create({
      collection: 'newsletter-subscribers',
      data: { email, consent: true, source: result.data.source ?? 'website', status: 'subscribed' },
      overrideAccess: true,
    })

    return { status: 'success', message: 'Thank you — you are on the list.' }
  } catch (error) {
    console.error('[forms] newsletter', error)
    return { status: 'error', message: GENERIC_ERROR }
  }
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export const submitContact = async (raw: unknown): Promise<FormState> => {
  const result = parsed(contactSchema, raw)
  if (!result.ok) return result.state
  if (failsSpamGuard(result.data)) return { status: 'success', message: 'Thank you — we will be in touch.' }

  const limit = await checkRateLimit('contact', { limit: 4, windowSeconds: 900 })
  if (!limit.ok) return { status: 'error', message: RATE_LIMITED }

  try {
    const payload = await getPayloadClient()
    const { name, email, phone, subject, message } = result.data

    await payload.create({
      collection: 'contact-submissions',
      data: { name, email, phone, subject, message, status: 'new' },
      overrideAccess: true,
    })

    await notify(`Contact enquiry — ${name}`, [
      `<strong>${name}</strong> sent a message.`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      subject ? `Subject: ${subject}` : '',
      '',
      message,
    ].filter(Boolean))

    return { status: 'success', message: 'Thank you — your message has reached the boutique.' }
  } catch (error) {
    console.error('[forms] contact', error)
    return { status: 'error', message: GENERIC_ERROR }
  }
}

/* -------------------------------------------------------------------------- */
/* Appointment                                                                */
/* -------------------------------------------------------------------------- */

export const submitAppointment = async (raw: unknown): Promise<FormState> => {
  const result = parsed(appointmentSchema, raw)
  if (!result.ok) return result.state
  if (failsSpamGuard(result.data)) {
    return { status: 'success', message: 'Thank you — we will confirm your appointment by email.' }
  }

  const limit = await checkRateLimit('appointment', { limit: 4, windowSeconds: 900 })
  if (!limit.ok) return { status: 'error', message: RATE_LIMITED }

  try {
    const payload = await getPayloadClient()
    const { selectedDresses, ...data } = withoutSpamFields(result.data)

    const created = await payload.create({
      collection: 'appointments',
      data: {
        ...data,
        marketingConsent: Boolean(data.marketingConsent),
        selectedDresses: selectedDresses?.length ? selectedDresses : undefined,
        status: 'new',
      },
      overrideAccess: true,
    })

    // Resolve the try-on list to names so staff can prepare the gowns.
    let dressLine = ''
    if (selectedDresses?.length) {
      const { docs } = await payload.find({
        collection: 'dresses',
        where: { id: { in: selectedDresses } },
        depth: 0,
        limit: selectedDresses.length,
        overrideAccess: true,
        select: { name: true },
      })
      if (docs.length) dressLine = `Try-on list: ${docs.map((dress) => dress.name).join(', ')}`
    }

    await notify(`Appointment request — ${data.firstName} ${data.lastName}`, [
      `<strong>${data.firstName} ${data.lastName}</strong> requested an appointment.`,
      `Type: ${data.appointmentType}`,
      `Email: ${data.email}`,
      data.phone ? `Phone: ${data.phone}` : '',
      data.preferredDate ? `Preferred date: ${data.preferredDate}` : '',
      data.preferredTime ? `Preferred time: ${data.preferredTime}` : '',
      data.weddingDate ? `Wedding date: ${data.weddingDate}` : '',
      data.venue ? `Venue: ${data.venue}` : '',
      data.size ? `Size: ${data.size}` : '',
      data.designerPreferences ? `Designers: ${data.designerPreferences}` : '',
      dressLine,
      data.dressPreferences ? `Preferences: ${data.dressPreferences}` : '',
      data.message ? `Message: ${data.message}` : '',
      `Reference: #${created.id}`,
    ].filter(Boolean))

    return {
      status: 'success',
      message: 'Thank you — your request is with the boutique and we will confirm by email.',
    }
  } catch (error) {
    console.error('[forms] appointment', error)
    return { status: 'error', message: GENERIC_ERROR }
  }
}

/* -------------------------------------------------------------------------- */
/* Alterations                                                                */
/* -------------------------------------------------------------------------- */

export const submitAlterationsEnquiry = async (raw: unknown): Promise<FormState> => {
  const result = parsed(alterationsSchema, raw)
  if (!result.ok) return result.state
  if (failsSpamGuard(result.data)) return { status: 'success', message: 'Thank you — we will be in touch.' }

  const limit = await checkRateLimit('alterations', { limit: 4, windowSeconds: 900 })
  if (!limit.ok) return { status: 'error', message: RATE_LIMITED }

  try {
    const payload = await getPayloadClient()
    const data = withoutSpamFields(result.data)

    const created = await payload.create({
      collection: 'alteration-enquiries',
      data: { ...data, status: 'new' },
      overrideAccess: true,
    })

    await notify(`Alterations enquiry — ${data.firstName} ${data.lastName}`, [
      `<strong>${data.firstName} ${data.lastName}</strong> sent an alterations enquiry.`,
      `Email: ${data.email}`,
      data.phone ? `Phone: ${data.phone}` : '',
      data.weddingDate ? `Wedding date: ${data.weddingDate}` : '',
      data.travelDate ? `Travel date: ${data.travelDate}` : '',
      data.purchaseLocation ? `Purchased at: ${data.purchaseLocation}` : '',
      data.gownStatus ? `Gown status: ${data.gownStatus}` : '',
      '',
      data.description,
      `Reference: #${created.id}`,
    ].filter(Boolean))

    return { status: 'success', message: 'Thank you — our alterations team will reply with next steps.' }
  } catch (error) {
    console.error('[forms] alterations', error)
    return { status: 'error', message: GENERIC_ERROR }
  }
}
