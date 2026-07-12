import { useMemo, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, RefreshCw } from 'react-feather';
import { lookupCityCoord } from '@/data/indonesiaCityCoords';
import { DEFAULT_MAP_CENTER } from '@/utils/mapGeocoding';
import type { GeocodeSource } from '@/utils/addressGeocoding';

const pinIcon = L.divIcon({
  className: 'address-pin-picker-icon',
  html: `<div style="
    width:24px;height:24px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    background:#3b82f6;
    border:2px solid #ffffff;
    box-shadow:0 2px 6px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

type AddressPinPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  onManualChange: () => void;
  onSyncFromAddress: () => void;
  city?: string;
  province?: string;
  isGeocoding?: boolean;
  pinIsManual?: boolean;
  geocodeSource?: GeocodeSource | null;
};

function MapRecenter({
  lat,
  lng,
  zoom,
}: {
  lat: number | null;
  lng: number | null;
  zoom: number;
}) {
  const map = useMap();
  const lastTarget = useRef<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    const key = `${lat},${lng},${zoom}`;
    if (lastTarget.current === key) return;
    lastTarget.current = key;
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);

  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DraggablePin({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          onDragEnd(lat, lng);
        }
      },
    }),
    [onDragEnd],
  );

  return (
    <Marker
      draggable
      position={position}
      icon={pinIcon}
      ref={markerRef}
      eventHandlers={eventHandlers}
    />
  );
}

export function AddressPinPicker({
  latitude,
  longitude,
  onChange,
  onManualChange,
  onSyncFromAddress,
  city,
  province,
  isGeocoding = false,
  pinIsManual = false,
  geocodeSource = null,
}: AddressPinPickerProps) {
  const hasPin = latitude != null && longitude != null;

  const mapCenter = useMemo((): [number, number] => {
    if (hasPin) return [latitude, longitude];
    const cityCoord = lookupCityCoord(city, province);
    if (cityCoord) return [cityCoord.lat, cityCoord.lng];
    return DEFAULT_MAP_CENTER;
  }, [hasPin, latitude, longitude, city, province]);

  const mapZoom = hasPin ? 15 : lookupCityCoord(city, province) ? 12 : 5;

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      onManualChange();
      onChange(
        Math.round(lat * 1_000_000) / 1_000_000,
        Math.round(lng * 1_000_000) / 1_000_000,
      );
    },
    [onChange, onManualChange],
  );

  const statusMessage = useMemo(() => {
    if (isGeocoding) return 'Mencari lokasi dari alamat…';
    if (!hasPin) {
      return 'Isi alamat lalu pin akan disesuaikan otomatis.';
    }
    if (pinIsManual) {
      return 'Pin disesuaikan manual. Klik sinkronkan untuk mengikuti alamat lagi.';
    }
    if (geocodeSource === 'api') {
      return 'Lokasi dari alamat lengkap (OpenStreetMap).';
    }
    if (geocodeSource === 'city') {
      return 'Lokasi perkiraan pusat kota — geser pin untuk lebih akurat.';
    }
    return 'Klik peta atau geser pin untuk menyesuaikan lokasi.';
  }, [isGeocoding, hasPin, pinIsManual, geocodeSource]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500 leading-relaxed flex-1">
          {statusMessage}
        </p>
        {pinIsManual && !isGeocoding && (
          <button
            type="button"
            onClick={onSyncFromAddress}
            className="inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold text-primary-700 hover:text-primary-900 transition-colors"
          >
            <RefreshCw size={11} />
            Sinkronkan
          </button>
        )}
      </div>

      <div className="relative h-[200px] rounded-xl overflow-hidden border border-gray-200">
        {isGeocoding && (
          <div className="absolute inset-0 z-[500] bg-white/60 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-primary-500" />
              Memuat lokasi…
            </span>
          </div>
        )}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full z-0"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={handlePick} />
          <MapRecenter
            lat={hasPin ? latitude : null}
            lng={hasPin ? longitude : null}
            zoom={hasPin ? 15 : mapZoom}
          />
          {hasPin && (
            <DraggablePin
              position={[latitude, longitude]}
              onDragEnd={handlePick}
            />
          )}
        </MapContainer>
      </div>

      {hasPin ? (
        <p className="text-[10px] text-green-700 bg-green-50 px-2 py-1.5 rounded-md font-mono flex items-center gap-1.5">
          <MapPin size={11} />
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      ) : (
        <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded-md">
          Belum ada pin — peta keluarga memakai perkiraan kota jika tersedia
        </p>
      )}
    </div>
  );
}
