import type { Person } from '@/types/person';

const HONORIFIC_PREFIX = /^(H\.|Hj\.|Dr\.|Prof\.|Ny\.|Tn\.)\s*/i;

/** Maks huruf singkatan + 6 angka tanggal lahir. */
export const LOGIN_CODE_MAX_LENGTH = 40;
export const BIRTH_DATE_SUFFIX_LENGTH = 6;

function lettersOnly(value: string): string {
  return value.replace(/[^a-zA-Z]/g, '');
}

function parseNameParts(fullName: string): string[] {
  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(HONORIFIC_PREFIX, '').trim())
    .map((word) => lettersOnly(word))
    .filter(Boolean);
}

/**
 * Singkatan nama — panjang mengikuti nama, tidak dibatasi 2–3 huruf:
 * - Ada nickname → seluruh nickname (huruf saja)
 * - Nama 1 kata → seluruh kata ("M" → M, "Mia" → MIA)
 * - Nama 2+ kata → huruf pertama tiap kata ("Mulyono Raka" → MR)
 */
export function buildNameAbbrev(fullName: string, nickname?: string): string {
  const nick = lettersOnly(nickname ?? '');
  if (nick) return nick.toUpperCase();

  const parts = parseNameParts(fullName);
  if (parts.length === 0) return 'X';

  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

/** Format DDMMYY dari tanggal lahir ISO (YYYY-MM-DD). */
export function buildBirthDateSuffix(birthDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return '000000';
  const [, year, month, day] = match;
  return `${day}${month}${year.slice(-2)}`;
}

export function buildLoginCode(
  person: Pick<Person, 'fullName' | 'nickname' | 'birthDate'>,
): string {
  return (
    buildNameAbbrev(person.fullName, person.nickname) +
    buildBirthDateSuffix(person.birthDate)
  );
}

export function normalizeLoginCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s/g, '');
}

export function splitLoginCode(code: string): {
  abbrev: string;
  birthSuffix: string;
} | null {
  const match = /^([A-Z]+)(\d{6})$/.exec(code);
  if (!match) return null;
  return { abbrev: match[1], birthSuffix: match[2] };
}

export function isValidLoginCodeFormat(code: string): boolean {
  const parts = splitLoginCode(code);
  return parts != null && parts.abbrev.length >= 1;
}

export function findPersonByLoginCode(
  persons: Person[],
  rawCode: string,
): Person | null {
  const code = normalizeLoginCode(rawCode);
  if (!isValidLoginCodeFormat(code)) return null;

  return (
    persons.find((person) => {
      if (person.status !== 'alive') return false;
      return buildLoginCode(person) === code;
    }) ?? null
  );
}

export function formatLoginCodeHint(
  person: Pick<Person, 'fullName' | 'nickname' | 'birthDate'>,
): string {
  const abbrev = buildNameAbbrev(person.fullName, person.nickname);
  const suffix = buildBirthDateSuffix(person.birthDate);
  return `${abbrev} + ${suffix.slice(0, 2)}/${suffix.slice(2, 4)}/${suffix.slice(4)} → ${abbrev}${suffix}`;
}
