import { useMemo, useState, type FormEvent } from 'react';
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
import { useFamilyCoreHealth } from '@/modules/family-core/context/FamilyCoreHealthContext';
import {
  useFamilyCoreUi,
  type HealthModalSection,
  type HealthModalState,
} from '@/modules/family-core/context/FamilyCoreUiContext';
import { CORE_MEMBERS } from '@/modules/family-core/mocks/coreMembers';
import type { BloodType, HealthXrayBodyPart } from '@/modules/family-core/types';

const FORM_ID = 'core-health-form';

const BLOOD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Belum diisi' },
  ...'A+ A- B+ B- AB+ AB- O+ O-'.split(' ').map((v) => ({ value: v, label: v })),
];

const XRAY_BODY_OPTIONS: { value: HealthXrayBodyPart; label: string }[] = [
  { value: 'dada', label: 'Dada / thorax' },
  { value: 'kepala', label: 'Kepala' },
  { value: 'gigi', label: 'Gigi' },
  { value: 'tulang', label: 'Tulang' },
  { value: 'perut', label: 'Perut' },
  { value: 'lainnya', label: 'Lainnya' },
];

const SECTION_TITLE: Record<HealthModalSection, string> = {
  basics: 'Data dasar',
  allergy: 'Alergi',
  medication: 'Obat rutin',
  appointment: 'Jadwal dokter',
  condition: 'Riwayat penyakit',
  surgery: 'Riwayat operasi',
  vaccine: 'Vaksin',
  note: 'Catatan dokter / lab',
  xray: 'Foto rontgen',
  growth: 'Growth tracker',
};

export function HealthFormModal() {
  const { healthModal, closeHealthModal, openHealthModal } = useFamilyCoreUi();
  if (!healthModal) return null;

  return (
    <HealthFormModalInner
      key={`${healthModal.section}-${healthModal.memberId}-${healthModal.editId ?? 'new'}`}
      state={healthModal}
      onClose={closeHealthModal}
      onAgain={() =>
        openHealthModal({
          section: healthModal.section,
          memberId: healthModal.memberId,
        })
      }
    />
  );
}

