import type { FamilyMapPin } from '@/utils/mapGeocoding';
import {
  formatPhoneDisplay,
  getGoogleMapsSearchUrl,
  getTelHref,
  getWhatsAppHref,
} from '@/utils/personContact';
import { MapPin, Phone, MessageCircle, User } from 'react-feather';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

type MapMemberPopupProps = {
  pin: FamilyMapPin;
  onDetail: (personId: string) => void;
};

export function MapMemberPopup({ pin, onDetail }: MapMemberPopupProps) {
  const { person } = pin;
  const mapsUrl = person.address ? getGoogleMapsSearchUrl(person.address) : null;

  const avatarColor =
    person.gender === 'male'
      ? 'bg-blue-500'
      : 'bg-pink-500';

  return (
    <div className="min-w-[220px] max-w-[260px]">
      <div className="flex items-start gap-3 mb-3">
        {person.photoUrl ? (
          <img
            src={person.photoUrl}
            alt={person.fullName}
            className={`w-10 h-10 rounded-full object-cover flex-shrink-0 ${
              person.status === 'deceased' ? 'grayscale' : ''
            }`}
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor}`}
          >
            {getInitials(person.fullName)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-700 leading-snug">
            {person.fullName}
          </p>
          {person.nickname && (
            <p className="text-xs text-primary-600">{person.nickname}</p>
          )}
          {person.generationLabel && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {person.generationLabel}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
        {pin.addressLine}
      </p>

      {pin.accuracy === 'city' && (
        <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md mb-2">
          Lokasi perkiraan (pusat kota)
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {person.phone && (
          <>
            <a
              href={getTelHref(person.phone)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-[10px] font-semibold"
            >
              <Phone size={10} />
              {formatPhoneDisplay(person.phone)}
            </a>
            <a
              href={getWhatsAppHref(person.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-semibold"
            >
              <MessageCircle size={10} />
              WA
            </a>
          </>
        )}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold"
          >
            <MapPin size={10} />
            Maps
          </a>
        )}
        <button
          type="button"
          onClick={() => onDetail(person.id)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold hover:bg-gray-200 transition-colors"
        >
          <User size={10} />
          Detail
        </button>
      </div>
    </div>
  );
}
