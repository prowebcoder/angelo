import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import '../globals.css'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SavedListsProvider } from '@/components/dresses/SavedListsProvider'
import { AskAngelo } from '@/components/assistant/AskAngelo'
import { JsonLd } from '@/components/ui/JsonLd'
import { getSiteSettings } from '@/lib/queries'
import { getServerURL } from '@/lib/env'
import { localBusinessSchema, organizationSchema } from '@/lib/seo'
import { resolveMedia } from '@/lib/media'

/** Content is cached and refreshed in the background; CMS edits bust the tag. */
export const revalidate = 3600

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fcfaf7',
}

/**
 * Site-wide metadata defaults.
 *
 * `metadataBase` lets every page use relative canonical paths and still emit
 * absolute URLs. Titles from pages are slotted into the template.
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const settings = await getSiteSettings()
  const favicon = resolveMedia(settings.branding?.favicon)

  return {
    metadataBase: new URL(getServerURL()),
    title: {
      default: settings.seo?.defaultTitle ?? 'Angelo Bridal',
      template: '%s | Angelo Bridal',
    },
    description: settings.seo?.defaultDescription ?? undefined,
    icons: favicon?.url ? { icon: favicon.url } : undefined,
    openGraph: { siteName: 'Angelo Bridal', locale: 'en_IE', type: 'website' },
    formatDetection: { telephone: false },
  }
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const settings = await getSiteSettings()
  const analytics = settings.seo

  /*
   * `data-scroll-behavior` tells Next the smooth scrolling in `globals.css`
   * is deliberate, so it suppresses it during route changes — a new page
   * should arrive at the top, not glide there.
   */
  return (
    <html lang="en-IE" data-scroll-behavior="smooth">
      <body className="flex min-h-svh flex-col">
        {/* Keyboard users can jump past the header and mega menu. */}
        <a
          href="#main"
          className="sr-only-focusable fixed top-3 left-3 z-[100] bg-ink px-4 py-3 text-[0.6875rem] tracking-[0.18em] text-on-ink uppercase"
        >
          Skip to content
        </a>

        <SavedListsProvider>
          <SiteHeader />

          <main id="main" className="flex-1">
            {children}
          </main>

          <SiteFooter />

          {/* Loaded after the page so the assistant never delays first paint. */}
          <Suspense fallback={null}>
            <AskAngelo />
          </Suspense>
        </SavedListsProvider>

        <JsonLd data={organizationSchema(settings)} />
        <JsonLd data={localBusinessSchema(settings)} />

        {/*
          Analytics IDs are set in Site settings, so marketing can change them
          without a release. Nothing loads until an ID exists, and each tag is
          deferred until the page is interactive.
        */}
        {analytics?.googleTagManagerID ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.googleTagManagerID}');`}
          </Script>
        ) : null}

        {analytics?.googleAnalyticsID && !analytics.googleTagManagerID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsID}');`}
            </Script>
          </>
        ) : null}

        {analytics?.metaPixelID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.metaPixelID}');fbq('track','PageView');`}
          </Script>
        ) : null}
      </body>
    </html>
  )
}

export default RootLayout
