export type CityCoord = {
  lat: number;
  lng: number;
  province?: string;
};

/** Koordinat pusat kota untuk fallback geocoding tanpa API. */
export const INDONESIA_CITY_COORDS: Record<string, CityCoord> = {
  'kota malang': { lat: -7.9666, lng: 112.6326, province: 'Jawa Timur' },
  malang: { lat: -7.9666, lng: 112.6326, province: 'Jawa Timur' },
  'kota surabaya': { lat: -7.2575, lng: 112.7521, province: 'Jawa Timur' },
  surabaya: { lat: -7.2575, lng: 112.7521, province: 'Jawa Timur' },
  'dki jakarta': { lat: -6.2088, lng: 106.8456, province: 'DKI Jakarta' },
  jakarta: { lat: -6.2088, lng: 106.8456, province: 'DKI Jakarta' },
  'kota bandung': { lat: -6.9175, lng: 107.6191, province: 'Jawa Barat' },
  bandung: { lat: -6.9175, lng: 107.6191, province: 'Jawa Barat' },
  'kota semarang': { lat: -6.9667, lng: 110.4167, province: 'Jawa Tengah' },
  semarang: { lat: -6.9667, lng: 110.4167, province: 'Jawa Tengah' },
  'kota yogyakarta': { lat: -7.7956, lng: 110.3695, province: 'DI Yogyakarta' },
  yogyakarta: { lat: -7.7956, lng: 110.3695, province: 'DI Yogyakarta' },
  madiun: { lat: -7.6298, lng: 111.5239, province: 'Jawa Timur' },
  'kota madiun': { lat: -7.6298, lng: 111.5239, province: 'Jawa Timur' },
};

export function lookupCityCoord(
  city?: string,
  province?: string,
): CityCoord | null {
  if (!city?.trim()) return null;
  const key = city.trim().toLowerCase();
  const direct = INDONESIA_CITY_COORDS[key];
  if (direct) return direct;

  const normalized = key.replace(/^kota\s+/, '');
  const fallback = INDONESIA_CITY_COORDS[normalized];
  if (fallback) return fallback;

  if (province) {
    const provKey = province.trim().toLowerCase();
    const match = Object.values(INDONESIA_CITY_COORDS).find(
      (c) => c.province?.toLowerCase() === provKey,
    );
    if (match) return match;
  }

  return null;
}
