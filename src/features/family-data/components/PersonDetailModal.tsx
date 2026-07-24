import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Edit2,
  User,
  BookOpen,
  Briefcase,
  Users,
  Map as MapIcon,
} from 'react-feather';
import type { Person } from '@/types/person';
import { PersonContactInfo } from '@/components/ui/PersonContactInfo';
import { canAccessMemorial, getMemorialEntryPath } from '@/utils/memoriamAccess';
import { hasAddress } from '@/utils/personContact';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getAge(birthDate: string, deathDate?: string): number {
  const end = deathDate ? new Date(deathDate) : new Date();
  const birth = new Date(birthDate);
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age -= 1;
  return age;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  if (!value || value === '—') return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-brand-700">{value}</p>
    </div>
  );
}

type PersonDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  allPersons: Person[];
  currentUserId?: string;
  onEdit?: (person: Person) => void;
};

export function PersonDetailModal({
  isOpen,
  onClose,
  person,
  allPersons,
  currentUserId,
  onEdit,
}: PersonDetailModalProps) {
  const personMap = useMemo(
    () => new Map(allPersons.map((p) => [p.id, p])),
    [allPersons],
  );

  if (!person) return null;

  const father = person.fatherId ? personMap.get(person.fatherId) : undefined;
  const mother = person.motherId ? personMap.get(person.motherId) : undefined;
  const spouses = person.spouseIds
    .map((id) => personMap.get(id))
    .filter((p): p is Person => !!p);
  const age = getAge(person.birthDate, person.deathDate);
  const showMemorial =
    person.status === 'deceased' &&
    canAccessMemorial(currentUserId, person.id, allPersons);

  const avatarColor =
    person.gender === 'male'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-pink-100 text-pink-700';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
                {/* Header */}
                <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Tutup"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-start gap-4 pr-8">
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt={person.fullName}
                        className={`w-16 h-16 rounded-2xl object-cover flex-shrink-0 ${
                          person.status === 'deceased' ? 'grayscale' : ''
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${avatarColor}`}
                      >
                        {getInitials(person.fullName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <DialogTitle
                        as="h3"
                        className="text-lg font-bold text-brand-700 leading-snug"
                      >
                        {person.fullName}
                      </DialogTitle>
                      {person.nickname && (
                        <p className="text-sm text-primary-600 font-medium mt-0.5">
                          "{person.nickname}"
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            person.status === 'alive'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {person.status === 'alive' ? 'Hidup' : 'Meninggal'}
                        </span>
                        {person.isSelf && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                            Kamu
                          </span>
                        )}
                        {person.generationLabel && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Users size={12} />
                            {person.generationLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow
                      label="Jenis Kelamin"
                      value={person.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    />
                    <DetailRow
                      label="Usia"
                      value={`${age} tahun`}
                    />
                    <DetailRow
                      label="Tanggal Lahir"
                      value={formatDate(person.birthDate)}
                    />
                    {person.status === 'deceased' && person.deathDate && (
                      <DetailRow
                        label="Tanggal Meninggal"
                        value={formatDate(person.deathDate)}
                      />
                    )}
                    {person.occupation && (
                      <div className="col-span-2">
                        <DetailRow
                          label="Pekerjaan"
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              <Briefcase size={14} className="text-gray-400" />
                              {person.occupation}
                            </span>
                          }
                        />
                      </div>
                    )}
                  </div>

                  {(father || mother || spouses.length > 0) && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <User size={12} />
                        Hubungan Keluarga
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {father && (
                          <DetailRow label="Ayah" value={father.fullName} />
                        )}
                        {mother && (
                          <DetailRow label="Ibu" value={mother.fullName} />
                        )}
                        {spouses.length > 0 && (
                          <div className={spouses.length > 1 ? 'sm:col-span-2' : ''}>
                            <DetailRow
                              label={spouses.length > 1 ? 'Pasangan' : 'Pasangan'}
                              value={spouses.map((s) => s.fullName).join(', ')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <PersonContactInfo person={person} />

                  {hasAddress(person) && (
                    <Link
                      to={`/family/map?person=${person.id}`}
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 text-sm font-semibold transition-colors"
                    >
                      <MapIcon size={16} />
                      Lihat di Peta Keluarga
                    </Link>
                  )}

                  {showMemorial && (
                    <Link
                      to={getMemorialEntryPath(person)}
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
                    >
                      <BookOpen size={16} />
                      Lihat Kenangan
                    </Link>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                  >
                    Tutup
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onEdit(person);
                        onClose();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-semibold text-white transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit Data
                    </button>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
