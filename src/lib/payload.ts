import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

/**
 * Shared Payload instance for server-side reads/writes.
 *
 * `getPayload` memoises per process, so this is safe to call from every
 * request, page and server action.
 */
export const getPayloadClient = async (): Promise<Payload> =>
  getPayload({ config: configPromise })
