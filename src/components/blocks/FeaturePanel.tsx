import { MediaImage } from '@/components/ui/Media'
import { ButtonLink } from '@/components/ui/Button'
import { IMAGE_SIZES } from '@/lib/media'
import { type BlockOf, usableLink } from './types'

/**
 * Full-bleed photograph with copy laid over it.
 *
 * The reference uses this shape twice on the homepage — once for the
 * appointment film and once for the sample sale — with the only differences
 * being height, crop and how hard the scrim falls. So it is one block with
 * those as fields rather than two near-identical ones.
 *
 * The scrim is a horizontal gradient rather than a flat overlay: it darkens
 * the side the copy sits on and leaves the rest of the photograph alone.
 */
const HEIGHTS = {
  tall: 'h-[92svh] min-h-[680px]',
  medium: 'h-[85svh] min-h-[650px]',
  short: 'h-[62svh] min-h-[460px]',
} as const

const CROPS = {
  top: 'center 20%',
  upper: 'center 30%',
  centre: 'center 50%',
} as const

export const FeaturePanelBlock = ({ block }: { block: BlockOf<'feature-panel'> }) => {
  const buttons = (block.buttons ?? []).map((button) => ({ ...button })).filter((button) => button.url)
  const height = HEIGHTS[block.height ?? 'medium']
  const crop = CROPS[block.crop ?? 'upper']
  const strong = block.scrim === 'strong'

  return (
    <section className={`relative overflow-hidden bg-[#1b1a18] text-white ${height}`}>
      <div className="absolute inset-0">
        <MediaImage
          value={block.image}
          alt={block.heading ?? ''}
          ratio="none"
          sizes={IMAGE_SIZES.full}
          className="h-full w-full"
          imageClassName="h-full w-full"
          objectPosition={crop}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: strong
            ? 'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(0,0,0,0) 65%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.08))',
        }}
      />

      {/* Copy sits bottom-left, inset by the reference's fluid margins. */}
      <div
        className="absolute z-[2] max-w-[520px]"
        style={{ bottom: 'clamp(2rem, 8vw, 6rem)', left: 'clamp(1.2rem, 7vw, 7rem)', right: 'clamp(1.2rem, 7vw, 7rem)' }}
      >
        {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
        {block.heading ? <h2 className="mt-3 text-h2-sm">{block.heading}</h2> : null}
        {block.description ? (
          <p className="mt-4 max-w-[470px] text-[0.9375rem] leading-relaxed text-white/85">
            {block.description}
          </p>
        ) : null}
        {buttons.length ? (
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
            {buttons.map((button, index) => (
              <ButtonLink
                key={button.id ?? `${button.url}-${index}`}
                href={button.url}
                variant={index === 0 ? 'inverse' : 'ghost'}
                className={index === 0 ? '' : 'text-white decoration-white/40'}
              >
                {button.label}
              </ButtonLink>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/**
 * Two-up panel: a photograph beside copy on a tinted ground.
 *
 * The reference's "Search the collection, your way" section — a `1.2fr 1fr`
 * grid at `88vh`, ivory ground, generous `7vw` padding. Full-bleed rather
 * than inside the page gutter, which is what separates it from the ordinary
 * image-and-text section.
 */
export const SplitPanelBlock = ({ block }: { block: BlockOf<'split-panel'> }) => {
  const button = usableLink(block.button)
  const imageFirst = (block.imageSide ?? 'right') === 'left'

  return (
    <section
      className={`grid min-h-[88vh] bg-ivory lg:grid-cols-[1.2fr_1fr] ${
        imageFirst ? '' : 'lg:[&>*:first-child]:order-2'
      }`}
    >
      <div className="relative min-h-[70vh]">
        <MediaImage
          value={block.image}
          alt={block.heading ?? ''}
          ratio="none"
          sizes={IMAGE_SIZES.half}
          className="h-full w-full"
          imageClassName="h-full w-full"
        />
      </div>

      <div
        className="flex flex-col items-start justify-center"
        style={{ padding: 'clamp(2rem, 7vw, 7rem)' }}
      >
        {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
        {block.heading ? <h2 className="mt-3 text-h2-sm">{block.heading}</h2> : null}
        {block.description ? (
          <p className="mt-4 max-w-[470px] text-[0.9375rem] leading-relaxed text-ink-soft">
            {block.description}
          </p>
        ) : null}
        {button ? (
          <ButtonLink href={button.url} className="mt-8">
            {button.label}
          </ButtonLink>
        ) : null}
      </div>
    </section>
  )
}

/**
 * Centred statement on a dark ground.
 *
 * The reference's recognition section: very generous padding, one short
 * paragraph capped at 650px, one link. Distinct from the call-to-action block
 * in proportion rather than content, which is why it is its own layout.
 */
export const StatementBlock = ({ block }: { block: BlockOf<'statement'> }) => {
  const button = usableLink(block.button)

  return (
    <section
      className="bg-[#111] text-center text-white"
      style={{ padding: 'clamp(4rem, 12vw, 11rem) clamp(1.2rem, 7vw, 7rem)' }}
    >
      {block.eyebrow ? <p className="eyebrow">{block.eyebrow}</p> : null}
      {block.heading ? <h2 className="mx-auto mt-4 max-w-4xl text-h2-sm">{block.heading}</h2> : null}
      {block.description ? (
        <p className="mx-auto mt-8 max-w-[650px] text-[0.9375rem] leading-relaxed text-[#d8d4cc]">
          {block.description}
        </p>
      ) : null}
      {button ? (
        <div className="mt-8">
          <ButtonLink href={button.url} variant="ghost" className="text-white decoration-white/40">
            {button.label}
          </ButtonLink>
        </div>
      ) : null}
    </section>
  )
}
