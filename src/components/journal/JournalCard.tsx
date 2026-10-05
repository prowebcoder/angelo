import Link from 'next/link'
import type { Post, Taxonomy } from '@/payload-types'
import { MediaImage } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { formatDate, readingTimeLabel, truncate } from '@/lib/format'
import { isPopulated } from '@/lib/media'
import { IMAGE_SIZES } from '@/lib/media'

const categoryName = (post: Post): string | null =>
  isPopulated<Taxonomy>(post.category) ? post.category.name : null

export const JournalCard = ({
  post,
  priority = false,
  sizes = IMAGE_SIZES.tile,
}: {
  post: Post
  priority?: boolean
  sizes?: string
}) => {
  const category = categoryName(post)
  const date = formatDate(post.publishedAt ?? post.createdAt)
  const reading = readingTimeLabel(post.readingTime)

  return (
    <article className="group relative flex flex-col">
      <Link href={`/journal/${post.slug}`} className="block" tabIndex={-1} aria-hidden="true">
        <MediaImage
          value={post.featuredImage}
          alt={post.title}
          ratio="landscape"
          sizes={sizes}
          priority={priority}
          hoverZoom
        />
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        {category ? (
          <p className="text-[0.625rem] font-medium tracking-[0.18em] text-taupe uppercase">{category}</p>
        ) : null}

        <h3 className="mt-2 font-serif text-[1.5rem] leading-snug">
          <Link href={`/journal/${post.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{truncate(post.excerpt, 150)}</p>
        ) : null}

        <p className="mt-4 flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
          {date ? <time dateTime={post.publishedAt ?? post.createdAt}>{date}</time> : null}
          {date && reading ? <span aria-hidden="true">·</span> : null}
          {reading ? <span>{reading}</span> : null}
        </p>
      </div>
    </article>
  )
}

export const JournalGrid = ({
  posts,
  columns = 3,
  emptyMessage = 'The first journal entries are on their way.',
}: {
  posts: Post[]
  columns?: 2 | 3
  emptyMessage?: string
}) => {
  if (!posts.length) {
    return <p className="py-16 text-center text-ink-muted">{emptyMessage}</p>
  }

  return (
    <ul className={`grid gap-x-6 gap-y-12 ${columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {posts.map((post, index) => (
        <li key={post.id}>
          <Reveal delay={Math.min(index, 5) * 70}>
            <JournalCard post={post} priority={index < 3} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
