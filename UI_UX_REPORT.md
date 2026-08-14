# UI/UX Report

## Design Language
- **Palette**: Black (#050505), Gold (#D4AF37), Silver (#C0C0C0), Ivory
  (#F5F2EA) — defined as CSS custom properties in `src/index.css` so
  every component pulls from one source of truth.
- **Typography**: Playfair Display for headings (editorial, luxury feel),
  Inter for body copy and UI chrome, loaded via Google Fonts in
  `index.html`.
- **Motifs**: glassmorphism cards (`.card-glass`), a hairline gold
  underline animation on nav links, a fixed scroll-progress "watch dial"
  (`ScrollProgressDial.jsx`) that ties the site chrome to the product
  category instead of using a generic progress bar.

## Interaction Patterns
- 3D tilt on product cards, tracked via mouse position (`ProductCard.jsx`).
- Micro-interaction on "Add to Cart" (label swaps to "Added ✓" for 1.6s).
- Scroll-reveal on every section via `whileInView` (Framer Motion),
  respecting `prefers-reduced-motion`.
- Multi-step checkout with a visible step indicator rather than a single
  long form, to reduce perceived effort on a high-consideration purchase.

## Information Architecture
Global nav: Shop, Collections, Categories, Heritage (About), Contact.
Footer surfaces the full sitemap (shop, company, legal) plus a newsletter
signup. Admin dashboard uses a persistent sidebar rather than tabs, since
admin sessions are typically longer and benefit from a stable location
for each section.

## Honesty Note
This report describes what was implemented and the reasoning behind it —
it is not a usability-test result. No user testing was conducted as part
of this build.
