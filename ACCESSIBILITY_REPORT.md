# Accessibility Report

**No automated audit (axe, Lighthouse a11y, or screen-reader testing) was
run against this build.** The items below describe what was implemented
during development, not a pass/fail audit result.

## Implemented
- Skip-to-content link (`.skip-link` in `Layout.jsx`), visible on focus.
- `aria-label`s on icon-only buttons (cart, wishlist, account, wishlist
  toggle, mobile menu, share).
- `aria-pressed` on the wishlist toggle button, `aria-expanded` on the
  mobile nav and FAQ accordion.
- `aria-current="page"` on active pagination/nav states.
- Visible focus states on buttons/links/inputs (`:focus-visible` rules
  in `index.css`), not just `:hover`.
- `prefers-reduced-motion` respected globally — animations collapse to
  near-instant for users who've requested it.
- Form labels (`<label htmlFor>`) on every input in checkout, auth, and
  contact forms, rather than placeholder-only labeling.
- Sufficient color contrast targeted for body text (ivory on near-black)
  and interactive gold accents, though this hasn't been verified with a
  contrast-ratio tool against every state (hover/disabled/etc.).

## Needs verification before launch
- Run an automated audit (axe DevTools or Lighthouse) against the built
  site and fix whatever it flags — component-level care doesn't
  guarantee full WCAG 2.2 AA conformance.
- Manual screen-reader pass (VoiceOver/NVDA) through checkout and the
  admin dashboard specifically, since both have the most dynamic state.
- Verify the React Three Fiber watch viewer has a meaningful
  non-visual fallback/description for screen-reader users (currently it's
  a supplementary view, with the static gallery as the default).
