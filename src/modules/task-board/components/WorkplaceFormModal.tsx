import { useState } from 'react';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  cx,
} from '@/shared/ui';
import {
  EMPLOYMENT_META,
  WORKPLACE_ACCENT_KEYS,
  workplaceAccent,
} from '../lib/workplaceMeta';
import { toWorkplaceFormData } from '../lib/workplaceStore';
import type {
  EmploymentType,
  Workplace,
  WorkplaceFormData,
} from '../types';

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = (
  Object.keys(EMPLOYMENT_META) as EmploymentType[]
).map((value) => ({ value, label: EMPLOYMENT_META[value].label }));

const EMPTY_FORM: WorkplaceFormData = {
  name: '',
  employmentType: 'Fulltime',
  role: '',
  location: '',
  accent: 'amber',
  startedAt: '',
  endedAt: '',
};

export function WorkplaceFormModal({
  mode,
  initial,
  onClose,
  onSave,
  saving = false,
}: {
  mode: 'create' | 'edit';
  initial?: Workplace | null;
  onClose: () => void;
  onSave: (data: WorkplaceFormData) => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<WorkplaceFormData>(() =>
    mode === 'edit' && initial ? toWorkplaceFormData(initial) : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WorkplaceFormData>(
    key: K,
    value: WorkplaceFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError('Nama tempat kerja wajib diisi.');
      return;
    }
    setError(null);
    onSave(form);
  };

  return (
    <ModalShell
      accent="task"
      wide
      title={mode === 'edit' ? 'Edit Tempat Kerja' : 'Tambah Tempat Kerja'}
      subtitle={
        mode === 'edit'
          ? 'Perbarui info tempat kerja.'
          : 'Pisahkan pekerjaan fulltime, freelance, dan proyek pribadi.'
      }
      onClose={onClose}
      titleId="workplace-form-title"
      footer={
        <div className="flex justify-end gap-2">
          <div className="w-24">
            <SecondaryButton onClick={onClose} disabled={saving}>
              Batal
            </SecondaryButton>
          </div>
          <div className="w-32">
            <PrimaryButton
              accent="task"
              onClick={handleSubmit}
              disabled={saving || !form.name.trim()}
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <FieldLabel>Nama Tempat Kerja</FieldLabel>
          <FieldInput
            accent="task"
            value={form.name}
            onChange={(v) => set('name', v)}
            placeholder="mis. Nusantara Digital / Studio Kreasi"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Tipe</FieldLabel>
            <FieldSelect
              accent="task"
              value={form.employmentType}
              onChange={(v) => set('employmentType', v)}
              options={EMPLOYMENT_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel>Role / Posisi</FieldLabel>
            <FieldInput
              accent="task"
              value={form.role}
              onChange={(v) => set('role', v)}
              placeholder="mis. Frontend Engineer"
            />
          </div>
          <div>
            <FieldLabel>Lokasi</FieldLabel>
            <FieldInput
              accent="task"
              value={form.location}
              onChange={(v) => set('location', v)}
              placeholder="mis. Jakarta · Remote"
            />
          </div>
          <div>
            <FieldLabel>Warna</FieldLabel>
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              {WORKPLACE_ACCENT_KEYS.map((key) => {
                const accent = workplaceAccent(key);
                const active = form.accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('accent', key)}
                    aria-label={`Warna ${key}`}
                    aria-pressed={active}
                    className={cx(
                      'h-7 w-7 rounded-full transition-transform',
                      accent.avatar,
                      active
                        ? 'ring-2 ring-suite-ink/60 ring-offset-2 ring-offset-suite-surface'
                        : 'opacity-75 hover:scale-105 hover:opacity-100',
                    )}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Mulai</FieldLabel>
            <FieldInput
              accent="task"
              type="date"
              value={form.startedAt}
              onChange={(v) => set('startedAt', v)}
            />
          </div>
          <div>
            <FieldLabel>Selesai (opsional)</FieldLabel>
            <FieldInput
              accent="task"
              type="date"
              value={form.endedAt}
              onChange={(v) => set('endedAt', v)}
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-control border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12.5px] font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <p className="text-[11.5px] text-suite-faint">
          Data ini masih disimpan di perangkat (dummy). Sinkronisasi ke server
          menyusul lewat API tempat kerja.
        </p>
      </div>
    </ModalShell>
  );
}
