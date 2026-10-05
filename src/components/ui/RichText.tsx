import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import { asEditorState, isEmptyRichText } from '@/lib/richtext'

type Props = {
  data: unknown
  className?: string
}

/**
 * Renders a Lexical field from the CMS using the editorial prose styles.
 * Renders nothing for an empty field, so sections never leave blank gaps.
 */
export const RichText = ({ data, className }: Props) => {
  if (isEmptyRichText(data)) return null

  return (
    <LexicalRichText
      data={asEditorState(data)}
      disableContainer
      className={['prose-editorial', className].filter(Boolean).join(' ')}
    />
  )
}
