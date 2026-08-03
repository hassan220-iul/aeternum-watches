-- Run after schema.sql. Populates categories + a starter product catalog
-- so the storefront isn't empty on first connect. Matches the shape of
-- src/data/mockProducts.js so the UI looks identical whether it's reading
-- from Supabase or the local fallback.

insert into categories (slug, name) values
  ('automatic', 'Automatic'),
  ('chronograph', 'Chronograph'),
  ('skeleton', 'Skeleton'),
  ('diver', 'Diver'),
  ('dress', 'Dress')
on conflict (slug) do nothing;

insert into products (slug, name, category, collection, price, currency, is_limited, is_new, stock, movement, case_material, water_resistance, warranty, description, rating, review_count)
values
  ('aeternum-heritage-1959', 'Heritage 1959', 'dress', 'heritage', 18500, 'USD', false, false, 6,
   'Automatic, in-house calibre A-12', '18k rose gold, 39mm', '50m', 'Lifetime mechanical warranty',
   'A faithful reissue of the 1959 dress watch that established the Aeternum name.', 4.9, 128),

  ('aeternum-obsidian-carbon', 'Obsidian Carbon', 'chronograph', 'obsidian', 24500, 'USD', false, true, 11,
   'Automatic chronograph, calibre A-9C', 'Forged carbon, 42mm', '100m', 'Lifetime mechanical warranty',
   'A monochrome chronograph built from forged carbon composite.', 4.8, 74),

  ('aeternum-meridian-gmt', 'Meridian GMT', 'automatic', 'meridian', 21200, 'USD', false, true, 15,
   'Automatic GMT, calibre A-7T', 'Stainless steel, 40mm', '100m', 'Lifetime mechanical warranty',
   'Two time zones, one silhouette.', 4.7, 51),

  ('aeternum-skeleton-noir', 'Skeleton Noir', 'skeleton', 'obsidian', 32800, 'USD', true, false, 3,
   'Hand-wound skeleton, calibre A-15S', 'DLC-coated titanium, 41mm', '30m', 'Lifetime mechanical warranty',
   'Every bridge and gear train exposed under sapphire.', 5.0, 22),

  ('aeternum-deep-current', 'Deep Current', 'diver', 'meridian', 15600, 'USD', false, false, 20,
   'Automatic, calibre A-4D', 'Titanium, 43mm', '300m', 'Lifetime mechanical warranty',
   'Rated to 300 metres, finished to dress-watch standards.', 4.6, 89),

  ('aeternum-centennial-one-of-100', 'Centennial — One of 100', 'automatic', 'limited-edition', 68000, 'USD', true, true, 2,
   'Automatic, calibre A-20 with 5-day power reserve', 'Platinum, 40mm', '50m', 'Lifetime mechanical warranty + provenance certificate',
   'Struck to mark a century of the Aeternum atelier.', 5.0, 9)
on conflict (slug) do nothing;

-- Example discount codes matching the frontend's coupon UI (src/pages/Cart.jsx)
insert into discounts (code, percent_off, active) values
  ('WELCOME5', 5, true),
  ('VIP10', 10, true)
on conflict (code) do nothing;
