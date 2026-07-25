/**
 * Label UI singkat untuk switcher/fokus:
 * nickname → satu bagian nama (belakang / tengah / depan) → fallback.
 */
export function shortPersonName(
  person: { fullName: string; nickname?: string | null } | undefined,
  fallback: string,
): string {
  if (!person) return fallback;

  const nick = person.nickname?.trim();
  if (nick) return nick;

  const parts = person.fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0];

  const last = parts[parts.length - 1];
  const first = parts[0];
  const middle = parts.length >= 3 ? parts[Math.floor(parts.length / 2)] : null;

  // Prefer bagian yang paling ringkas agar navbar tidak melebar.
  const candidates = [last, middle, first].filter(
    (p): p is string => Boolean(p),
  );
  return candidates.reduce((a, b) => (a.length <= b.length ? a : b));
}
