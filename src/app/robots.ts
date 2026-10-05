import type { MetadataRoute } from 'next'
import { absoluteURL, getServerURL } from '@/lib/env'

/**
 * robots.txt
 *
 * The admin, Payload's API and personal or results pages are kept out of the
 * index. Preview URLs are disallowed so a draft cannot be crawled through a
 * shared link.
 *
 * Non-production hosts are closed entirely, so a staging deployment cannot
 * compete with the live site in search results.
 */
const robots = (): MetadataRoute.Robots => {
  const isProduction = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production' && !getServerURL().includes('localhost')

  if (!isProduction) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/graphql', '/next/', '/search', '/wishlist', '/preview'],
      },
    ],
    sitemap: absoluteURL('/sitemap.xml'),
    host: getServerURL(),
  }
}

export default robots
