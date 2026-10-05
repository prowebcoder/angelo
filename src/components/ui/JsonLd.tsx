type Props = {
  data: Record<string, unknown> | null | undefined
}

/**
 * Emits a JSON-LD script tag.
 *
 * `JSON.stringify` output is escaped so CMS copy containing `</script>` cannot
 * break out of the tag.
 */
export const JsonLd = ({ data }: Props) => {
  if (!data) return null

  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
