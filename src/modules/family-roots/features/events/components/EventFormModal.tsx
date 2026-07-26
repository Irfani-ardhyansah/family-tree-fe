import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Check } from 'react-feather';
import type { FamilyEvent, EventType } from '@/shared/types/event';
import { EVENT_TYPE_CONFIG } from '@/shared/types/event';
import type { Person } from '@/shared/types/person';
import { ImageDropzone } from '@/shared/components/ui/ImageDropzone';
import { useMediaModalSession } from '@/shared/hooks/useMediaModalSession';
import {
  splitMediaForSubmit,
  urlsToExistingMediaItems,
  type MediaUploadItem,
} from '@/shared/types/media';

type FormData = {
  title: string;
  type: EventType;
  date: string;
  endDate: string;
  location: string;
  description: string;
  personIds: string[];
  photos: MediaUploadItem[];
  attendeeIds: string[];
  restrictAccess: boolean;
};

const defaultForm: FormData = {
  title: '',
  type: 'other',
  date: '',
  endDate: '',
  location: '',
  description: '',
  personIds: [],
  photos: [],
  attendeeIds: [],
  restrictAccess: false,
};

function toFormData(e: FamilyEvent): FormData {
  return {
    title: e.title,
    type: e.type,
    date: e.date,
    endDate: e.endDate ?? '',
    location: e.location ?? '',
    description: e.description ?? '',
    personIds: e.personIds,
    photos: urlsToExistingMediaItems(e.photoUrls),
    attendeeIds: e.attendeeIds ?? [],
    restrictAccess: (e.attendeeIds ?? []).length > 0,
  };
}

