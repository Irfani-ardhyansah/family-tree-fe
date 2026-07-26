import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { FamilyMapPin } from '@/shared/utils/mapGeocoding';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getMapBounds,
} from '@/shared/utils/mapGeocoding';
import { MapMemberPopup } from './MapMemberPopup';

function createMarkerIcon(pin: FamilyMapPin): L.DivIcon {
  const isDeceased = pin.person.status === 'deceased';
  const isMale = pin.person.gender === 'male';
  const bg = isDeceased
    ? '#94a3b8'
    : isMale
      ? '#3b82f6'
      : '#ec4899';
  const border = pin.accuracy === 'city' ? '#f59e0b' : '#ffffff';

  return L.divIcon({
    className: 'family-map-marker-icon',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:${bg};
      border:2px solid ${border};
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      opacity:${isDeceased ? 0.75 : 1};
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function MapFlyTo({
  personId,
  lat,
  lng,
  zoom = 14,
}: {
  personId: string | null;
  lat: number | null;
  lng: number | null;
  zoom?: number;
}) {
  const map = useMap();
  const lastFlownId = useRef<string | null>(null);

  useEffect(() => {
    if (!personId || lat == null || lng == null) return;
    if (lastFlownId.current === personId) return;
    lastFlownId.current = personId;
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [personId, lat, lng, map, zoom]);

  return null;
}

function MapFitBounds({
  pinsKey,
  bounds,
}: {
  pinsKey: string;
  bounds: [[number, number], [number, number]] | null;
}) {
  const map = useMap();
  const lastPinsKey = useRef<string | null>(null);

  useEffect(() => {
    if (!bounds || pinsKey === lastPinsKey.current) return;
    lastPinsKey.current = pinsKey;
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [pinsKey, bounds, map]);

  return null;
}

type FamilyMapCanvasProps = {
  pins: FamilyMapPin[];
  selectedPersonId: string | null;
  onDetail: (personId: string) => void;
  onSelectPerson: (personId: string) => void;
};

export function FamilyMapCanvas({
  pins,
  selectedPersonId,
  onDetail,
  onSelectPerson,
}: FamilyMapCanvasProps) {
  const bounds = getMapBounds(pins);
  const pinsKey = useMemo(
    () => pins.map((p) => p.personId).join(','),
    [pins],
  );
  const selectedPin = useMemo(
    () =>
      selectedPersonId
        ? pins.find((p) => p.personId === selectedPersonId) ?? null
        : null,
    [pins, selectedPersonId],
  );

  return (
    <MapContainer
      center={DEFAULT_MAP_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      className="w-full h-full min-h-[360px] rounded-xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {bounds ? <MapFitBounds pinsKey={pinsKey} bounds={bounds} /> : null}
      <MapFlyTo
        personId={selectedPersonId}
        lat={selectedPin?.lat ?? null}
        lng={selectedPin?.lng ?? null}
      />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.personId}
            position={[pin.lat, pin.lng]}
            icon={createMarkerIcon(pin)}
            eventHandlers={{
              click: () => onSelectPerson(pin.personId),
            }}
          >
            <Popup>
              <MapMemberPopup pin={pin} onDetail={onDetail} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
