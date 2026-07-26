import { useState } from 'react';
import { Copy, MapPin, Phone, MessageCircle, Check } from 'react-feather';
import type { Person } from '@/shared/types/person';
import {
  copyToClipboard,
  formatAddressMultiline,
  formatPhoneDisplay,
  getGoogleMapsSearchUrl,
  getTelHref,
  getWhatsAppHref,
  hasAddress,
  hasPhone,
} from '@/shared/utils/personContact';

type PersonContactInfoProps = {
  person: Person;
  /** Ringkas untuk tabel / badge */
  compact?: boolean;
};

function ContactAction({
  href,
  label,
  icon: Icon,
  external,
  variant = 'default',
}: {
  href: string;
  label: string;
  icon: typeof Phone;
  external?: boolean;
  variant?: 'default' | 'whatsapp' | 'maps';
}) {
  const styles = {
    default: 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-100',
    whatsapp: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-100',
    maps: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100',
  };

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${styles[variant]}`}
    >
      <Icon size={13} />
      {label}
    </a>
  );
}

export function PersonContactBadges({ person }: { person: Person }) {
  if (!hasPhone(person) && !hasAddress(person)) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {hasPhone(person) && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-600 text-[10px] font-medium"
          title="Ada nomor kontak"
        >
          <Phone size={10} />
          Kontak
        </span>
      )}
      {hasAddress(person) && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-medium"
          title="Ada alamat"
        >
          <MapPin size={10} />
          Alamat
        </span>
      )}
    </div>
  );
}

export function PersonContactInfo({ person, compact = false }: PersonContactInfoProps) {
  const [copied, setCopied] = useState<'phone' | 'address' | null>(null);
  const showPhone = hasPhone(person);
  const showAddress = hasAddress(person);

  if (!showPhone && !showAddress) return null;

  const mapsUrl = person.address ? getGoogleMapsSearchUrl(person.address) : null;
  const addressLines = person.address ? formatAddressMultiline(person.address) : [];

  const handleCopy = async (type: 'phone' | 'address', text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  if (compact) {
    return <PersonContactBadges person={person} />;
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Kontak & Alamat
      </p>

      {showPhone && (
        <div className="space-y-2">
          {person.phone && (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 mb-0.5">Telepon utama</p>
                <p className="text-sm font-medium text-brand-700">
                  {formatPhoneDisplay(person.phone)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('phone', person.phone!)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors flex-shrink-0"
                title="Salin nomor"
              >
                {copied === 'phone' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {person.phone && (
              <>
                <ContactAction
                  href={getTelHref(person.phone)}
                  label="Telepon"
                  icon={Phone}
                />
                <ContactAction
                  href={getWhatsAppHref(person.phone)}
                  label="WhatsApp"
                  icon={MessageCircle}
                  external
                  variant="whatsapp"
                />
              </>
            )}
            {person.phoneAlt && (
              <ContactAction
                href={getTelHref(person.phoneAlt)}
                label={formatPhoneDisplay(person.phoneAlt)}
                icon={Phone}
              />
            )}
          </div>
        </div>
      )}

      {showAddress && person.address && (
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 mb-0.5">Alamat</p>
              <div className="text-sm text-brand-700 leading-relaxed">
                {addressLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy('address', addressLines.join('\n'))
              }
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors flex-shrink-0"
              title="Salin alamat"
            >
              {copied === 'address' ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>
          </div>
          {mapsUrl && (
            <ContactAction
              href={mapsUrl}
              label="Buka di Google Maps"
              icon={MapPin}
              external
              variant="maps"
            />
          )}
        </div>
      )}
    </div>
  );
}
