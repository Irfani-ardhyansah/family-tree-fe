/** Mask document number for list view: keep last 4 digits. */
export function maskDocumentNumber(number: string): string {
  const cleaned = number.trim();
  if (!cleaned) return '—';
  const digits = cleaned.replace(/\s+/g, '');
  if (digits.length <= 4) return digits;
  const last = digits.slice(-4);
  return `•••• ${last}`;
}
