import { lookupCityCoord } from '@/shared/data/indonesiaCityCoords';
import { formatAddressSingleLine } from '@/shared/utils/personContact';
import type { PersonAddress } from '@/shared/types/person';

export type GeocodeSource = 'api' | 'city';

export type GeocodeResult = {
  lat: number;
  lng: number;
  source: GeocodeSource;
};

const CACHE_MAX = 64;
const geocodeCache = new Map<string, GeocodeResult | null>();

function roundCoord(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function cacheSet(key: string, value: GeocodeResult | null) {
  if (geocodeCache.size >= CACHE_MAX) {
    const firstKey = geocodeCache.keys().next().value;
    if (firstKey) geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, value);
}

export function buildGeocodeQuery(fields: {
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}): string {
  const address: PersonAddress = {
    street: fields.street.trim() || undefined,
    district: fields.district.trim() || undefined,
    city: fields.city.trim() || undefined,
    province: fields.province.trim() || undefined,
    postalCode: fields.postalCode.trim() || undefined,
    country: 'Indonesia',
  };
  return formatAddressSingleLine(address);
}

function canGeocode(fields: {
  street: string;
  district: string;
  city: string;
  province: string;
}): boolean {
  const city = fields.city.trim();
  const province = fields.province.trim();
  const street = fields.street.trim();
  const district = fields.district.trim();
  return !!(city || province || street || district);
}

function cityFallback(
  city: string,
  province: string,
): GeocodeResult | null {
  const coord = lookupCityCoord(city, province);
  if (!coord) return null;
  return {
    lat: roundCoord(coord.lat),
    lng: roundCoord(coord.lng),
    source: 'city',
  };
}

async function fetchNominatim(
  query: string,
  signal: AbortSignal,
): Promise<GeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'id');
  url.searchParams.set('q', query);

  const response = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;

  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat: roundCoord(lat), lng: roundCoord(lng), source: 'api' };
}

/**
 * Resolve koordinat dari alamat. API dipanggil hanya untuk query yang cukup lengkap;
 * hasil di-cache agar tidak membebani jaringan.
 */
export async function resolveAddressCoordinates(
  fields: {
    street: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
  },
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  if (!canGeocode(fields)) return null;

  const query = buildGeocodeQuery(fields);
  if (!query) return null;

  if (geocodeCache.has(query)) {
    return geocodeCache.get(query) ?? null;
  }

  const city = fields.city.trim();
  const province = fields.province.trim();
  const hasDetail = !!(fields.street.trim() || fields.district.trim());

  if (hasDetail && city) {
    try {
      const apiResult = await fetchNominatim(query, signal ?? new AbortController().signal);
      if (apiResult) {
        cacheSet(query, apiResult);
        return apiResult;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
    }
  }

  const fallback = cityFallback(city, province);
  cacheSet(query, fallback);
  return fallback;
}
