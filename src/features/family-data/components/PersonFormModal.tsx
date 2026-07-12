import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { Fragment, useState, useEffect, useMemo } from 'react';
import { X, Check, ChevronDown, MapPin, Phone } from 'react-feather';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import type { Gender, LifeStatus, Person, Religion } from '@/types/person';
import {
  buildAddressFromFields,
  getGoogleMapsSearchUrl,
} from '@/utils/personContact';

type FormData = {
  fullName: string;
  nickname: string;
  gender: Gender;
  birthDate: string;
  status: LifeStatus;
  deathDate: string;
  religion: Religion;
  occupation: string;
  phone: string;
  phoneAlt: string;
  addressStreet: string;
  addressDistrict: string;
  addressCity: string;
  addressProvince: string;
  addressPostalCode: string;
  photoUrls: string[];
  fatherId: string;
  motherId: string;
  spouseIds: string[];
};

const defaultForm: FormData = {
  fullName: '',
  nickname: '',
  gender: 'male',
  birthDate: '',
  status: 'alive',
  deathDate: '',
  religion: 'islam',
  occupation: '',
  phone: '',
  phoneAlt: '',
  addressStreet: '',
  addressDistrict: '',
  addressCity: '',
  addressProvince: '',
  addressPostalCode: '',
  photoUrls: [],
  fatherId: '',
  motherId: '',
  spouseIds: [],
};

function toFormData(p: Person): FormData {
  return {
    fullName: p.fullName,
    nickname: p.nickname ?? '',
    gender: p.gender,
    birthDate: p.birthDate,
    status: p.status,
    deathDate: p.deathDate ?? '',
    religion: p.religion ?? 'islam',
    occupation: p.occupation ?? '',
    phone: p.phone ?? '',
    phoneAlt: p.phoneAlt ?? '',
    addressStreet: p.address?.street ?? '',
    addressDistrict: p.address?.district ?? '',
    addressCity: p.address?.city ?? '',
    addressProvince: p.address?.province ?? '',
    addressPostalCode: p.address?.postalCode ?? '',
    photoUrls: p.photoUrl ? [p.photoUrl] : [],
    fatherId: p.fatherId ?? '',
    motherId: p.motherId ?? '',
    spouseIds: p.spouseIds,
  };
}

