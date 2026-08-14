

export function formatInvoiceNumber(numericId) {
  return `INV-${String(numericId).padStart(6, '0')}`;
}
