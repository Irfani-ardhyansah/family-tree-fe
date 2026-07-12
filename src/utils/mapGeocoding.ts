import type { Person } from '@/types/person';
import { hasAddress, formatAddressSingleLine } from '@/utils/personContact';
import { lookupCityCoord } from '@/data/indonesiaCityCoords';

export type MapPinAccuracy = 'exact' | 'city' | 'none';

export type FamilyMapPin = {
  personId: string;
  person: Person;
  lat: number;
  lng: number;
  accuracy: MapPinAccuracy;
  cityLabel: string;
  addressLine: string;
};

export type MapMemberEntry = {
  person: Person;
  pin: FamilyMapPin | null;
  accuracy: MapPinAccuracy;
  cityLabel: string;
  addressLine: string;
};

function getCityLabel(person: Person): string {
  const city = person.address?.city?.trim();
  const province = person.address?.province?.trim();
  if (city && province) return `${city}, ${province}`;
  return city ?? province ?? 'Lokasi tidak diketahui';
}

/** Offset kecil agar marker di kota yang sama tidak overlap persis. */
function applyPersonOffset(
  lat: number,
  lng: number,
  personId: string,
): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < personId.length; i++) {
    hash = (hash + personId.charCodeAt(i) * (i + 1)) % 1000;
  }
  const latOff = ((hash % 20) - 10) * 0.0008;
  const lngOff = (((hash / 20) % 20) - 10) * 0.0008;
  return { lat: lat + latOff, lng: lng + lngOff };
}

export function resolvePersonMapPin(person: Person): FamilyMapPin | null {
  if (!hasAddress(person) || !person.address) return null;

  const addressLine = formatAddressSingleLine(person.address);
  const cityLabel = getCityLabel(person);

  if (
    person.address.latitude != null &&
    person.address.longitude != null
  ) {
    const { lat, lng } = applyPersonOffset(
      person.address.latitude,
      person.address.longitude,
      person.id,
    );
    return {
      personId: person.id,
      person,
      lat,
      lng,
      accuracy: 'exact',
      cityLabel,
      addressLine,
    };
  }

  const cityCoord = lookupCityCoord(
    person.address.city,
    person.address.province,
  );
  if (!cityCoord) return null;

  const { lat, lng } = applyPersonOffset(
    cityCoord.lat,
    cityCoord.lng,
    person.id,
  );
  return {
    personId: person.id,
    person,
    lat,
    lng,
    accuracy: 'city',
    cityLabel,
    addressLine,
  };
}

export function buildMapMemberEntries(persons: Person[]): MapMemberEntry[] {
  return persons
    .filter((p) => hasAddress(p))
    .map((person) => {
      const pin = resolvePersonMapPin(person);
      const addressLine = person.address
        ? formatAddressSingleLine(person.address)
        : '';
      const cityLabel = getCityLabel(person);
      return {
        person,
        pin,
        accuracy: pin?.accuracy ?? 'none',
        cityLabel,
        addressLine,
      };
    })
    .sort((a, b) => a.person.fullName.localeCompare(b.person.fullName, 'id'));
}

export function getMapBounds(pins: FamilyMapPin[]): [[number, number], [number, number]] | null {
  if (pins.length === 0) return null;
  let minLat = pins[0].lat;
  let maxLat = pins[0].lat;
  let minLng = pins[0].lng;
  let maxLng = pins[0].lng;
  for (const p of pins) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const pad = 0.05;
  return [
    [minLat - pad, minLng - pad],
    [maxLat + pad, maxLng + pad],
  ];
}

export const DEFAULT_MAP_CENTER: [number, number] = [-2.5, 118];
export const DEFAULT_MAP_ZOOM = 5;
