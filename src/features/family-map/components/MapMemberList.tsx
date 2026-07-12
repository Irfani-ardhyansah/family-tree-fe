import { MapPin, Navigation } from 'react-feather';
import type { MapMemberEntry } from '@/utils/mapGeocoding';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const ACCURACY_LABEL: Record<MapMemberEntry['accuracy'], string> = {
  exact: 'Pin akurat',
  city: 'Perkiraan kota',
  none: 'Belum ada koordinat',
};

const ACCURACY_STYLE: Record<MapMemberEntry['accuracy'], string> = {
  exact: 'bg-green-50 text-green-700',
  city: 'bg-amber-50 text-amber-700',
  none: 'bg-gray-100 text-gray-500',
};

type MapMemberListProps = {
  entries: MapMemberEntry[];
  selectedPersonId: string | null;
  onSelect: (personId: string) => void;
};

export function MapMemberList({
  entries,
  selectedPersonId,
  onSelect,
}: MapMemberListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 font-medium">
          Tidak ada anggota dengan alamat
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tambahkan alamat di Data Anggota
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-50">
      {entries.map((entry) => {
        const { person, pin, accuracy, cityLabel, addressLine } = entry;
        const isSelected = selectedPersonId === person.id;
        const canFly = !!pin;

        return (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => onSelect(person.id)}
              disabled={!canFly}
              className={`w-full text-left px-4 py-3 transition-colors ${
                isSelected
                  ? 'bg-primary-50 border-l-4 border-primary-500'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              } ${!canFly ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    person.gender === 'male'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-pink-100 text-pink-700'
                  } ${person.status === 'deceased' ? 'grayscale opacity-70' : ''}`}
                >
                  {getInitials(person.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-700 leading-snug truncate">
                      {person.fullName}
                    </p>
                    {canFly && (
                      <Navigation
                        size={14}
                        className={`flex-shrink-0 mt-0.5 ${
                          isSelected ? 'text-primary-500' : 'text-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  {person.generationLabel && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {person.generationLabel}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {addressLine || cityLabel}
                  </p>
                  <span
                    className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${ACCURACY_STYLE[accuracy]}`}
                  >
                    {ACCURACY_LABEL[accuracy]}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
