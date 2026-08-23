import { useState, type FormEvent } from 'react';
import {
  FieldInput,
  FieldLabel,
  ToggleRow,
} from '@/modules/family-core/components/CoreFormFields';
import {
  CoreFormFooter,
  CoreModalShell,
  CoreSuccessPanel,
} from '@/modules/family-core/components/CoreModalShell';
import { useFamilyCoreCalendarEventTypes } from '@/modules/family-core/context/FamilyCoreCalendarEventTypesContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import {
  CALENDAR_TYPE_ICON_OPTIONS,
  CALENDAR_TYPE_ICONS,
  CALENDAR_TYPE_TONES,
  resolveCalendarEventType,
} from '@/modules/family-core/lib/calendarEventMeta';
import type {
  CalendarEventTypeIconKey,
  CalendarEventTypeToneKey,
} from '@/modules/family-core/types';

const FORM_ID = 'core-calendar-event-type-form';

export function CalendarEventTypeFormModal() {
  const {
    calendarEventTypeModal,
    closeCalendarEventTypeModal,
    openCalendarEventTypeModal,
  } = useFamilyCoreUi();
  const { getTypeById, addType, updateType } =
    useFamilyCoreCalendarEventTypes();

  if (!calendarEventTypeModal) return null;

  const existing = calendarEventTypeModal.typeId
    ? getTypeById(calendarEventTypeModal.typeId)
    : undefined;

  return (
    <CalendarEventTypeFormModalInner
      key={calendarEventTypeModal.typeId ?? 'new'}
      existing={existing}
      addType={addType}
      updateType={updateType}
      onClose={closeCalendarEventTypeModal}
      onAgain={() => openCalendarEventTypeModal()}
    />
  );
}

function CalendarEventTypeFormModalInner({
  existing,
  addType,
  updateType,
  onClose,
  onAgain,
}: {
  existing: ReturnType<
    ReturnType<typeof useFamilyCoreCalendarEventTypes>['getTypeById']
  >;
  addType: ReturnType<typeof useFamilyCoreCalendarEventTypes>['addType'];
  updateType: ReturnType<typeof useFamilyCoreCalendarEventTypes>['updateType'];
  onClose: () => void;
  onAgain: () => void;
}) {
  const isEdit = Boolean(existing);
  const [label, setLabel] = useState(existing?.label ?? '');
  const [iconKey, setIconKey] = useState<CalendarEventTypeIconKey>(
    existing?.iconKey ?? 'calendar',
  );
  const [toneKey, setToneKey] = useState<CalendarEventTypeToneKey>(
    existing?.toneKey ?? 'sky',
  );
  const [linksToHealth, setLinksToHealth] = useState(
    existing?.linksToHealth ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const preview = resolveCalendarEventType({
    id: existing?.id ?? 'preview',
    slug: existing?.slug ?? 'preview',
    label: label || 'Preview',
    iconKey,
    toneKey,
    linksToHealth,
    isSystem: existing?.isSystem ?? false,
    sortOrder: existing?.sortOrder ?? 0,
  });
  const PreviewIcon = preview.Icon;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Nama tipe wajib diisi.');
      return;
    }

    try {
      if (isEdit && existing) {
        await updateType(existing.id, {
          label: label.trim(),
          iconKey,
          toneKey,
          linksToHealth,
        });
      } else {
        await addType({
          label: label.trim(),
          iconKey,
          toneKey,
          linksToHealth,
        });
      }
      setError(null);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan tipe kalender.',
      );
    }
  };

  if (success) {
    return (
      <CoreModalShell title="Tersimpan" onClose={onClose}>
        <CoreSuccessPanel
          title={isEdit ? 'Tipe kalender diperbarui' : 'Tipe kalender ditambah'}
          description="Master data tersimpan (API atau mock sesuai sumber data)."
          onAgain={isEdit ? undefined : onAgain}
          onDone={onClose}
        />
      </CoreModalShell>
    );
  }

  return (
    <CoreModalShell
      title={isEdit ? 'Edit tipe kalender' : 'Tambah tipe kalender'}
      subtitle={
        existing?.isSystem
          ? `Bawaan seeder · slug: ${existing.slug}`
          : 'Master data Family Calendar'
      }
      onClose={onClose}
      wide
      footer={
        <CoreFormFooter
          formId={FORM_ID}
          onCancel={onClose}
          submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan tipe'}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-3">
          <span
            className={[
              'flex h-11 w-11 items-center justify-center rounded-[12px]',
              preview.toneBg,
              preview.toneText,
            ].join(' ')}
          >
            <PreviewIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-brand-800">
              {label.trim() || 'Preview tipe'}
            </p>
            <p className="text-[11.5px] text-brand-400">
              {linksToHealth ? 'Link ke Health Tracker' : 'Kalender biasa'}
            </p>
          </div>
          <span className={`ml-auto h-2.5 w-2.5 rounded-full ${preview.dot}`} />
        </div>

        <div>
          <FieldLabel>Nama tipe</FieldLabel>
          <FieldInput
            value={label}
            onChange={setLabel}
            placeholder="Contoh: Liburan keluarga"
          />
        </div>

        <div>
          <FieldLabel>Ikon</FieldLabel>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {CALENDAR_TYPE_ICON_OPTIONS.map((opt) => {
              const Icon = CALENDAR_TYPE_ICONS[opt.value];
              const active = iconKey === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIconKey(opt.value)}
                  className={[
                    'flex flex-col items-center gap-1 rounded-[10px] border-2 px-1 py-2 text-[10px] font-bold',
                    active
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-gray-200 bg-white text-brand-500',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Warna</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {(
              Object.keys(CALENDAR_TYPE_TONES) as CalendarEventTypeToneKey[]
            ).map((key) => {
              const tone = CALENDAR_TYPE_TONES[key];
              const active = toneKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setToneKey(key)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                    active
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-gray-200 bg-white text-brand-500',
                  ].join(' ')}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  {tone.label}
                </button>
              );
            })}
          </div>
        </div>

        <ToggleRow
          label="Link ke Health Tracker"
          description="Event bisa dihubungkan ke jadwal dokter / kontrol."
          checked={linksToHealth}
          onChange={setLinksToHealth}
        />

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </form>
    </CoreModalShell>
  );
}
