import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Taxonomy } from '@/payload-types'
import { JournalGrid } from '@/components/journal/JournalCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { JsonLd } from '@/components/ui/JsonLd'
import { MediaImage } from '@/components/ui/Media'
import { RichText } from '@/components/ui/RichText'
import { Section, SectionHeading } from '@/components/ui/Section'
import { getPostBySlug, getPostSlugs, getPosts, getSiteSettings } from '@/lib/queries'
import { formatDate, readingTimeLabel, truncate } from '@/lib/format'
import { isPopulated, IMAGE_SIZES } from '@/lib/media'
import { plainTextFrom } from '@/lib/richtext'
import { absoluteImage, articleSchema, buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export const generateStaticParams = async () => {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()])
  if (!post) return {}

  return buildMetadata({
    seo: post.seo,
    fallbackTitle: post.title,
    // Fall back to the opening of the article when no summary was written.
    fallbackDescription: post.excerpt ?? truncate(plainTextFrom(post.content), 155),
    fallbackImage: post.featuredImage,
    path: `/journal/${slug}`,
    settings,
    type: 'article',
  })
}

const PostPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const category = isPopulated<Taxonomy>(post.category) ? post.category : null
  const tags = (post.tags ?? []).filter((tag): tag is Taxonomy => isPopulated<Taxonomy>(tag))
  const date = formatDate(post.publishedAt ?? post.createdAt)
  const reading = readingTimeLabel(post.readingTime)

  const more = (await getPosts({ limit: 4, categorySlug: category?.slug }))
    .filter((entry) => entry.id !== post.id)
    .slice(0, 3)

  return (
    <>
      <article>
        <Section spacing="tight">
          <div className="shell-narrow">
            <Breadcrumbs
              crumbs={[
                { name: 'Journal', href: '/journal' },
                ...(category ? [{ name: category.name, href: `/journal?category=${category.slug}` }] : []),
                { name: post.title, href: `/journal/${slug}` },
              ]}
              className="mb-8"
            />

            {category ? <p className="eyebrow">{category.name}</p> : null}
            <h1 className="mt-3 text-h2">{post.title}</h1>

            <p className="mt-5 flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
              {post.author ? <span>{post.author}</span> : null}
              {post.author && date ? <span aria-hidden="true">·</span> : null}
              {date ? <time dateTime={post.publishedAt ?? post.createdAt}>{date}</time> : null}
              {reading ? <span aria-hidden="true">·</span> : null}
              {reading ? <span>{reading}</span> : null}
            </p>

            {post.excerpt ? (
              <p className="mt-6 font-serif text-xl leading-relaxed text-ink-soft md:text-2xl">{post.excerpt}</p>
            ) : null}
          </div>
        </Section>

        <div className="shell">
          <MediaImage
            value={post.featuredImage}
            alt={post.title}
            ratio="landscape"
            sizes={IMAGE_SIZES.full}
            priority
          />
        </div>

        <Section spacing="tight">
          <div className="shell-narrow">
            <RichText data={post.content} />

            {tags.length ? (
              <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="border border-line px-3 py-1.5 text-[0.5625rem] tracking-[0.18em] text-ink-muted uppercase"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Section>
      </article>

      {more.length ? (
        <Section tone="shell">
          <div className="shell">
            <SectionHeading eyebrow="Keep reading" title="More from the journal" className="mb-10" />
            <JournalGrid posts={more} />
          </div>
        </Section>
      ) : null}

      <JsonLd
        data={articleSchema({
          headline: post.title,
          description: post.excerpt,
          image: absoluteImage(post.featuredImage),
          datePublished: post.publishedAt ?? post.createdAt,
          dateModified: post.updatedAt,
          author: post.author,
          url: `/journal/${slug}`,
        })}
      />
    </>
  )
}

export default PostPage
