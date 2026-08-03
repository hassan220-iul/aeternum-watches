# Changelog

## v1.0.0 — Initial Build

### Added
- Full Vite + React storefront: Home, Shop, Product Details, Categories,
  Collections, Wishlist, Cart, Checkout, Order Confirmation, Order
  Tracking, About, Contact, FAQ, Privacy, Terms, Shipping, Returns.
- Auth pages (Login/Register) wired to Supabase Auth.
- User Dashboard with orders, wishlist, loyalty points, VIP status.
- Admin Dashboard: Overview, Products (CRUD + duplicate + bulk delete),
  Orders, Customers, Analytics (chart + CSV export), Invoices, Settings.
- Context API providers: Auth, Cart, Wishlist, Notifications.
- Supabase schema with 17 tables, triggers, functions, and RLS policies.
- WhatsApp notification architecture (client service → Edge Function →
  Meta Cloud API).
- Framer Motion animation system: page transitions, scroll reveals,
  stagger grids, 3D product-card tilt.
- React Three Fiber procedural watch viewer.
- SEO: meta tags, Open Graph, Twitter Cards, JSON-LD, sitemap.xml,
  robots.txt.
- Accessibility: skip link, ARIA labels on icon buttons/toggles, focus
  states, reduced-motion support, semantic landmarks.

### Known Gaps (see README "What's scaffolded")
- No payment processor integrated in Checkout.
- WhatsApp messages require the operator's own Meta Business API
  credentials to send live.
- Product photography, hero video, and 3D scans are placeholders.
- Order Tracking's live status lookup requires a connected Supabase
  project; the UI currently previews the timeline shape only.
