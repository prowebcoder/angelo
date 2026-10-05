/**
 * "View the website" link, pinned above the admin navigation.
 *
 * Staff edit a page and then want to see it. Without this they have to know
 * the site's address and type it, or hunt for the preview button on whichever
 * document happens to be open — so it sits at the top of every admin screen
 * and opens in a new tab, leaving their work where it was.
 */
const ViewSite = () => (
  <a href="/" target="_blank" rel="noopener noreferrer" className="angelo-view-site">
    <span>View the website</span>
    {/* Decorative: the link text already says where this goes. */}
    <span aria-hidden="true" style={{ opacity: 0.6 }}>
      ↗
    </span>
  </a>
)

export default ViewSite
