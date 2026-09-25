/**
 * PageTransition
 *
 * A restrained route-level lift. Route content must remain opaque throughout
 * navigation: fading the entire page to zero exposes a white frame between
 * the persistent shell and the next route, which reads as a flash on slower
 * devices and during lazy-route resolution.
 */
export default function PageTransition({ children }) {
  // A route wrapper spans the entire page and commonly contains sticky and
  // fixed descendants. Even a small transform promotes a very large raster
  // layer and can expose a stale or blank compositor frame while a lazy route
  // resolves. Navigation feedback belongs to local, owned controls—not the
  // document-sized route tree.
  return (
    <div
      className="dtb-page-transition"
      style={{
        width: '100%',
        minHeight: '100%',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}
