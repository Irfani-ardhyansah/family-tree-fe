import { useState, type FormEvent } from 'react';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  ToggleRow,
} from '@/modules/family-core/components/CoreFormFields';
import {
  CoreFormFooter,
  CoreModalShell,
  CoreSuccessPanel,
} from '@/modules/family-core/components/CoreModalShell';
import { useFamilyCoreCalendar } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { useFamilyCoreCalendarEventTypes } from '@/modules/family-core/context/FamilyCoreCalendarEventTypesContext';
import {
  useFamilyCoreUi,
  type CalendarModalState,
} from '@/modules/family-core/context/FamilyCoreUiContext';
import { resolveCalendarEventType } from '@/modules/family-core/lib/calendarEventMeta';
import {
  CORE_MEMBER_ROLE_LABEL,
  CORE_MEMBERS,
} from '@/modules/family-core/mocks/coreMembers';
import type { CalendarEventTypeSlug } from '@/modules/family-core/types';

const FORM_ID = 'core-calendar-event-form';

type FormState = {
  type: CalendarEventTypeSlug;
  title: string;
  date: string;
  endDate: string;
  time: string;
  allDay: boolean;
  memberId: string;
  location: string;
  notes: string;
  reminderEnabled: boolean;
};

function buildInitial(
  state: CalendarModalState,
  getEvent: ReturnType<typeof useFamilyCoreCalendar>['getEvent'],
  defaultType: CalendarEventTypeSlug,
): FormState {
  const existing = state.eventId ? getEvent(state.eventId) : undefined;
  if (existing) {
    return {
      type: existing.type,
      title: existing.title,
      date: existing.date,
      endDate: existing.endDate ?? '',
      time: existing.time ?? '',
      allDay: existing.allDay,
      memberId: existing.memberId ?? '',
      location: existing.location,
      notes: existing.notes,
      reminderEnabled: existing.reminderEnabled,
    };
  }
  return {
    type: defaultType,
    title: '',
    date: state.defaultDate ?? '',
    endDate: '',
    time: '',
    allDay: true,
    memberId: state.defaultMemberId ?? '',
    location: '',
    notes: '',
    reminderEnabled: true,
  };
}

export function CalendarEventModal() {
  const { calendarModal, closeCalendarModal, openCalendarModal } =
    useFamilyCoreUi();
  const { getEvent, addEvent, updateEvent } = useFamilyCoreCalendar();
  const { types } = useFamilyCoreCalendarEventTypes();

  if (!calendarModal) return null;

  return (
    <CalendarEventModalInner
      key={calendarModal.eventId ?? `new-${calendarModal.defaultDate ?? 'x'}`}
      state={calendarModal}
      types={types}
      getEvent={getEvent}
      addEvent={addEvent}
      updateEvent={updateEvent}
      onClose={closeCalendarModal}
      onAgain={() =>
        openCalendarModal({
          defaultDate: calendarModal.defaultDate,
          defaultMemberId: calendarModal.defaultMemberId,
        })
      }
    />
  );
}

