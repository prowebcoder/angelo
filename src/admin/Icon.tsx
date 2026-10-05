/**
 * The mark in the corner of the admin header.
 *
 * The slot is a ~22px square, where the full wordmark would be an unreadable
 * smear — so this is the initial alone, drawn as an SVG in the brand serif
 * with the rule that sits under the logotype. Being a drawing rather than an
 * image it stays crisp at any size and follows the theme, since `currentColor`
 * resolves to whatever Payload has set for the header.
 */
const Icon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    role="img"
    aria-label="Angelo Bridal"
    style={{ display: 'block' }}
  >
    <text
      x="11"
      y="14.5"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="15"
      letterSpacing="0.02em"
    >
      A
    </text>
    <rect x="3.5" y="18" width="15" height="1" fill="currentColor" opacity="0.55" />
  </svg>
)

export default Icon
