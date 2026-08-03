# Deployment Guide

## 1. Install & run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## 2. Supabase setup

1. Create a project at https://supabase.com.
2. Open the SQL editor and run, in order:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
3. In Project Settings → API, copy the **Project URL** and **anon public
   key** into `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
4. Enable email auth under Authentication → Providers (enabled by
   default on new projects).
5. Promote yourself to admin after registering an account:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```

## 3. WhatsApp notifications (real delivery)

The frontend never talks to Meta's API directly — the access token can't
safely live in browser code. Instead:

1. Create a Meta App with WhatsApp Business enabled, and get:
   - A permanent access token
   - Your WhatsApp Phone Number ID
2. Install the Supabase CLI, then from the project root:
   ```bash
   supabase functions deploy send-whatsapp-notification
   supabase secrets set WHATSAPP_ACCESS_TOKEN=your-token
   supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   ```
3. Set `VITE_WHATSAPP_RECIPIENT` in `.env` to the number that should
   receive admin alerts (e.g. `96170674606`).
4. Test it: trigger any event that calls
   `sendWhatsAppNotification(...)` (e.g. submit the Contact form) and
   confirm the message arrives.

Until this is set up, the app runs fine — notifications just log to the
console instead of sending (see `src/services/whatsappService.js`).

## 4. Payments — Whish Money, Cash on Delivery, and Stripe

Three payment methods are built in, shown as a choice at checkout:

- **Whish Money** — the default/primary option. There's no public merchant
  API for Whish Money, so this works the way most Lebanese stores actually
  do it: the customer transfers to your Whish Money number, enters the
  transfer's confirmation code at checkout, and the order is placed with
  `payment_status = 'awaiting_verification'`. You get a WhatsApp alert (once
  WhatsApp notifications are set up — see §3), check your Whish Money
  account for the matching transfer, then click **Confirm Payment** on that
  order in Admin → Orders. Set your receiving name/phone in
  Admin → Settings → Store Settings.
- **Cash on Delivery** — order is placed immediately, `payment_status`
  stays `unpaid` until you click **Confirm Payment** once the courier has
  collected cash.
- **Stripe (card)** — fully automated, see below. Optional — the store
  works without it if Whish Money / COD cover your customers.

- **Whish Money — Manual Transfer** — always available, no setup needed.
  Customer transfers to your Whish number, enters the confirmation code,
  order is placed as `awaiting_verification`, you confirm it manually.
- **Whish Money — Pay by Visa/Card** — customer pays by card on a Whish
  Money hosted page, no manual transfer needed. This goes through a
  third-party gateway (`pay.codnloc.com`) that wraps Whish Money for
  merchants — **it is not Whish Money itself**, so read
  https://pay.codnloc.com/terms.html and judge its trustworthiness
  yourself before relying on it for real transactions. Setup:
  1. Create an account at https://pay.codnloc.com
  2. Copy your **API Secret** (gear icon → account settings)
  3. ```bash
     supabase secrets set CODNLOC_WHISH_SECRET=your_secret_token
     supabase secrets set CODNLOC_WHISH_WEBSITE=your-live-domain.com
     supabase functions deploy create-whish-payment-session
     ```
  4. **Important:** the automatic payment-confirmation webhook
     (`whish-payment-callback`) is a best-effort stub — codnloc's public
     docs mention callbacks exist but don't publish the exact payload
     format. Message their support (WhatsApp +961 3 687 150) to get the
     real format before trusting it alone. Until then, keep using the
     manual **Confirm Payment** button in Admin → Orders for these orders
     — it always works regardless of the webhook.
- **Cash on Delivery** — always available, no setup needed. Confirm
  payment manually once the courier collects cash.

### Stripe setup (optional)

Stripe Checkout is already wired into the code — `src/pages/Checkout.jsx`
calls `src/services/paymentService.js`, which invokes the
`create-checkout-session` Edge Function and redirects the shopper to a
Stripe-hosted payment page. `stripe-webhook` then marks the order paid and
generates its invoice server-side once Stripe confirms the charge. No
Stripe key ever reaches the browser. To activate it:

1. Create a Stripe account and grab your **secret key** from
   https://dashboard.stripe.com/apikeys (use a test key first: `sk_test_...`).
2. Deploy the two functions and set the secret key:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
   ```
   (`--no-verify-jwt` is required on the webhook — Stripe calls it
   directly, with no Supabase auth token attached.)
3. In the Stripe Dashboard → Developers → Webhooks, add an endpoint at
   `https://<project-ref>.functions.supabase.co/stripe-webhook` listening
   for `checkout.session.completed`, `checkout.session.expired`, and
   `payment_intent.payment_failed`. Copy its **signing secret**:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
4. Test end-to-end with a real checkout using Stripe's test card
   `4242 4242 4242 4242`, any future expiry, any CVC. Confirm the order's
   `payment_status` flips to `paid` and an invoice appears.
5. When ready for real money, swap the `sk_test_...` secret for your
   `sk_live_...` key and repeat the webhook step for the live endpoint.

Without Supabase configured at all, the app falls back to a clearly
labelled simulated payment (see `src/services/paymentService.js`) so the
demo stays clickable — this fallback never runs once Supabase is
connected.

## 5. Hosting

This is a static Vite build (`npm run build` outputs to `dist/`) plus
Supabase as the backend — it deploys to any static host:

- **Vercel / Netlify**: connect the repo, build command `npm run build`,
  output directory `dist`. Add your `.env` values as environment
  variables in the host's dashboard (they must be prefixed `VITE_` to be
  bundled into the client).
- Set up redirects so client-side routes work on refresh (both Vercel
  and Netlify auto-detect this for a Vite SPA; otherwise add a
  `_redirects` file with `/* /index.html 200`).

## 6. Before going live — checklist

- [ ] Replace SVG watch illustrations with real product photography
      (swap `<WatchIllustration />` for an `<img>` sourced from
      Supabase Storage).
- [ ] Replace the procedural Three.js model with a real GLB scan if you
      have one (see comments in `src/components/three/WatchViewer.jsx`).
- [ ] Add a real hero video or high-resolution photography (see comment
      in `src/components/home/Hero.jsx`).
- [ ] Wire up Stripe with your real keys (see §4) — the integration code
      is already in place, this is just configuration.
- [ ] Deploy the WhatsApp Edge Function with real credentials (see §3).
- [ ] Run Lighthouse, axe, and a manual screen-reader pass — see
      `PERFORMANCE_REPORT.md` and `ACCESSIBILITY_REPORT.md` for what's
      already been done vs. what to verify.
- [ ] Have counsel review the Privacy Policy, Terms, Shipping, and
      Returns pages — the current copy is a structural placeholder.
