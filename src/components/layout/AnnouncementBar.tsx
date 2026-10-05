import Link from 'next/link'
import type { HeaderData } from './nav-data'

/**
 * Translucent strip across the very top of the page.
 *
 * Matches the reference: 28px tall (24px on phones), sitting over the hero on
 * a dark wash rather than occupying its own band, with white letter-spaced
 * small caps. The header is offset by exactly this height.
 */
export const AnnouncementBar = ({ announcement }: { announcement: HeaderData['announcement'] }) => {
  if (!announcement) return null

  const content = (
    <span className="block truncate text-center text-[0.5rem] tracking-[0.16em] uppercase md:text-[0.57rem]">
      {announcement.message}
    </span>
  )

  return (
    <div
      className={`absolute inset-x-0 top-0 z-[101] flex h-6 items-center px-2 text-white md:h-7 md:px-8 ${
        announcement.style === 'light' ? 'bg-ink/80' : 'bg-black/30'
      }`}
    >
      <div className="w-full">
        {announcement.url ? (
          <Link href={announcement.url} className="block hover:opacity-80">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  )
}
