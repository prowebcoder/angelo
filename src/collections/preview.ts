const serverURL = () => process.env.NEXT_PUBLIC_SERVER_URL ?? ''

/**
 * Preview links for the admin.
 *
 * Both the "Preview" button and the live-preview pane point at
 * `/preview/<collection>/<slug>`, a dynamic route that checks the editor's
 * Payload session and reads the newest version of the document.
 *
 * Deliberately not the public URL: public pages are statically rendered from
 * published content only, so they would show the last published version
 * rather than the draft being edited.
 */
export const previewConfig = (collection: string) => ({
  livePreview: {
    url: ({ data }: { data: Record<string, unknown> }) =>
      `${serverURL()}/preview/${collection}/${(data?.slug as string) ?? ''}`,
  },
  preview: (doc: Record<string, unknown>) =>
    `${serverURL()}/preview/${collection}/${(doc?.slug as string) ?? ''}`,
})
