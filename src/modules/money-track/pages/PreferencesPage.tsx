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
  QUICK_AMOUNT_MAX,
  type MoneyPreferences,
  type MoneyPrefType,
  type MoneyScopedDefaults,
} from '@/modules/money-track/lib/preferences';

const NO_DEFAULT = '__none__';

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
      JSON.stringify(current) === JSON.stringify(prev) ? preferences : current,
    );
  }, [preferences]);
  const [editScope, setEditScope] = useState<string>('all');
  const [quickInput, setQuickInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences);

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
