// Invoice numbers are generated authoritatively by the Postgres sequence +
// trigger defined in supabase/schema.sql (see `generate_invoice_number()`),
// so every invoice gets a gap-free, race-safe number even under concurrent
// checkouts. This helper is only for client-side preview before the real
// row (and its trigger-assigned number) comes back from Supabase.

export function formatInvoiceNumber(numericId) {
  return `INV-${String(numericId).padStart(6, '0')}`;
}