// ─── Attendee selector ────────────────────────────────────────────────────────
function AttendeeSelector({
  value,
  onChange,
  persons,
  enabled,
  onEnabledChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  persons: Person[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Siapa yang Bisa Melihat?
      </label>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => {
            onEnabledChange(false);
            onChange([]);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
            !enabled
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          Semua Keluarga
        </button>
        <button
          type="button"
          onClick={() => onEnabledChange(true)}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
            enabled
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          Pilih Peserta
        </button>
      </div>
      {!enabled ? (
        <p className="text-xs text-gray-400 leading-relaxed">
          Semua anggota di pohon keluarga dapat melihat dan berkontribusi foto.
        </p>
      ) : (
        <PersonSelector
          value={value}
          onChange={onChange}
          persons={persons}
          label="Peserta yang Diizinkan"
          placeholder="Cari nama peserta..."
        />
      )}
    </div>
  );
}

// ─── Person chip selector ─────────────────────────────────────────────────────
function PersonSelector({
  value,
  onChange,
  persons,
  label = 'Anggota Terkait',
  placeholder = 'Cari nama anggota keluarga...',
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  persons: Person[];
  label?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const available = persons.filter((p) => !value.includes(p.id));
  const filtered =
    query === ''
      ? available
      : available.filter((p) =>
          p.fullName.toLowerCase().includes(query.toLowerCase()),
        );
  const selected = persons.filter((p) => value.includes(p.id));

  const add = (id: string) => {
    onChange([...value, id]);
    setQuery('');
    setOpen(false);
  };

  const remove = (id: string) => onChange(value.filter((s) => s !== id));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{' '}
        <span className="text-gray-400 font-normal">(opsional)</span>
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-medium"
            >
              {p.fullName}
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="hover:text-primary-900"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-30 mt-1 max-h-44 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/10 text-sm">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => add(p.id)}
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

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { number: 1, label: 'Informasi' },
  { number: 2, label: 'Detail' },
];

function StepIndicator({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, idx) => {
        const isCurrent = current === step.number;
        const isDone = current > step.number;
        return (
          <Fragment key={step.number}>
            <button
              type="button"
              onClick={() => onSelect(step.number)}
              className="flex flex-col items-center rounded-lg px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-primary-500 text-white'
                    : isDone
                      ? 'bg-primary-200 text-primary-700'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {isDone ? <Check size={14} /> : step.number}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  current >= step.number
                    ? 'text-primary-600'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-16 mx-1 mb-4 transition-colors ${
                  current > step.number ? 'bg-primary-300' : 'bg-gray-200'
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export type EventFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: FamilyEvent | null;
  onSave: (data: Omit<FamilyEvent, 'id'>, mediaIds?: string[]) => void;
  persons: Person[];
};

const EVENT_TYPES = Object.entries(EVENT_TYPE_CONFIG) as [
  EventType,
  (typeof EVENT_TYPE_CONFIG)[EventType],
][];

export function EventFormModal({
  isOpen,
  onClose,
  eventToEdit,
  onSave,
  persons,
}: EventFormModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const mediaSession = useMediaModalSession();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrors({});
      setFormData(eventToEdit ? toFormData(eventToEdit) : defaultForm);
    }
  }, [isOpen, eventToEdit]);

  const handleClose = () => {
    void mediaSession.cleanupPending();
    onClose();
  };

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!formData.title.trim()) e.title = 'Nama acara wajib diisi';
    if (!formData.date) e.date = 'Tanggal acara wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isEditing = eventToEdit !== null;

  const goToStep = (next: number) => {
    if (next === step) return;
    // Create flow: validate step 1 before leaving it. Edit: free navigation.
    if (next > 1 && !isEditing && !validateStep1()) return;
    setStep(next);
  };

  const handleNext = () => {
    goToStep(2);
  };

  const handleSubmit = () => {
    if (!validateStep1()) { setStep(1); return; }
    const { mediaIds, photoUrls } = splitMediaForSubmit(formData.photos);
    mediaSession.commitPending();
    onSave({
      title: formData.title.trim(),
      type: formData.type,
      date: formData.date,
      endDate: formData.endDate || undefined,
      location: formData.location.trim() || undefined,
      description: formData.description.trim() || undefined,
      personIds: formData.personIds,
      photoUrls,
      attendeeIds: formData.restrictAccess ? formData.attendeeIds : [],
      contributions: eventToEdit?.contributions ?? [],
    }, mediaIds.length > 0 ? mediaIds : undefined);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
              <DialogPanel className="w-full max-w-lg mx-3 sm:mx-0 rounded-2xl bg-white shadow-xl overflow-hidden max-h-[90dvh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-semibold text-brand-700"
                  >
                    {isEditing ? 'Edit Acara' : 'Tambah Acara'}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Tutup"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-4 sm:px-6 pt-5 pb-6">
                  <StepIndicator current={step} onSelect={goToStep} />

                  {/* ── Step 1: Informasi Acara ── */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Acara <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => set('title', e.target.value)}
                          placeholder="contoh: Pernikahan Budi & Sari"
                          className={`block w-full rounded-lg shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 ${
                            errors.title ? 'border-red-400' : 'border-gray-300'
                          }`}
                        />
                        {errors.title && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.title}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis Acara <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {EVENT_TYPES.map(([key, cfg]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => set('type', key)}
                              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                                formData.type === key
                                  ? `${cfg.border} ${cfg.bg} ${cfg.color} border-opacity-100`
                                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-xl leading-none">
                                {cfg.emoji}
                              </span>
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => set('date', e.target.value)}
                            className={`block w-full rounded-lg shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 ${
                              errors.date ? 'border-red-400' : 'border-gray-300'
                            }`}
                          />
                          {errors.date && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.date}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Selesai{' '}
                            <span className="text-gray-400 font-normal text-xs">
                              (opsional)
                            </span>
                          </label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => set('endDate', e.target.value)}
                            min={formData.date}
                            className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lokasi{' '}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => set('location', e.target.value)}
                          placeholder="contoh: Madiun, Jawa Timur"
                          className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Detail ── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Keterangan{' '}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => set('description', e.target.value)}
                          rows={3}
                          placeholder="Cerita singkat tentang acara ini..."
                          className="block w-full rounded-lg border-gray-300 shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500 resize-none"
                        />
                      </div>

                      <AttendeeSelector
                        value={formData.attendeeIds}
                        onChange={(ids) => set('attendeeIds', ids)}
                        persons={persons}
                        enabled={formData.restrictAccess}
                        onEnabledChange={(enabled) => {
                          set('restrictAccess', enabled);
                          if (!enabled) set('attendeeIds', []);
                        }}
                      />

                      <PersonSelector
                        value={formData.personIds}
                        onChange={(ids) => set('personIds', ids)}
                        persons={persons}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Foto Acara{' '}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <ImageDropzone
                          value={formData.photos}
                          onChange={(photos) => set('photos', photos)}
                          purpose="event"
                          contextId={eventToEdit?.id}
                          onPendingTrack={mediaSession.trackPending}
                          onPendingUntrack={mediaSession.untrackPending}
                          multiple
                          maxFiles={10}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={step === 1 ? handleClose : () => setStep(1)}
                      className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {step === 1 ? 'Batal' : '← Kembali'}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {step} / {STEPS.length}
                      </span>
                      {step < 2 ? (
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
                          {isEditing ? 'Simpan Perubahan' : 'Tambah Acara'}
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
