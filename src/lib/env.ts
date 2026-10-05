/**
 * Server URL used for canonical links, sitemaps and absolute OG images.
 *
 * Falls back through Vercel's system variable so previews get correct absolute
 * URLs without extra configuration.
 */
export const getServerURL = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

export const absoluteURL = (pathname: string): string =>
  `${getServerURL()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
