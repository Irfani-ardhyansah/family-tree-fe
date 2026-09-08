import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus } from 'react-feather';
import { createMoneyTransaction } from '@/modules/money-track/api/moneyApi';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';
import {
  FieldInput,
  FieldLabel,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  AmountDisplay,
  MoneyModalShell,
  MoneyPrimaryButton,
  MoneySecondaryButton,
  Numpad,
  OptionCard,
  SuccessPanel,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import { CategoryIcon, CategoryIconPicker } from '@/modules/money-track/lib/categoryIcons';
import {
  dateFromFormInput,
  formatDateOnlyLabel,
  todayDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import { ApiClientError } from '@/shared/lib/apiClient';

type TxType = 'expense' | 'income';

export function TransactionModal({ onClose }: { onClose: () => void }) {
  const {
    data,
    accounts,
    categories,
    appendTransaction,
    dataSource,
    refreshApi,
    bumpActivity,
    createCategory,
  } = useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const [txType, setTxType] = useState<TxType>('expense');
  const [digits, setDigits] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [pocketId, setPocketId] = useState('');
  const [pocketQuery, setPocketQuery] = useState('');
  const [note, setNote] = useState('');
  const [dateIso, setDateIso] = useState(todayDateOnlyIso);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pocketOptions = useMemo(() => {
    const list: {
      id: string;
      label: string;
      balance: number;
      person: string;
      search: string;
    }[] = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        // Catat transaksi harian: selain tabungan & investasi
        if (p.category === 'tabungan' || p.category === 'investasi') continue;
        const label = `${p.name} — ${acc.personName} (${acc.name})`;
        list.push({
          id: p.id,
          label,
          balance: p.balance,
          person: acc.personName,
          search: `${p.name} ${acc.personName} ${acc.name} ${p.category}`.toLowerCase(),
        });
      }
    }
    return list;
  }, [accounts]);

  const filteredPockets = useMemo(() => {
    const q = pocketQuery.trim().toLowerCase();
    if (!q) return pocketOptions;
    return pocketOptions.filter((p) => p.search.includes(q));
  }, [pocketOptions, pocketQuery]);

  const selectedPocket =
    pocketOptions.find((p) => p.id === pocketId) ?? filteredPockets[0];

  useEffect(() => {
    if (!pocketId && filteredPockets[0]) {
      setPocketId(filteredPockets[0].id);
      return;
    }
    if (pocketId && !pocketOptions.some((p) => p.id === pocketId)) {
      setPocketId(filteredPockets[0]?.id ?? '');
    }
  }, [pocketId, pocketOptions, filteredPockets]);

  const typedCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === txType)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, txType],
  );

  const category =
    typedCategories.find((c) => c.id === categoryId) ?? typedCategories[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;
  const dateLabel = formatDateOnlyLabel(dateIso);

  useEffect(() => {
    if (!typedCategories.some((c) => c.id === categoryId)) {
      setCategoryId(typedCategories[0]?.id ?? '');
    }
  }, [typedCategories, categoryId]);

  const pushDigit = (d: string) => {
    setDigits((prev) => {
      const next = (prev + d).replace(/^0+(?=\d)/, '');
      return next.slice(0, 12);
    });
  };

  const resetAddCategoryForm = () => {
    setShowAddCategory(false);
    setNewCategoryName('');
    setNewCategoryIcon('');
    setCategoryError(null);
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Nama kategori wajib diisi.');
      return;
    }
    setCategorySaving(true);
    setCategoryError(null);
    try {
      const created = await createCategory({
        name,
        type: txType,
        icon: newCategoryIcon.trim() || null,
      });
      setCategoryId(created.id);
      resetAddCategoryForm();
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : 'Gagal menambah kategori.',
      );
    } finally {
      setCategorySaving(false);
    }
  };

  const handleSave = async () => {
    const pocket = selectedPocket;
    if (!pocket || amount <= 0 || !category) return;
    // Selalu dari input form Tanggal (bukan createdAt / hari server).
    const formDateIso = dateFromFormInput(dateIso);
    const formDateLabel = formatDateOnlyLabel(formDateIso);
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        await createMoneyTransaction({
          pocketId: pocket.id,
          categoryId: category.id,
          type: txType,
          amount,
          date: formDateIso,
          note: note.trim() || null,
        });
        await refreshApi();
        bumpActivity();
      } else {
        appendTransaction({
          id: `t-${Date.now()}`,
          dateLabel: formDateLabel,
          dateIso: formDateIso,
          title: note.trim() || category.name,
          category: category.name,
          categoryId: category.id,
          person: pocket.person,
          personId:
            data.persons.find((p) => p.name === pocket.person)?.id ??
            data.loginPersonId,
          pocket: pocket.label,
          pocketId: pocket.id,
          kind: txType,
          amount,
        });
      }
      setStep(5);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menyimpan transaksi.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (step === 5) {
    return (
      <MoneyModalShell title="Catat Transaksi" onClose={onClose}>
        <SuccessPanel
          title="Transaksi tersimpan"
          body={`${txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'} ${formatIdr(amount)} untuk ${category?.name ?? '—'} sudah tercatat${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          balanceLabel={selectedPocket ? `Saldo ${selectedPocket.label}` : undefined}
          balanceValue={
            selectedPocket
              ? formatIdr(
                  selectedPocket.balance +
                    (txType === 'income' ? amount : -amount),
                )
              : undefined
          }
          againLabel="Tambah lagi"
          onAgain={() => {
            setDigits('');
            setNote('');
            setError(null);
            setPocketQuery('');
            setPocketId('');
            setDateIso(todayDateOnlyIso());
            setStep(1);
          }}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Catat Transaksi"
      subtitle={
        step === 1
          ? 'Tipe & nominal'
          : step === 2
            ? 'Pilih kategori'
            : step === 3
              ? 'Detail'
              : 'Review'
      }
      onClose={onClose}
      step={step}
      stepTotal={4}
      footer={
        <div className="flex gap-2">
          {step > 1 ? (
            <div className="w-28">
              <MoneySecondaryButton
                disabled={saving || categorySaving}
                onClick={() => {
                  if (step === 2 && showAddCategory) {
                    resetAddCategoryForm();
                    return;
                  }
                  setStep((s) => s - 1);
                }}
              >
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={
                saving ||
                categorySaving ||
                (step === 1 && amount <= 0) ||
                (step === 2 &&
                  (showAddCategory ||
                    typedCategories.length === 0 ||
                    !categoryId)) ||
                (step === 3 && (!selectedPocket || filteredPockets.length === 0))
              }
              onClick={() => {
                if (step === 1) {
                  if (!pocketId && pocketOptions[0]) {
                    setPocketId(pocketOptions[0].id);
                  }
                  setCategoryId(typedCategories[0]?.id ?? '');
                  setStep(2);
                  return;
                }
                if (step === 2) {
                  setStep(3);
                  return;
                }
                if (step === 3) {
                  if (selectedPocket) setPocketId(selectedPocket.id);
                  setStep(4);
                  return;
                }
                void handleSave();
              }}
            >
              {step === 4
                ? saving
                  ? 'Menyimpan…'
                  : 'Simpan Transaksi'
                : 'Lanjut'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-3">
          <div className="flex rounded-[10px] border border-money-border bg-money-surface p-1">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={[
                'flex-1 rounded-lg py-2 text-[12px] font-bold',
                txType === 'expense'
                  ? 'bg-money-rose text-white'
                  : 'text-money-muted',
              ].join(' ')}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={[
                'flex-1 rounded-lg py-2 text-[12px] font-bold',
                txType === 'income'
                  ? 'bg-money-brown text-white'
                  : 'text-money-muted',
              ].join(' ')}
            >
              Pemasukan
            </button>
          </div>
          <AmountDisplay
            digits={digits}
            onChange={setDigits}
            tone={txType === 'expense' ? 'expense' : 'income'}
          />
          <Numpad
            onDigit={pushDigit}
            on000={() => pushDigit('000')}
            onBackspace={() => setDigits((d) => d.slice(0, -1))}
          />
        </div>
      )}

      {step === 2 && (
        showAddCategory ? (
          <div className="space-y-3">
            <p className="text-[12.5px] text-money-muted">
              Kategori {txType === 'expense' ? 'pengeluaran' : 'pemasukan'} baru
            </p>
            <div>
              <FieldLabel>Nama</FieldLabel>
              <FieldInput
                value={newCategoryName}
                onChange={setNewCategoryName}
                placeholder="mis. Makan"
              />
            </div>
            <CategoryIconPicker
              value={newCategoryIcon}
              onChange={setNewCategoryIcon}
            />
            {newCategoryIcon ? (
              <div className="inline-flex items-center gap-2 rounded-[10px] bg-money-soft px-3 py-2 text-[12.5px] text-money-muted">
                Preview:
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-money-surface text-money-ink">
                  <CategoryIcon icon={newCategoryIcon} size={16} />
                </span>
              </div>
            ) : null}
            {categoryError ? (
              <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
                {categoryError}
              </div>
            ) : null}
            <div className="flex gap-2">
              <MoneyPrimaryButton
                disabled={categorySaving}
                onClick={() => void handleCreateCategory()}
              >
                {categorySaving ? 'Menyimpan…' : 'Simpan kategori'}
              </MoneyPrimaryButton>
              <MoneySecondaryButton
                disabled={categorySaving}
                onClick={resetAddCategoryForm}
              >
                Batal
              </MoneySecondaryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {typedCategories.length === 0 ? (
              <p className="text-center text-[13px] text-money-faint">
                Belum ada kategori{' '}
                {txType === 'expense' ? 'pengeluaran' : 'pemasukan'}. Tambah
                kategori baru di bawah.
              </p>
            ) : null}
            <div className="grid grid-cols-4 gap-2.5">
              {typedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-[14px]',
                      categoryId === cat.id
                        ? 'outline outline-2 outline-offset-2 outline-money-brown'
                        : '',
                      'bg-money-soft text-money-ink',
                    ].join(' ')}
                  >
                    <CategoryIcon icon={cat.icon} size={20} />
                  </span>
                  <span className="text-[10px] font-semibold text-money-muted">
                    {cat.name}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCategoryError(null);
                  setShowAddCategory(true);
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-money-border bg-money-soft text-money-muted">
                  <Plus size={20} />
                </span>
                <span className="text-[10px] font-semibold text-money-brown-deep">
                  Tambah
                </span>
              </button>
            </div>
          </div>
        )
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <FieldLabel>Kantong (selain Tabungan & Investasi)</FieldLabel>
            <FieldInput
              value={pocketQuery}
              onChange={setPocketQuery}
              placeholder="Cari kantong, person, atau account…"
            />
            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {pocketOptions.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Belum ada kantong transaksi/custom. Tabungan & investasi tidak
                  dipakai untuk catat transaksi harian.
                </p>
              ) : filteredPockets.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Tidak ada kantong yang cocok dengan pencarian.
                </p>
              ) : (
                filteredPockets.map((p) => (
                  <OptionCard
                    key={p.id}
                    active={(pocketId || filteredPockets[0]?.id) === p.id}
                    title={p.label}
                    subtitle={formatIdr(p.balance)}
                    onClick={() => setPocketId(p.id)}
                  />
                ))
              )}
            </div>
          </div>
          <div>
            <FieldLabel>Tanggal</FieldLabel>
            <FieldInput type="date" value={dateIso} onChange={setDateIso} />
          </div>
          <div>
            <FieldLabel>Catatan (opsional)</FieldLabel>
            <FieldInput
              value={note}
              onChange={setNote}
              placeholder="mis. Makan siang"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          {error ? (
            <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
              {error}
            </div>
          ) : null}
          <div className="rounded-[12px] border border-money-border p-4">
            <div className="border-b border-dashed border-money-border pb-3 text-center">
              <div className="text-[10px] font-bold uppercase text-money-faint">
                {txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </div>
              <div
                className={`font-money-mono text-xl font-extrabold ${txType === 'expense' ? 'text-money-rose' : 'text-money-brown-deep'}`}
              >
                {txType === 'expense' ? '-' : '+'}
                {formatIdr(amount)}
              </div>
            </div>
            <ReviewRow
              k="Kategori"
              v={
                <span className="inline-flex items-center justify-end gap-1.5">
                  <CategoryIcon icon={category?.icon} size={14} />
                  {category?.name ?? '—'}
                </span>
              }
            />
            <ReviewRow k="Kantong" v={selectedPocket?.label ?? '—'} />
            <ReviewRow k="Tanggal" v={dateLabel} />
            <ReviewRow k="Catatan" v={note || '—'} />
            {selectedPocket ? (
              <ReviewRow
                k="Saldo setelah"
                v={formatIdr(
                  selectedPocket.balance +
                    (txType === 'income' ? amount : -amount),
                )}
              />
            ) : null}
          </div>
        </div>
      )}
    </MoneyModalShell>
  );
}

function ReviewRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-[12px]">
      <span className="text-money-faint">{k}</span>
      <span className="text-right font-bold text-money-ink">{v}</span>
    </div>
  );
}
