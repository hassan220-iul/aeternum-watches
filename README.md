# Aeternum Watches

An ultra-premium luxury watch e-commerce platform, built with React + Vite,
Supabase, Framer Motion, and React Three Fiber.

## Quick Start

```bash
npm install
cp .env.example .env   # then fill in your Supabase project details
npm run dev
```

The app runs fully without Supabase configured — it falls back to a local
mock catalog (`src/data/mockProducts.js`) so you can review the UI
immediately. Connect Supabase (see below) to unlock accounts, real orders,
the admin dashboard's live data, and notifications.

## What's fully implemented

- **Storefront**: Home, Shop (search/filter/sort/pagination), Product
  Details (gallery + React Three Fiber 3D viewer), Categories, Collections,
  Wishlist, Cart (coupon codes, quantity editing), multi-step Checkout,
  Order Confirmation, Order Tracking, all legal/info pages.
- **Accounts**: Login/Register via Supabase Auth, user Dashboard (orders,
  wishlist, loyalty points, VIP status).
- **Admin Dashboard**: Overview (live analytics), Products (full CRUD +
  duplicate + bulk delete + categories management + variants + image
  upload to Supabase Storage + inventory tracking with a movement log +
  low-stock flags), Orders (status management + a dedicated Refund
  Requests tab with approve/deny), Customers (search/VIP filter + a
  profile drawer showing purchase history + VIP/role toggles), Analytics
  (chart + CSV export, daily/weekly/monthly/yearly ranges), Invoices
  (sequential INV-000001 numbering + manual "Generate Invoice" for
  completed orders that don't have one yet), Settings (store settings
  panel, promote/demote admins, activity log wired to real actions).
- **Supabase**: complete schema (`supabase/schema.sql`) with 20 tables,
  triggers (auto-profile-on-signup, auto-invoice-on-completion, low-stock
  and new-order and refund-request notifications, rating aggregation,
  refund-approval → order status sync), a public `product-images` Storage
  bucket, and Row Level Security on every table.
- **Design**: black/gold/silver luxury design system, Playfair Display +
  Inter, glassmorphism cards, cinematic hero, scroll-reveal animations,
  3D product-card tilt, a signature scroll-progress "watch dial."

## What's scaffolded but needs your input to go live

Being upfront about this so it doesn't surprise you in production:

- **WhatsApp notifications**: the code path is complete
  (`src/services/whatsappService.js` → Supabase Edge Function →
  Meta Cloud API), but it needs *your* WhatsApp Business API credentials
  to actually send messages. Until then it logs to the console instead.
  See `DEPLOYMENT_GUIDE.md`.
- **Payments**: checkout collects shipping/delivery details and creates
  the order record, but there's no payment processor wired in. Add
  Stripe (or similar) at the "Place Order" step in `src/pages/Checkout.jsx`.
- **Product photography / video / 3D scans**: this build uses generated
  SVG placeholders and a procedural Three.js watch model, since no real
  assets were provided. Swap them for real photography and GLB scans —
  see the comments in `WatchIllustration.jsx`, `Hero.jsx`, and
  `WatchViewer.jsx`.
- **Performance/SEO/accessibility scores**: see the four `*_REPORT.md`
  files — they describe what's implemented, not a measured score, since
  no score can be claimed without actually running Lighthouse/axe against
  a deployed build.

## Connecting Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy your Project URL and anon key into `.env`.
4. To send real WhatsApp notifications, deploy the Edge Function in
   `supabase/functions/send-whatsapp-notification` — see
   `DEPLOYMENT_GUIDE.md` for exact commands.
5. Promote your own account to admin:
   `update profiles set role = 'admin' where email = 'you@example.com';`

## Tech Stack

React 18 · Vite 5 · React Router 6 · Context API · Supabase (Auth,
Postgres, Storage, Realtime) · Framer Motion · Three.js / React Three
Fiber · Recharts (admin analytics). No TypeScript, no Next.js, no
Tailwind, no Redux, per project requirements.

## Project Structure

```
src/
  assets/        static illustration assets
  components/    layout, common, three, home, product, checkout, admin
  context/       Auth / Cart / Wishlist / Notification providers
  hooks/         useScrollReveal
  services/      supabaseClient, products/orders/analytics/whatsapp
  animations/    shared Framer Motion variants
  utils/         currency + invoice formatting
  pages/         one file per route, admin/ for the dashboard
supabase/
  schema.sql     tables, indexes, triggers, functions, RLS
  seed.sql       starter catalog + discount codes
  functions/     send-whatsapp-notification Edge Function
```