// ─── Reusable single-select relation combobox ─────────────────────────────────
function RelationCombobox({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: Person[];
  placeholder: string;
}) {
  const [query, setQuery] = useState('');

  const filtered =
    query === ''
      ? options
      : options.filter((p) =>
          p.fullName.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Combobox value={value} onChange={onChange} onClose={() => setQuery('')}>
        <div className="relative">
          <ComboboxInput
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-8"
            displayValue={(id: string) =>
              options.find((p) => p.id === id)?.fullName ?? ''
            }
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
            <ChevronDown size={16} />
          </span>
          <ComboboxOptions className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/10 text-sm">
            <ComboboxOption
              value=""
              className="cursor-pointer px-4 py-2 text-gray-400 italic data-[focus]:bg-primary-50 data-[selected]:bg-primary-50"
            >
              — Tidak ada / Tidak diketahui —
            </ComboboxOption>
            {filtered.map((p) => (
              <ComboboxOption
                key={p.id}
                value={p.id}
                className="cursor-pointer px-4 py-2 text-brand-700 data-[focus]:bg-primary-50 data-[selected]:bg-primary-100 flex items-center justify-between"
              >
                <span>
                  {p.fullName}
                  {p.nickname && (
                    <span className="text-gray-400 ml-1.5 text-xs">
                      ({p.nickname})
                    </span>
                  )}
                </span>
                {p.id === value && (
                  <Check size={14} className="text-primary-600 flex-shrink-0" />
                )}
              </ComboboxOption>
            ))}
            {filtered.length === 0 && query !== '' && (
              <div className="px-4 py-2 text-gray-400 italic">
                Tidak ditemukan
              </div>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}

// ─── Multi-select spouse chips ────────────────────────────────────────────────
function SpouseSelector({
  value,
  onChange,
  options,
  excludeId,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  options: Person[];
  excludeId?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const available = options.filter(
    (p) => p.id !== excludeId && !value.includes(p.id),
  );
  const filtered =
    query === ''
      ? available
      : available.filter((p) =>
          p.fullName.toLowerCase().includes(query.toLowerCase()),
        );
  const selected = options.filter((p) => value.includes(p.id));

  const addSpouse = (id: string) => {
    onChange([...value, id]);
    setQuery('');
    setOpen(false);
  };

  const removeSpouse = (id: string) => {
    onChange(value.filter((sid) => sid !== id));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pasangan
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-sm font-medium"
            >
              {p.fullName}
              <button
                type="button"
                onClick={() => removeSpouse(p.id)}
                className="hover:text-primary-900 ml-0.5"
                aria-label={`Hapus ${p.fullName}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Cari dan tambah pasangan..."
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/10 text-sm">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => addSpouse(p.id)}
                  className="w-full text-left px-4 py-2 text-brand-700 hover:bg-primary-50"
                >
                  {p.fullName}
                  {p.nickname && (
                    <span className="text-gray-400 ml-1.5 text-xs">
                      ({p.nickname})
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && query !== '' && filtered.length === 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-lg bg-white py-3 px-4 shadow-lg ring-1 ring-black/10 text-sm text-gray-400 italic">
            Tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step progress indicator ──────────────────────────────────────────────────
const STEPS = [
  { number: 1, label: 'Identitas' },
  { number: 2, label: 'Detail' },
  { number: 3, label: 'Hubungan' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, idx) => (
        <Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                current === step.number
                  ? 'bg-primary-500 text-white'
                  : current > step.number
                    ? 'bg-primary-200 text-primary-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {current > step.number ? <Check size={14} /> : step.number}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                current >= step.number ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-12 mx-1 mb-4 transition-colors ${
                current > step.number + 0 ? 'bg-primary-300' : 'bg-gray-200'
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ─── Main modal component ─────────────────────────────────────────────────────
export type PersonFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  personToEdit: Person | null;
  onSave: (data: Omit<Person, 'id'>) => void;
  persons: Person[];
};

export function PersonFormModal({
  isOpen,
  onClose,
  personToEdit,
  onSave,
  persons,
}: PersonFormModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setFormData(personToEdit ? toFormData(personToEdit) : defaultForm);
    }
  }, [isOpen, personToEdit]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!formData.fullName.trim()) e.fullName = 'Nama lengkap wajib diisi';
    if (!formData.birthDate) e.birthDate = 'Tanggal lahir wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    const data: Omit<Person, 'id'> = {
      fullName: formData.fullName.trim(),
      nickname: formData.nickname.trim() || undefined,
      gender: formData.gender,
      birthDate: formData.birthDate,
      status: formData.status,
      deathDate:
        formData.status === 'deceased' && formData.deathDate
          ? formData.deathDate
          : undefined,
      religion:
        formData.status === 'deceased' ? formData.religion : undefined,
      occupation: formData.occupation.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      phoneAlt: formData.phoneAlt.trim() || undefined,
      address: buildAddressFromFields({
        street: formData.addressStreet,
        district: formData.addressDistrict,
        city: formData.addressCity,
        province: formData.addressProvince,
        postalCode: formData.addressPostalCode,
      }),
      photoUrl: formData.photoUrls[0] || undefined,
      fatherId: formData.fatherId || undefined,
      motherId: formData.motherId || undefined,
      spouseIds: formData.spouseIds,
      isSelf: personToEdit?.isSelf,
      generationLabel: personToEdit?.generationLabel,
    };
    onSave(data);
    onClose();
  };

  const malePersons = persons.filter((p) => p.gender === 'male');
  const femalePersons = persons.filter((p) => p.gender === 'female');
  const isEditing = personToEdit !== null;

  const mapsPreviewUrl = useMemo(() => {
    const address = buildAddressFromFields({
      street: formData.addressStreet,
      district: formData.addressDistrict,
      city: formData.addressCity,
      province: formData.addressProvince,
      postalCode: formData.addressPostalCode,
    });
    return address ? getGoogleMapsSearchUrl(address) : null;
  }, [
    formData.addressStreet,
    formData.addressDistrict,
    formData.addressCity,
    formData.addressProvince,
    formData.addressPostalCode,
  ]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-semibold text-brand-700"
                  >
                    {isEditing ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Tutup"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 pt-5 pb-6">
                  <StepIndicator current={step} />

                  {/* ── Step 1: Identitas ── */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => set('fullName', e.target.value)}
                          placeholder="contoh: Budi Santoso"
                          className={`block w-full rounded-lg shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 ${
                            errors.fullName
                              ? 'border-red-400'
                              : 'border-gray-300'
                          }`}
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Panggilan{' '}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={formData.nickname}
                          onChange={(e) => set('nickname', e.target.value)}
                          placeholder="contoh: Budi"
                          className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis Kelamin <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(
                            [
                              { value: 'male', label: '♂ Laki-laki' },
                              { value: 'female', label: '♀ Perempuan' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => set('gender', opt.value)}
                              className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                                formData.gender === opt.value
                                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Lahir <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => set('birthDate', e.target.value)}
                          className={`block w-full rounded-lg shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 ${
                            errors.birthDate
                              ? 'border-red-400'
                              : 'border-gray-300'
                          }`}
                        />
                        {errors.birthDate && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.birthDate}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Detail ── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(
                            [
                              { value: 'alive', label: '🟢 Masih Hidup' },
                              { value: 'deceased', label: '⚫ Sudah Meninggal' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => set('status', opt.value)}
                              className={`py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all ${
                                formData.status === opt.value
                                  ? opt.value === 'alive'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-500 bg-gray-100 text-gray-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.status === 'deceased' && (
                        <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Meninggal{' '}
                            <span className="text-gray-400 font-normal">
                              (opsional)
                            </span>
                          </label>
                          <input
                            type="date"
                            value={formData.deathDate}
                            onChange={(e) => set('deathDate', e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Agama
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                { value: 'islam', label: '☪️ Islam' },
                                { value: 'other', label: '🕊️ Lainnya' },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => set('religion', opt.value)}
                                className={`py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all ${
                                  formData.religion === opt.value
                                    ? 'border-slate-500 bg-slate-100 text-slate-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            Halaman doa ditampilkan untuk almarhum/almarhumah beragama Islam
                          </p>
                        </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pekerjaan{' '}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={formData.occupation}
                          onChange={(e) => set('occupation', e.target.value)}
                          placeholder="contoh: Guru, Petani, Dokter"
                          className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-brand-700 flex items-center gap-2">
                            <Phone size={15} className="text-primary-500" />
                            Kontak & Alamat
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Opsional. Alamat terstruktur agar nanti bisa ditampilkan di Google Maps.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              No. Telepon / WhatsApp
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => set('phone', e.target.value)}
                              placeholder="08xx xxxx xxxx"
                              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              No. Alternatif
                            </label>
                            <input
                              type="tel"
                              value={formData.phoneAlt}
                              onChange={(e) => set('phoneAlt', e.target.value)}
                              placeholder="Opsional"
                              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Jalan / Detail Alamat
                          </label>
                          <input
                            type="text"
                            value={formData.addressStreet}
                            onChange={(e) => set('addressStreet', e.target.value)}
                            placeholder="Jl. Contoh No. 12, RT/RW"
                            className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Kecamatan
                            </label>
                            <input
                              type="text"
                              value={formData.addressDistrict}
                              onChange={(e) => set('addressDistrict', e.target.value)}
                              placeholder="Kecamatan"
                              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Kota / Kabupaten
                            </label>
                            <input
                              type="text"
                              value={formData.addressCity}
                              onChange={(e) => set('addressCity', e.target.value)}
                              placeholder="Kota"
                              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Provinsi
                            </label>
                            <input
                              type="text"
                              value={formData.addressProvince}
                              onChange={(e) => set('addressProvince', e.target.value)}
                              placeholder="Provinsi"
                              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Kode Pos
                            </label>
                            <input
                              type="text"
                              value={formData.addressPostalCode}
                              onChange={(e) => set('addressPostalCode', e.target.value)}
                              placeholder="60111"
                              className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        {mapsPreviewUrl && (
                          <a
                            href={mapsPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <MapPin size={14} />
                            Pratinjau lokasi di Google Maps
                          </a>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Foto Profil{' '}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <ImageDropzone
                          value={formData.photoUrls}
                          onChange={(urls) => set('photoUrls', urls)}
                          multiple={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Step 3: Hubungan ── */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 -mt-1 mb-2">
                        Semua field hubungan bersifat opsional. Isi jika sudah diketahui.
                      </p>

                      <RelationCombobox
                        label="Ayah"
                        value={formData.fatherId}
                        onChange={(id) => set('fatherId', id)}
                        options={malePersons.filter(
                          (p) => p.id !== personToEdit?.id,
                        )}
                        placeholder="Cari nama ayah..."
                      />

                      <RelationCombobox
                        label="Ibu"
                        value={formData.motherId}
                        onChange={(id) => set('motherId', id)}
                        options={femalePersons.filter(
                          (p) => p.id !== personToEdit?.id,
                        )}
                        placeholder="Cari nama ibu..."
                      />

                      <SpouseSelector
                        value={formData.spouseIds}
                        onChange={(ids) => set('spouseIds', ids)}
                        options={persons}
                        excludeId={personToEdit?.id}
                      />
                    </div>
                  )}

                  {/* Footer buttons */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={step === 1 ? onClose : handleBack}
                      className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {step === 1 ? 'Batal' : '← Kembali'}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {step} / {STEPS.length}
                      </span>
                      {step < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="px-5 py-2.5 rounded-lg bg-primary-500 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                        >
                          Lanjut →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="px-5 py-2.5 rounded-lg bg-primary-500 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                        >
                          {isEditing ? 'Simpan Perubahan' : 'Tambah Anggota'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
