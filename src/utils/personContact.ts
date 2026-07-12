import type { Person, PersonAddress } from '@/types/person';

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 10) return phone;
  if (digits.startsWith('62')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`.trim();
  }
  if (digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`.trim();
  }
  return phone;
}

export function getTelHref(phone: string): string {
  const digits = normalizePhoneDigits(phone);
  if (digits.startsWith('0')) return `tel:+62${digits.slice(1)}`;
  if (digits.startsWith('62')) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function getWhatsAppHref(phone: string): string {
  let digits = normalizePhoneDigits(phone);
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export function hasPhone(person: Pick<Person, 'phone' | 'phoneAlt'>): boolean {
  return !!(person.phone?.trim() || person.phoneAlt?.trim());
}

export function hasAddress(person: Pick<Person, 'address'>): boolean {
  if (!person.address) return false;
  const { street, district, city, province, postalCode } = person.address;
  return !!(street?.trim() || district?.trim() || city?.trim() || province?.trim() || postalCode?.trim());
}

export function formatAddressMultiline(address: PersonAddress): string[] {
  const lines: string[] = [];
  if (address.street?.trim()) lines.push(address.street.trim());
  const locality = [address.district, address.city].filter(Boolean).join(', ');
  if (locality) lines.push(locality);
  const region = [address.province, address.postalCode].filter(Boolean).join(' ');
  if (region) lines.push(region);
  if (address.country?.trim() && address.country !== 'Indonesia') {
    lines.push(address.country.trim());
  }
  return lines;
}

export function formatAddressSingleLine(address: PersonAddress): string {
  const parts = formatAddressMultiline(address);
  const country =
    address.country?.trim() && address.country !== 'Indonesia'
      ? address.country.trim()
      : 'Indonesia';
  if (parts.length === 0) return '';
  if (!parts.some((p) => p.toLowerCase().includes('indonesia'))) {
    return [...parts, country].join(', ');
  }
  return parts.join(', ');
}

function parseOptionalCoord(value?: string): number | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export function buildAddressFromFields(fields: {
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
}): PersonAddress | undefined {
  const street = fields.street.trim();
  const district = fields.district.trim();
  const city = fields.city.trim();
  const province = fields.province.trim();
  const postalCode = fields.postalCode.trim();
  const latitude = parseOptionalCoord(fields.latitude);
  const longitude = parseOptionalCoord(fields.longitude);
  const hasCoords = latitude != null && longitude != null;
  if (!street && !district && !city && !province && !postalCode && !hasCoords) {
    return undefined;
  }
  return {
    street: street || undefined,
    district: district || undefined,
    city: city || undefined,
    province: province || undefined,
    postalCode: postalCode || undefined,
    country: 'Indonesia',
    ...(hasCoords ? { latitude, longitude } : {}),
  };
}

export function getGoogleMapsSearchUrl(address: PersonAddress): string | null {
  if (address.latitude != null && address.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
  }
  const query = formatAddressSingleLine(address);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