function CalendarEventModalInner({
  state,
  types,
  getEvent,
  addEvent,
  updateEvent,
  onClose,
  onAgain,
}: {
  state: CalendarModalState;
  types: ReturnType<typeof useFamilyCoreCalendarEventTypes>['types'];
  getEvent: ReturnType<typeof useFamilyCoreCalendar>['getEvent'];
  addEvent: ReturnType<typeof useFamilyCoreCalendar>['addEvent'];
  updateEvent: ReturnType<typeof useFamilyCoreCalendar>['updateEvent'];
  onClose: () => void;
  onAgain: () => void;
}) {
  const isEdit = Boolean(state.eventId);
  const defaultType = types[0]?.slug ?? 'lainnya';
  const [form, setForm] = useState(() =>
    buildInitial(state, getEvent, defaultType),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Judul wajib diisi.');
      return;
    }
    if (!form.date) {
      setError('Tanggal wajib diisi.');
      return;
    }
    if (!form.allDay && !form.time) {
      setError('Isi waktu, atau aktifkan Seharian.');
      return;
    }

    const draft = {
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      endDate: form.endDate && form.endDate !== form.date ? form.endDate : null,
      time: form.allDay ? null : form.time,
      allDay: form.allDay,
      memberId: form.memberId || null,
      location: form.location.trim(),
      notes: form.notes.trim(),
      healthAppointmentId: state.eventId
        ? (getEvent(state.eventId!)?.healthAppointmentId ?? null)
        : null,
      reminderEnabled: form.reminderEnabled,
    };

    if (isEdit && state.eventId) {
      updateEvent(state.eventId, draft);
    } else {
      addEvent(draft);
    }
    setError(null);
    setSuccess(true);
  };

  if (success) {
    return (
      <CoreModalShell
        title={isEdit ? 'Jadwal diubah' : 'Jadwal ditambah'}
        onClose={onClose}
      >
        <CoreSuccessPanel
          title={isEdit ? 'Perubahan disimpan' : 'Jadwal tersimpan'}
          description="Data dummy — hanya di sesi ini."
          onAgain={isEdit ? undefined : onAgain}
          onDone={onClose}
        />
      </CoreModalShell>
    );
  }

  return (
    <CoreModalShell
      title={isEdit ? 'Edit jadwal' : 'Tambah jadwal'}
      subtitle="Family calendar"
      onClose={onClose}
      wide
      footer={
        <CoreFormFooter
          formId={FORM_ID}
          onCancel={onClose}
          submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan jadwal'}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel>Tipe</FieldLabel>
          {types.length === 0 ? (
            <p className="rounded-[12px] bg-rose-50 px-3 py-3 text-[12.5px] font-semibold text-rose-700">
              Belum ada tipe kalender. Tambah dulu di menu Tipe.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {types.map((t) => {
                const resolved = resolveCalendarEventType(t);
                const active = form.type === t.slug;
                const Icon = resolved.Icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setField('type', t.slug)}
                    className={[
                      'flex flex-col items-center gap-1 rounded-[12px] border-2 px-2 py-2.5 text-[11px] font-bold transition-colors',
                      active
                        ? `${resolved.toneBg} ${resolved.toneText} border-current`
                        : 'border-gray-200 bg-white text-brand-500 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Judul</FieldLabel>
          <FieldInput
            value={form.title}
            onChange={(v) => setField('title', v)}
            placeholder="Contoh: Ujian matematika"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Tanggal mulai</FieldLabel>
            <FieldInput
              type="date"
              value={form.date}
              onChange={(v) => setField('date', v)}
            />
          </div>
          <div>
            <FieldLabel>Tanggal selesai</FieldLabel>
            <FieldInput
              type="date"
              value={form.endDate}
              onChange={(v) => setField('endDate', v)}
            />
          </div>
        </div>

        <ToggleRow
          label="Seharian"
          description="Tanpa jam spesifik."
          checked={form.allDay}
          onChange={(v) => setField('allDay', v)}
        />

        {!form.allDay ? (
          <div>
            <FieldLabel>Waktu</FieldLabel>
            <FieldInput
              type="time"
              value={form.time}
              onChange={(v) => setField('time', v)}
            />
          </div>
        ) : null}

        <div>
          <FieldLabel>Anggota (opsional)</FieldLabel>
          <FieldSelect
            value={form.memberId}
            onChange={(v) => setField('memberId', v)}
            options={[
              { value: '', label: 'Keluarga (umum)' },
              ...CORE_MEMBERS.map((m) => ({
                value: m.id,
                label: `${m.name} · ${CORE_MEMBER_ROLE_LABEL[m.role]}`,
              })),
            ]}
          />
        </div>

        <div>
          <FieldLabel>Lokasi</FieldLabel>
          <FieldInput
            value={form.location}
            onChange={(v) => setField('location', v)}
            placeholder="Opsional"
          />
        </div>

        <ToggleRow
          label="Reminder"
          checked={form.reminderEnabled}
          onChange={(v) => setField('reminderEnabled', v)}
        />

        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldTextarea
            value={form.notes}
            onChange={(v) => setField('notes', v)}
            placeholder="Opsional"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </form>
    </CoreModalShell>
  );
}
