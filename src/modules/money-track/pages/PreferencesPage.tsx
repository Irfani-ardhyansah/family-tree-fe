import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';
import {
  formatDateOnlyLabel,
  toDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import {
  currentPeriodDto,
  formatPeriodRangeLong,
  MAX_PERIOD_HOLIDAYS,
  type MoneyPeriodSettings,
  type MoneyPeriodWeekendAdjust,
} from '@/modules/money-track/lib/moneyPeriod';

import {
  QUICK_AMOUNT_MAX,
  type MoneyPreferences,
  type MoneyPrefType,
  type MoneyScopedDefaults,
} from '@/modules/money-track/lib/preferences';

const NO_DEFAULT = '__none__';

type PeriodPreset = 'day1' | 'custom_day' | 'last_day' | 'last_workday';

const PERIOD_PRESET_OPTIONS: Array<{
  value: PeriodPreset;
  label: string;
  description: string;
}> = [
  {
    value: 'day1',
    label: 'Tanggal 1 (default)',
    description: 'Periode = bulan kalender.',
  },
  {
    value: 'custom_day',
    label: 'Tanggal tertentu',
    description: 'Mis. tanggal 25 atau 30.',
  },
  {
    value: 'last_day',
    label: 'Hari terakhir bulan',
    description: 'Ikut panjang bulan.',
  },
  {
    value: 'last_workday',
    label: 'Hari kerja terakhir',
    description: 'Senin–Jumat, lewati libur.',
  },
];

const WEEKEND_ADJUST_OPTIONS: Array<{
  value: MoneyPeriodWeekendAdjust;
  label: string;
}> = [
  { value: 'none', label: 'Tetap (tidak digeser)' },
  { value: 'previous_workday', label: 'Mundur ke hari kerja sebelumnya' },
  { value: 'next_workday', label: 'Maju ke hari kerja berikutnya' },
];

function periodPresetOf(period: MoneyPeriodSettings): PeriodPreset {
  if (period.startMode !== 'fixed_day') return period.startMode;
  return period.startDay === 1 ? 'day1' : 'custom_day';
}

/** Bandingkan isi yang dikirim ke BE — `period.current` hanya turunan/preview. */
function preferencesKey(prefs: MoneyPreferences): string {
  return JSON.stringify({
    defaultTxType: prefs.defaultTxType,
    quickAmounts: prefs.quickAmounts,
    shared: prefs.shared,
    persons: prefs.persons,
    period: {
      startMode: prefs.period.startMode,
      startDay: prefs.period.startDay,
      weekendAdjust: prefs.period.weekendAdjust,
      holidays: prefs.period.holidays,
    },
  });
}

export function PreferencesPage() {
  const {
    accounts,
    categories,
    preferences,
    savePreferences,
    data,
    scope,
    dataSource,
    apiError,
  } = useMoneyTrackUi();

  const [draft, setDraft] = useState<MoneyPreferences>(preferences);
  const prevPrefsRef = useRef(preferences);
  useEffect(() => {
    const prev = prevPrefsRef.current;
    prevPrefsRef.current = preferences;
    if (prev === preferences) return;
    // Sinkron dari server hanya bila user belum mengubah draft.
    setDraft((current) =>
      preferencesKey(current) === preferencesKey(prev) ? preferences : current,
    );
  }, [preferences]);
  const [editScope, setEditScope] = useState<string>('all');
  const [quickInput, setQuickInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [holidayInput, setHolidayInput] = useState('');

  const periodPreset = periodPresetOf(draft.period);
  const periodPreview = useMemo(
    () => currentPeriodDto(draft.period),
    [draft.period],
  );
  const showHolidays =
    draft.period.startMode === 'last_workday' ||
    draft.period.weekendAdjust !== 'none';

  const isCouple = data.mode === 'couple' && data.persons.length > 0;

  /** Kantong transaksi harian (selain tabungan & investasi) — sama dgn modal. */
  const pocketOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        if (p.category === 'tabungan' || p.category === 'investasi') continue;
        list.push({
          value: p.id,
          label: `${p.name} — ${acc.personName} (${acc.name})`,
        });
      }
    }
    return list;
  }, [accounts]);

  const expenseCategoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense')
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const incomeCategoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'income')
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const editing: MoneyScopedDefaults =
    editScope === 'all'
      ? draft.shared
      : (draft.persons[editScope] ?? draft.shared);
  const hasOverride = editScope !== 'all' && Boolean(draft.persons[editScope]);

  const patchEditing = (patch: Partial<MoneyScopedDefaults>) => {
    const next = { ...editing, ...patch };
    setSavedAt(null);
    setDraft((prev) =>
      editScope === 'all'
        ? { ...prev, shared: next }
        : { ...prev, persons: { ...prev.persons, [editScope]: next } },
    );
  };

  const setTxType = (type: MoneyPrefType) => {
    setSavedAt(null);
    setDraft((prev) => ({ ...prev, defaultTxType: type }));
  };

  const addQuickAmount = () => {
    const amount = Number.parseInt(quickInput.replace(/\D/g, ''), 10);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (draft.quickAmounts.includes(amount)) {
      setQuickInput('');
      return;
    }
    if (draft.quickAmounts.length >= QUICK_AMOUNT_MAX) return;
    setSavedAt(null);
    setDraft((prev) => ({
      ...prev,
      quickAmounts: [...prev.quickAmounts, amount].sort((a, b) => a - b),
    }));
    setQuickInput('');
  };

  const removeQuickAmount = (amount: number) => {
    setSavedAt(null);
    setDraft((prev) => ({
      ...prev,
      quickAmounts: prev.quickAmounts.filter((a) => a !== amount),
    }));
  };

  const useSharedForPerson = () => {
    setSavedAt(null);
    setDraft((prev) => {
      const persons = { ...prev.persons };
      delete persons[editScope];
      return { ...prev, persons };
    });
  };

  const patchPeriod = (patch: Partial<MoneyPeriodSettings>) => {
    setSavedAt(null);
    setDraft((prev) => ({
      ...prev,
      period: { ...prev.period, ...patch },
    }));
  };

  const setPeriodPreset = (preset: PeriodPreset) => {
    if (preset === 'day1') {
      patchPeriod({
        startMode: 'fixed_day',
        startDay: 1,
        weekendAdjust: 'none',
      });
      return;
    }
    if (preset === 'custom_day') {
      patchPeriod({
        startMode: 'fixed_day',
        startDay: draft.period.startDay > 1 ? draft.period.startDay : 25,
      });
      return;
    }
    patchPeriod({ startMode: preset, weekendAdjust: 'none' });
  };

  const setStartDay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const parsed = Number.parseInt(digits, 10);
    patchPeriod({
      startDay: Number.isFinite(parsed)
        ? Math.min(31, Math.max(1, parsed))
        : 1,
    });
  };

  const addHoliday = () => {
    const iso = toDateOnlyIso(holidayInput);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
    if (draft.period.holidays.includes(iso)) {
      setHolidayInput('');
      return;
    }
    if (draft.period.holidays.length >= MAX_PERIOD_HOLIDAYS) return;
    patchPeriod({
      holidays: [...draft.period.holidays, iso].sort(),
    });
    setHolidayInput('');
  };

  const removeHoliday = (iso: string) => {
    patchPeriod({
      holidays: draft.period.holidays.filter((item) => item !== iso),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await savePreferences(draft);
      setSavedAt(Date.now());
    } catch {
      setError('Gagal menyimpan preferensi. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const dirty = preferencesKey(draft) !== preferencesKey(preferences);

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Pengaturan"
        description="Default yang otomatis dipakai saat catat transaksi — tersimpan per workspace."
        actions={
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => void handleSave()}
            className="rounded-full bg-money-brown px-4 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        }
      />

      {error || apiError ? (
        <div className="mb-4 rounded-[12px] border border-money-rose/30 bg-money-rose-soft px-4 py-3 text-[13px] font-semibold text-money-rose">
          {error ?? apiError}
        </div>
      ) : savedAt && !dirty ? (
        <div className="mb-4 rounded-[12px] border border-money-brown/30 bg-money-brown-soft px-4 py-3 text-[13px] font-semibold text-money-brown-deep">
          Preferensi tersimpan.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MoneyCard className="px-5 py-4">
          <h2 className="text-[15px] font-bold">Preferensi transaksi</h2>
          <p className="mt-0.5 text-[12.5px] text-money-muted">
            Tipe & nominal yang muncul lebih dulu di form Catat.
          </p>

          <div className="mt-4">
            <FieldLabel>Tipe default</FieldLabel>
            <div className="mt-1 flex rounded-[10px] border border-money-border bg-money-surface p-1">
              {(
                [
                  ['expense', 'Pengeluaran', 'bg-money-rose'],
                  ['income', 'Pemasukan', 'bg-money-brown'],
                ] as const
              ).map(([value, label, activeClass]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTxType(value)}
                  className={[
                    'flex-1 rounded-lg py-2 text-[12px] font-bold',
                    draft.defaultTxType === value
                      ? `${activeClass} text-white`
                      : 'text-money-muted',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Nominal cepat</FieldLabel>
            <p className="mt-0.5 text-[12px] text-money-faint">
              Tombol pintas di numpad (maks {QUICK_AMOUNT_MAX}).
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.quickAmounts.map((amount) => (
                <span
                  key={amount}
                  className="inline-flex items-center gap-1.5 rounded-full border border-money-border bg-money-soft px-2.5 py-1 text-[12px] font-bold text-money-ink"
                >
                  {formatIdr(amount)}
                  <button
                    type="button"
                    onClick={() => removeQuickAmount(amount)}
                    className="text-money-faint hover:text-money-rose"
                    aria-label={`Hapus ${formatIdr(amount)}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              {draft.quickAmounts.length === 0 ? (
                <span className="text-[12.5px] text-money-faint">
                  Belum ada nominal cepat.
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex gap-2">
              <div className="flex-1">
                <FieldInput
                  value={quickInput}
                  onChange={setQuickInput}
                  placeholder="mis. 50000"
                  inputMode="numeric"
                />
              </div>
              <button
                type="button"
                onClick={addQuickAmount}
                disabled={draft.quickAmounts.length >= QUICK_AMOUNT_MAX}
                className="inline-flex items-center gap-1 rounded-[10px] border border-money-border bg-money-surface px-3 text-[12.5px] font-bold text-money-brown-deep hover:bg-money-soft disabled:opacity-50"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>
          </div>
        </MoneyCard>

        <MoneyCard className="px-5 py-4">
          <h2 className="text-[15px] font-bold">Kantong & kategori default</h2>
          <p className="mt-0.5 text-[12.5px] text-money-muted">
            Otomatis terpilih saat catat transaksi (bisa tetap diganti manual).
          </p>

          {isCouple ? (
            <div className="mt-3">
              <FieldLabel>Berlaku untuk</FieldLabel>
              <div className="mt-1">
                <FieldSelect
                  value={editScope}
                  onChange={(v) => setEditScope(v)}
                  options={[
                    { value: 'all', label: 'Gabungan (default bersama)' },
                    ...data.persons.map((p) => ({
                      value: p.id,
                      label: `${p.name} (override)`,
                    })),
                  ]}
                />
              </div>
              {editScope !== 'all' ? (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-[10px] bg-money-soft px-3 py-2 text-[12px] text-money-muted">
                  <span>
                    {hasOverride
                      ? `Override aktif untuk ${data.persons.find((p) => p.id === editScope)?.name ?? 'person'}.`
                      : 'Belum ada override — masih ikut Gabungan.'}
                  </span>
                  {hasOverride ? (
                    <button
                      type="button"
                      onClick={useSharedForPerson}
                      className="shrink-0 font-bold text-money-brown-deep hover:underline"
                    >
                      Ikuti Gabungan
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Kantong pengeluaran</FieldLabel>
              <FieldSelect
                value={editing.expensePocketId ?? NO_DEFAULT}
                onChange={(v) =>
                  patchEditing({
                    expensePocketId: v === NO_DEFAULT ? null : v,
                  })
                }
                options={[
                  { value: NO_DEFAULT, label: 'Tanpa default' },
                  ...pocketOptions,
                ]}
              />
            </div>
            <div>
              <FieldLabel>Kantong pemasukan</FieldLabel>
              <FieldSelect
                value={editing.incomePocketId ?? NO_DEFAULT}
                onChange={(v) =>
                  patchEditing({
                    incomePocketId: v === NO_DEFAULT ? null : v,
                  })
                }
                options={[
                  { value: NO_DEFAULT, label: 'Tanpa default' },
                  ...pocketOptions,
                ]}
              />
            </div>
            <div>
              <FieldLabel>Kategori pengeluaran</FieldLabel>
              <FieldSelect
                value={editing.expenseCategoryId ?? NO_DEFAULT}
                onChange={(v) =>
                  patchEditing({
                    expenseCategoryId: v === NO_DEFAULT ? null : v,
                  })
                }
                options={[
                  { value: NO_DEFAULT, label: 'Tanpa default' },
                  ...expenseCategoryOptions,
                ]}
              />
            </div>
            <div>
              <FieldLabel>Kategori pemasukan</FieldLabel>
              <FieldSelect
                value={editing.incomeCategoryId ?? NO_DEFAULT}
                onChange={(v) =>
                  patchEditing({
                    incomeCategoryId: v === NO_DEFAULT ? null : v,
                  })
                }
                options={[
                  { value: NO_DEFAULT, label: 'Tanpa default' },
                  ...incomeCategoryOptions,
                ]}
              />
            </div>
          </div>

          <p className="mt-3 text-[11.5px] text-money-faint">
            Scope aktif saat ini:{' '}
            <span className="font-bold text-money-muted">
              {scope === 'all' ? 'Gabungan' : 'Person'}
            </span>
            {dataSource === 'dummy' ? ' · mode dummy (tersimpan lokal)' : ''}
          </p>
        </MoneyCard>
      </div>

      <MoneyCard className="mt-3 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold">Periode / Jadwal Gajian</h2>
            <p className="mt-0.5 text-[12.5px] text-money-muted">
              Menentukan rentang dashboard, laporan bulanan, budget, dan
              reminder. Default tetap tanggal 1.
            </p>
          </div>
          <span className="rounded-full border border-money-border bg-money-soft px-2.5 py-1 text-[11px] font-bold text-money-muted">
            {periodPreview.yearMonth}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <FieldLabel>Mulai periode</FieldLabel>
            <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {PERIOD_PRESET_OPTIONS.map((option) => {
                const active = periodPreset === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriodPreset(option.value)}
                    className={[
                      'rounded-[10px] border px-3 py-2 text-left transition-colors',
                      active
                        ? 'border-money-brown bg-money-brown-soft'
                        : 'border-money-border bg-money-surface hover:bg-money-soft',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'block text-[12.5px] font-bold',
                        active ? 'text-money-brown-deep' : 'text-money-ink',
                      ].join(' ')}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-money-faint">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {periodPreset === 'custom_day' ? (
              <div className="mt-3 max-w-[180px]">
                <FieldLabel>Tanggal mulai (1–31)</FieldLabel>
                <FieldInput
                  value={String(draft.period.startDay)}
                  onChange={setStartDay}
                  inputMode="numeric"
                  placeholder="mis. 25"
                />
                <p className="mt-1 text-[11px] text-money-faint">
                  Kalau bulan lebih pendek, otomatis memakai hari terakhir.
                </p>
              </div>
            ) : null}
          </div>

          <div>
            {draft.period.startMode === 'fixed_day' ? (
              <div>
                <FieldLabel>Kalau jatuh Sabtu/Minggu</FieldLabel>
                <FieldSelect
                  value={draft.period.weekendAdjust}
                  onChange={(value) =>
                    patchPeriod({ weekendAdjust: value })
                  }
                  options={WEEKEND_ADJUST_OPTIONS}
                />
                <p className="mt-1 text-[11px] text-money-faint">
                  Geser tanggal mulai ke hari kerja terdekat.
                </p>
              </div>
            ) : (
              <div className="rounded-[10px] border border-money-border bg-money-soft px-3 py-2 text-[12px] text-money-muted">
                {draft.period.startMode === 'last_workday'
                  ? 'Hari kerja terakhir dihitung Senin–Jumat dan melewati tanggal libur di bawah.'
                  : 'Tanggal mulai mengikuti hari terakhir setiap bulan.'}
              </div>
            )}

            <div className="mt-4 rounded-[12px] border border-money-border bg-money-soft px-3.5 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-money-faint">
                Periode berjalan
              </div>
              <div className="mt-1 font-money-mono text-[15px] font-extrabold text-money-brown-deep">
                {formatPeriodRangeLong(periodPreview.from, periodPreview.to)}
              </div>
              <div className="mt-0.5 text-[12px] text-money-muted">
                {periodPreview.label}
              </div>
            </div>
          </div>
        </div>

        {showHolidays ? (
          <div className="mt-4 border-t border-money-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <FieldLabel>Tanggal libur (opsional)</FieldLabel>
                <p className="mt-0.5 text-[11.5px] text-money-faint">
                  Untuk tanggal merah yang bukan Sabtu/Minggu. Maks{' '}
                  {MAX_PERIOD_HOLIDAYS} tanggal.
                </p>
              </div>
              <span className="text-[11.5px] font-semibold text-money-muted">
                {draft.period.holidays.length} tanggal
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.period.holidays.map((holiday) => (
                <span
                  key={holiday}
                  className="inline-flex items-center gap-1.5 rounded-full border border-money-border bg-money-surface px-2.5 py-1 text-[12px] font-bold text-money-ink"
                >
                  {formatDateOnlyLabel(holiday)}
                  <button
                    type="button"
                    onClick={() => removeHoliday(holiday)}
                    className="text-money-faint hover:text-money-rose"
                    aria-label={`Hapus libur ${formatDateOnlyLabel(holiday)}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              {draft.period.holidays.length === 0 ? (
                <span className="text-[12.5px] text-money-faint">
                  Belum ada tanggal libur.
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex max-w-[360px] gap-2">
              <div className="flex-1">
                <FieldInput
                  type="date"
                  value={holidayInput}
                  onChange={(value) => setHolidayInput(toDateOnlyIso(value))}
                />
              </div>
              <button
                type="button"
                onClick={addHoliday}
                disabled={
                  !holidayInput ||
                  draft.period.holidays.length >= MAX_PERIOD_HOLIDAYS
                }
                className="inline-flex items-center gap-1 rounded-[10px] border border-money-border bg-money-surface px-3 text-[12.5px] font-bold text-money-brown-deep hover:bg-money-soft disabled:opacity-50"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>
          </div>
        ) : null}
      </MoneyCard>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => void handleSave()}
          className="rounded-full bg-money-brown px-5 py-2.5 text-[13px] font-bold text-white hover:bg-money-brown-deep disabled:opacity-50"
        >
          {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
        </button>
      </div>
    </div>
  );
}
