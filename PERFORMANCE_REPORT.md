# Performance Report

**No Lighthouse run, Core Web Vitals measurement, or FPS profiling was
performed as part of this build** — those numbers depend on the actual
deployed environment (hosting, CDN, real images/video once added), and
claiming a score without measuring it would be fabricated. What follows
is what was implemented to support good performance, and what to measure
once deployed.

## Implemented
- **Code splitting**: every route is `React.lazy()`-loaded (`src/App.jsx`);
  Vite's `manualChunks` (see `vite.config.js`) separates `three` +
  `@react-three/fiber`, `vendor` (React/Router), `motion`, and `supabase`
  into their own chunks so the 3D viewer isn't downloaded until a product
  page is visited.
- **Lazy rendering**: scroll-triggered sections use `whileInView` with
  `once: true` so off-screen content doesn't animate/repaint until it's
  needed.
- **Skeleton loaders**: Shop page renders CSS skeleton placeholders while
  product data loads, instead of a blocking spinner.
- **Minimal dependencies**: no UI kit, no CSS framework — hand-written
  CSS keeps the stylesheet small and avoids unused utility classes.
- **Hardware-accelerated animation**: transforms/opacity only (no
  layout-triggering properties) in the tilt, hover, and page-transition
  animations.

## To measure after deployment
- Run Lighthouse (Chrome DevTools or CLI) against the production build
  for real LCP/CLS/INP numbers — these depend heavily on your hosting
  provider and the size of the real product photography/video you add.
- Once real images are added, serve them via Supabase Storage's image
  transformation or a CDN with `srcset`/`loading="lazy"` — the current
  SVG placeholders are trivially small and aren't representative of
  real photography's payload.
- Profile the Three.js viewer's frame rate on a mid-tier mobile device —
  the current procedural geometry is lightweight, but a real, textured
  GLB model will need `<Suspense>` fallback tuning and possibly a
  lower-poly LOD for mobile.