function HealthFormModalInner({
  state,
  onClose,
  onAgain,
}: {
  state: HealthModalState;
  onClose: () => void;
  onAgain: () => void;
}) {
  const health = useFamilyCoreHealth();
  const { addEvent } = useFamilyCoreCalendar();
  const profile = health.getProfile(state.memberId);
  const member = CORE_MEMBERS.find((m) => m.id === state.memberId);
  const isEdit = Boolean(state.editId);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Shared field bags — only relevant keys used per section
  const [bloodType, setBloodType] = useState(profile.basics.bloodType ?? '');
  const [heightCm, setHeightCm] = useState(
    profile.basics.heightCm != null ? String(profile.basics.heightCm) : '',
  );
  const [weightKg, setWeightKg] = useState(
    profile.basics.weightKg != null ? String(profile.basics.weightKg) : '',
  );
  const [basicsNotes, setBasicsNotes] = useState(profile.basics.notes);

  const allergy = useMemo(
    () => profile.allergies.find((a) => a.id === state.editId),
    [profile.allergies, state.editId],
  );
  const [allergyName, setAllergyName] = useState(allergy?.name ?? '');
  const [allergyKind, setAllergyKind] = useState(allergy?.kind ?? 'obat');
  const [allergySeverity, setAllergySeverity] = useState(
    allergy?.severity ?? 'sedang',
  );
  const [allergyNotes, setAllergyNotes] = useState(allergy?.notes ?? '');

  const med = useMemo(
    () => profile.medications.find((m) => m.id === state.editId),
    [profile.medications, state.editId],
  );
  const [medName, setMedName] = useState(med?.name ?? '');
  const [medDose, setMedDose] = useState(med?.dose ?? '');
  const [medSchedule, setMedSchedule] = useState(med?.schedule ?? '');
  const [medReminder, setMedReminder] = useState(med?.reminderEnabled ?? true);
  const [medNotes, setMedNotes] = useState(med?.notes ?? '');

  const appt = useMemo(
    () => profile.appointments.find((a) => a.id === state.editId),
    [profile.appointments, state.editId],
  );
  const [apptTitle, setApptTitle] = useState(appt?.title ?? '');
  const [apptDoctor, setApptDoctor] = useState(appt?.doctor ?? '');
  const [apptPlace, setApptPlace] = useState(appt?.place ?? '');
  const [apptDate, setApptDate] = useState(
    appt?.at ? appt.at.slice(0, 10) : '',
  );
  const [apptTime, setApptTime] = useState(
    appt?.at && appt.at.includes('T') ? appt.at.slice(11, 16) : '09:00',
  );
  const [apptReminder, setApptReminder] = useState(
    appt?.reminderEnabled ?? true,
  );
  const [apptNotes, setApptNotes] = useState(appt?.notes ?? '');
  const [linkCalendar, setLinkCalendar] = useState(true);

  const condition = useMemo(
    () => profile.conditions.find((c) => c.id === state.editId),
    [profile.conditions, state.editId],
  );
  const [condName, setCondName] = useState(condition?.name ?? '');
  const [condDate, setCondDate] = useState(condition?.diagnosedAt ?? '');
  const [condStatus, setCondStatus] = useState(condition?.status ?? 'pantau');
  const [condNotes, setCondNotes] = useState(condition?.notes ?? '');

  const surgery = useMemo(
    () => profile.surgeries.find((s) => s.id === state.editId),
    [profile.surgeries, state.editId],
  );
  const [surgName, setSurgName] = useState(surgery?.name ?? '');
  const [surgDate, setSurgDate] = useState(surgery?.date ?? '');
  const [surgHospital, setSurgHospital] = useState(surgery?.hospital ?? '');
  const [surgNotes, setSurgNotes] = useState(surgery?.notes ?? '');

  const vaccine = useMemo(
    () => profile.vaccines.find((v) => v.id === state.editId),
    [profile.vaccines, state.editId],
  );
  const [vacName, setVacName] = useState(vaccine?.name ?? '');
  const [vacDate, setVacDate] = useState(vaccine?.date ?? '');
  const [vacDose, setVacDose] = useState(vaccine?.doseLabel ?? '');
  const [vacNotes, setVacNotes] = useState(vaccine?.notes ?? '');

  const note = useMemo(
    () => profile.notes.find((n) => n.id === state.editId),
    [profile.notes, state.editId],
  );
  const [noteTitle, setNoteTitle] = useState(note?.title ?? '');
  const [noteKind, setNoteKind] = useState(note?.kind ?? 'dokter');
  const [noteDate, setNoteDate] = useState(note?.date ?? '');
  const [noteSummary, setNoteSummary] = useState(note?.summary ?? '');

  const xray = useMemo(
    () => (profile.xrays ?? []).find((x) => x.id === state.editId),
    [profile.xrays, state.editId],
  );
  const [xrayTitle, setXrayTitle] = useState(xray?.title ?? '');
  const [xrayBodyPart, setXrayBodyPart] = useState<HealthXrayBodyPart>(
    xray?.bodyPart ?? 'dada',
  );
  const [xrayDate, setXrayDate] = useState(xray?.date ?? '');
  const [xrayFacility, setXrayFacility] = useState(xray?.facility ?? '');
  const [xrayNotes, setXrayNotes] = useState(xray?.notes ?? '');
  const [xrayImageUrl, setXrayImageUrl] = useState(xray?.imageUrl ?? null);

  const growth = useMemo(
    () => profile.growth.find((g) => g.id === state.editId),
    [profile.growth, state.editId],
  );
  const [growthDate, setGrowthDate] = useState(growth?.date ?? '');
  const [growthHeight, setGrowthHeight] = useState(
    growth ? String(growth.heightCm) : '',
  );
  const [growthWeight, setGrowthWeight] = useState(
    growth ? String(growth.weightKg) : '',
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const memberId = state.memberId;

    try {
      switch (state.section) {
        case 'basics': {
          health.updateBasics(memberId, {
            bloodType: (bloodType || null) as BloodType | null,
            heightCm: heightCm ? Number(heightCm) : null,
            weightKg: weightKg ? Number(weightKg) : null,
            notes: basicsNotes.trim(),
          });
          break;
        }
        case 'allergy': {
          if (!allergyName.trim()) throw new Error('Nama alergi wajib diisi.');
          health.upsertAllergy(memberId, {
            id: state.editId,
            name: allergyName.trim(),
            kind: allergyKind as 'obat' | 'makanan' | 'lainnya',
            severity: allergySeverity as 'ringan' | 'sedang' | 'berat',
            notes: allergyNotes.trim(),
          });
          break;
        }
        case 'medication': {
          if (!medName.trim()) throw new Error('Nama obat wajib diisi.');
          health.upsertMedication(memberId, {
            id: state.editId,
            name: medName.trim(),
            dose: medDose.trim() || '—',
            schedule: medSchedule.trim() || '—',
            reminderEnabled: medReminder,
            notes: medNotes.trim(),
          });
          break;
        }
        case 'appointment': {
          if (!apptTitle.trim()) throw new Error('Judul jadwal wajib diisi.');
          if (!apptDate) throw new Error('Tanggal wajib diisi.');
          const at = `${apptDate}T${apptTime || '09:00'}:00`;
          const saved = health.upsertAppointment(memberId, {
            id: state.editId,
            title: apptTitle.trim(),
            doctor: apptDoctor.trim(),
            place: apptPlace.trim(),
            at,
            reminderEnabled: apptReminder,
            notes: apptNotes.trim(),
            calendarEventId: appt?.calendarEventId ?? null,
          });
          if (!isEdit && linkCalendar) {
            const cal = addEvent({
              type: 'dokter',
              title: `${apptTitle.trim()}${member ? ` — ${member.name}` : ''}`,
              date: apptDate,
              endDate: null,
              time: apptTime || '09:00',
              allDay: false,
              memberId,
              location: apptPlace.trim(),
              notes: apptNotes.trim(),
              healthAppointmentId: saved.id,
              reminderEnabled: apptReminder,
            });
            health.upsertAppointment(memberId, {
              ...saved,
              calendarEventId: cal.id,
            });
          }
          break;
        }
        case 'condition': {
          if (!condName.trim()) throw new Error('Nama diagnosis wajib diisi.');
          health.upsertCondition(memberId, {
            id: state.editId,
            name: condName.trim(),
            diagnosedAt: condDate || null,
            status: condStatus as 'aktif' | 'sembuh' | 'pantau',
            notes: condNotes.trim(),
          });
          break;
        }
        case 'surgery': {
          if (!surgName.trim()) throw new Error('Nama operasi wajib diisi.');
          health.upsertSurgery(memberId, {
            id: state.editId,
            name: surgName.trim(),
            date: surgDate || null,
            hospital: surgHospital.trim(),
            notes: surgNotes.trim(),
          });
          break;
        }
        case 'vaccine': {
          if (!vacName.trim()) throw new Error('Nama vaksin wajib diisi.');
          health.upsertVaccine(memberId, {
            id: state.editId,
            name: vacName.trim(),
            date: vacDate || null,
            doseLabel: vacDose.trim() || '—',
            notes: vacNotes.trim(),
          });
          break;
        }
        case 'note': {
          if (!noteTitle.trim()) throw new Error('Judul catatan wajib diisi.');
          health.upsertNote(memberId, {
            id: state.editId,
            title: noteTitle.trim(),
            kind: noteKind as 'dokter' | 'lab' | 'lainnya',
            date: noteDate || null,
            summary: noteSummary.trim(),
          });
          break;
        }
        case 'xray': {
          if (!xrayTitle.trim()) throw new Error('Judul rontgen wajib diisi.');
          health.upsertXray(memberId, {
            id: state.editId,
            title: xrayTitle.trim(),
            bodyPart: xrayBodyPart,
            date: xrayDate || null,
            facility: xrayFacility.trim(),
            notes: xrayNotes.trim(),
            imageUrl: xrayImageUrl,
          });
          break;
        }
        case 'growth': {
          if (!growthDate) throw new Error('Tanggal wajib diisi.');
          if (!growthHeight || !growthWeight) {
            throw new Error('Tinggi dan berat wajib diisi.');
          }
          health.upsertGrowth(memberId, {
            id: state.editId,
            date: growthDate,
            heightCm: Number(growthHeight),
            weightKg: Number(growthWeight),
          });
          break;
        }
      }
      setError(null);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    }
  };

  if (success) {
    return (
      <CoreModalShell title="Tersimpan" onClose={onClose}>
        <CoreSuccessPanel
          title={isEdit ? 'Perubahan disimpan' : 'Data ditambahkan'}
          description={`${SECTION_TITLE[state.section]} · ${member?.name ?? ''}`}
          onAgain={isEdit || state.section === 'basics' ? undefined : onAgain}
          onDone={onClose}
        />
      </CoreModalShell>
    );
  }

  return (
    <CoreModalShell
      title={`${isEdit ? 'Edit' : 'Tambah'} ${SECTION_TITLE[state.section]}`}
      subtitle={member ? `Untuk ${member.name}` : undefined}
      onClose={onClose}
      wide
      footer={
        <CoreFormFooter
          formId={FORM_ID}
          onCancel={onClose}
          submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan'}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {state.section === 'basics' ? (
          <>
            <div>
              <FieldLabel>Golongan darah</FieldLabel>
              <FieldSelect
                value={bloodType}
                onChange={setBloodType}
                options={BLOOD_OPTIONS}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Tinggi (cm)</FieldLabel>
                <FieldInput
                  type="number"
                  value={heightCm}
                  onChange={setHeightCm}
                  placeholder="170"
                />
              </div>
              <div>
                <FieldLabel>Berat (kg)</FieldLabel>
                <FieldInput
                  type="number"
                  value={weightKg}
                  onChange={setWeightKg}
                  placeholder="65"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea
                value={basicsNotes}
                onChange={setBasicsNotes}
                placeholder="Opsional"
              />
            </div>
          </>
        ) : null}

        {state.section === 'allergy' ? (
          <>
            <div>
              <FieldLabel>Nama alergi</FieldLabel>
              <FieldInput
                value={allergyName}
                onChange={setAllergyName}
                placeholder="Contoh: Penisilin"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Jenis</FieldLabel>
                <FieldSelect
                  value={allergyKind}
                  onChange={(v) =>
                    setAllergyKind(v as 'obat' | 'makanan' | 'lainnya')
                  }
                  options={[
                    { value: 'obat', label: 'Obat' },
                    { value: 'makanan', label: 'Makanan' },
                    { value: 'lainnya', label: 'Lainnya' },
                  ]}
                />
              </div>
              <div>
                <FieldLabel>Tingkat</FieldLabel>
                <FieldSelect
                  value={allergySeverity}
                  onChange={(v) =>
                    setAllergySeverity(v as 'ringan' | 'sedang' | 'berat')
                  }
                  options={[
                    { value: 'ringan', label: 'Ringan' },
                    { value: 'sedang', label: 'Sedang' },
                    { value: 'berat', label: 'Berat' },
                  ]}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea value={allergyNotes} onChange={setAllergyNotes} />
            </div>
          </>
        ) : null}

        {state.section === 'medication' ? (
          <>
            <div>
              <FieldLabel>Nama obat</FieldLabel>
              <FieldInput value={medName} onChange={setMedName} />
            </div>
            <div>
              <FieldLabel>Dosis</FieldLabel>
              <FieldInput
                value={medDose}
                onChange={setMedDose}
                placeholder="5 mg"
              />
            </div>
            <div>
              <FieldLabel>Jadwal minum</FieldLabel>
              <FieldInput
                value={medSchedule}
                onChange={setMedSchedule}
                placeholder="Setiap pagi setelah makan"
              />
            </div>
            <ToggleRow
              label="Reminder minum obat"
              checked={medReminder}
              onChange={setMedReminder}
            />
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea value={medNotes} onChange={setMedNotes} />
            </div>
          </>
        ) : null}

        {state.section === 'appointment' ? (
          <>
            <div>
              <FieldLabel>Judul</FieldLabel>
              <FieldInput
                value={apptTitle}
                onChange={setApptTitle}
                placeholder="Kontrol rutin"
              />
            </div>
            <div>
              <FieldLabel>Dokter</FieldLabel>
              <FieldInput value={apptDoctor} onChange={setApptDoctor} />
            </div>
            <div>
              <FieldLabel>Tempat</FieldLabel>
              <FieldInput value={apptPlace} onChange={setApptPlace} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Tanggal</FieldLabel>
                <FieldInput
                  type="date"
                  value={apptDate}
                  onChange={setApptDate}
                />
              </div>
              <div>
                <FieldLabel>Waktu</FieldLabel>
                <FieldInput
                  type="time"
                  value={apptTime}
                  onChange={setApptTime}
                />
              </div>
            </div>
            <ToggleRow
              label="Reminder jadwal"
              checked={apptReminder}
              onChange={setApptReminder}
            />
            {!isEdit ? (
              <ToggleRow
                label="Tambah ke Family Calendar"
                description="Sinkron sebagai event tipe Dokter."
                checked={linkCalendar}
                onChange={setLinkCalendar}
              />
            ) : null}
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea value={apptNotes} onChange={setApptNotes} />
            </div>
          </>
        ) : null}

        {state.section === 'condition' ? (
          <>
            <div>
              <FieldLabel>Diagnosis</FieldLabel>
              <FieldInput value={condName} onChange={setCondName} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Tanggal diagnosis</FieldLabel>
                <FieldInput
                  type="date"
                  value={condDate}
                  onChange={setCondDate}
                />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <FieldSelect
                  value={condStatus}
                  onChange={(v) =>
                    setCondStatus(v as 'aktif' | 'sembuh' | 'pantau')
                  }
                  options={[
                    { value: 'aktif', label: 'Aktif' },
                    { value: 'pantau', label: 'Pantau' },
                    { value: 'sembuh', label: 'Sembuh' },
                  ]}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea value={condNotes} onChange={setCondNotes} />
            </div>
          </>
        ) : null}

        {state.section === 'surgery' ? (
          <>
            <div>
              <FieldLabel>Nama operasi</FieldLabel>
              <FieldInput value={surgName} onChange={setSurgName} />
            </div>
            <div>
              <FieldLabel>Tanggal</FieldLabel>
              <FieldInput type="date" value={surgDate} onChange={setSurgDate} />
            </div>
            <div>
              <FieldLabel>Rumah sakit</FieldLabel>
              <FieldInput value={surgHospital} onChange={setSurgHospital} />
            </div>
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea value={surgNotes} onChange={setSurgNotes} />
            </div>
          </>
        ) : null}

        {state.section === 'vaccine' ? (
          <>
            <div>
              <FieldLabel>Nama vaksin</FieldLabel>
              <FieldInput value={vacName} onChange={setVacName} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Tanggal</FieldLabel>
                <FieldInput type="date" value={vacDate} onChange={setVacDate} />
              </div>
              <div>
                <FieldLabel>Dosis / label</FieldLabel>
                <FieldInput
                  value={vacDose}
                  onChange={setVacDose}
                  placeholder="Booster 1"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea value={vacNotes} onChange={setVacNotes} />
            </div>
          </>
        ) : null}

        {state.section === 'note' ? (
          <>
            <div>
              <FieldLabel>Judul</FieldLabel>
              <FieldInput value={noteTitle} onChange={setNoteTitle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Jenis</FieldLabel>
                <FieldSelect
                  value={noteKind}
                  onChange={(v) =>
                    setNoteKind(v as 'dokter' | 'lab' | 'lainnya')
                  }
                  options={[
                    { value: 'dokter', label: 'Dokter' },
                    { value: 'lab', label: 'Lab' },
                    { value: 'lainnya', label: 'Lainnya' },
                  ]}
                />
              </div>
              <div>
                <FieldLabel>Tanggal</FieldLabel>
                <FieldInput
                  type="date"
                  value={noteDate}
                  onChange={setNoteDate}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Ringkasan</FieldLabel>
              <FieldTextarea
                value={noteSummary}
                onChange={setNoteSummary}
                rows={4}
              />
            </div>
          </>
        ) : null}

        {state.section === 'xray' ? (
          <>
            <div>
              <FieldLabel>Judul</FieldLabel>
              <FieldInput
                value={xrayTitle}
                onChange={setXrayTitle}
                placeholder="Contoh: Rontgen thorax"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Bagian tubuh</FieldLabel>
                <FieldSelect
                  value={xrayBodyPart}
                  onChange={(v) => setXrayBodyPart(v as HealthXrayBodyPart)}
                  options={XRAY_BODY_OPTIONS}
                />
              </div>
              <div>
                <FieldLabel>Tanggal</FieldLabel>
                <FieldInput
                  type="date"
                  value={xrayDate}
                  onChange={setXrayDate}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Fasilitas / rumah sakit</FieldLabel>
              <FieldInput
                value={xrayFacility}
                onChange={setXrayFacility}
                placeholder="RS / klinik radiologi"
              />
            </div>
            <div>
              <FieldLabel>Catatan</FieldLabel>
              <FieldTextarea
                value={xrayNotes}
                onChange={setXrayNotes}
                placeholder="Hasil / keterangan dokter"
              />
            </div>
            <div className="rounded-[12px] border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center">
              <p className="text-[13px] font-semibold text-brand-600">
                Foto rontgen
              </p>
              <p className="mt-1 text-[12px] text-brand-400">
                Dummy — upload media menyusul. Untuk demo, tandai punya preview.
              </p>
              <button
                type="button"
                onClick={() =>
                  setXrayImageUrl((prev) =>
                    prev
                      ? null
                      : 'data:image/svg+xml,' +
                        encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300"><rect width="240" height="300" fill="#0f172a"/><ellipse cx="120" cy="90" rx="48" ry="58" fill="#94a3b8" opacity=".45"/><rect x="95" y="140" width="50" height="110" rx="8" fill="#cbd5e1" opacity=".3"/><text x="120" y="280" text-anchor="middle" fill="#64748b" font-size="12" font-family="sans-serif">Preview rontgen</text></svg>`,
                        ),
                  )
                }
                className="mt-3 text-[12px] font-bold text-sky-700 hover:underline"
              >
                {xrayImageUrl ? 'Hapus preview dummy' : 'Pakai preview dummy'}
              </button>
            </div>
          </>
        ) : null}

        {state.section === 'growth' ? (
          <>
            <div>
              <FieldLabel>Tanggal ukur</FieldLabel>
              <FieldInput
                type="date"
                value={growthDate}
                onChange={setGrowthDate}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Tinggi (cm)</FieldLabel>
                <FieldInput
                  type="number"
                  value={growthHeight}
                  onChange={setGrowthHeight}
                />
              </div>
              <div>
                <FieldLabel>Berat (kg)</FieldLabel>
                <FieldInput
                  type="number"
                  value={growthWeight}
                  onChange={setGrowthWeight}
                />
              </div>
            </div>
          </>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </form>
    </CoreModalShell>
  );
}
