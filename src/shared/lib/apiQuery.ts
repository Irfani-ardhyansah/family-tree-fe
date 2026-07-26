/** Build query string without focusPersonId — BE resolves via person_options. */
export function buildQuery(extra?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value != null && value !== '') params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
