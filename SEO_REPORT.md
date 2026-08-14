# SEO Report

## Implemented
- **Meta tags**: title, description, canonical URL in `index.html`.
- **Open Graph + Twitter Cards**: configured for the homepage; since this
  is a client-rendered SPA, per-page OG tags (e.g. per product) would
  need either prerendering or a small SSR/edge-function layer to update
  `<head>` server-side — React Router alone can't change meta tags before
  a crawler that doesn't execute JS sees the page.
- **Structured data**: JSON-LD `Organization` schema in `index.html`.
  Product-level `Product`/`Offer` schema should be added per product page
  once real product data and images are live (template it in
  `ProductDetails.jsx`).
- **robots.txt** and **sitemap.xml** in `/public`, listing all public
  routes and disallowing `/admin`, `/dashboard`, `/checkout`.
- **Semantic HTML**: proper heading hierarchy (`h1` per page, `h2` per
  section), `<nav>` landmarks with `aria-label`s that also help SEO
  crawlers understand page structure.

## Not implemented / needs a decision
- **Server-side rendering or prerendering**: this is a client-rendered
  Vite SPA. For the best organic search performance, consider prerendering
  key pages (Home, Shop, each Product) at build time, or moving to a
  framework with SSR if SEO is a primary channel — that's a larger
  architectural decision outside a like-for-like React+Vite rebuild.
- **Per-page dynamic meta tags**: would need a small head-management
  library (e.g. react-helmet-async) wired into each page component to
  update title/description/OG image per product/category.
