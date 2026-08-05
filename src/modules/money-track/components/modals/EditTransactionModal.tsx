import { useEffect, useMemo, useState } from 'react';
import {
  deleteMoneyTransaction,
  updateMoneyTransaction,
} from '@/modules/money-track/api/moneyApi';
import {
  FieldInput,
  FieldLabel,
  MoneyAmountInput,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  MoneyModalShell,
  MoneyPrimaryButton,
  MoneySecondaryButton,
  OptionCard,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import {
  parseIdrDigits,
  type MoneyModalPayload,
} from '@/modules/money-track/components/modals/modalTypes';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { CategoryIcon } from '@/modules/money-track/lib/categoryIcons';
import {
  dateFromFormInput,
  formatDateOnlyLabel,
  todayDateOnlyIso,
  toDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';

type TxType = 'expense' | 'income';

export function EditTransactionModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload?: MoneyModalPayload;
}) {
  const {
    accounts,
    categories,
    dataSource,
    refreshApi,
    bumpActivity,
    patchTransaction,
    removeTransaction,
  } = useMoneyTrackUi();

  const editingId = payload?.transactionId ?? '';
  const [txType, setTxType] = useState<TxType>(payload?.txType ?? 'expense');
  const [digits, setDigits] = useState(
    payload?.txAmount != null && payload.txAmount > 0
      ? String(payload.txAmount)
      : '',
  );
  const [categoryId, setCategoryId] = useState(payload?.txCategoryId ?? '');
  const [pocketId, setPocketId] = useState(payload?.pocketId ?? '');
  const [pocketQuery, setPocketQuery] = useState('');
  const [note, setNote] = useState(payload?.txNote ?? '');
  const [dateIso, setDateIso] = useState(
    payload?.txDateIso
      ? toDateOnlyIso(payload.txDateIso)
      : todayDateOnlyIso(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pocketOptions = useMemo(() => {
    const list: {
      id: string;
      label: string;
      balance: number;
      search: string;
    }[] = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        if (p.category === 'tabungan' || p.category === 'investasi') continue;
        const label = `${p.name} — ${acc.personName} (${acc.name})`;
        list.push({
          id: p.id,
          label,
          balance: p.balance,
          search: `${p.name} ${acc.personName} ${acc.name}`.toLowerCase(),
        });
      }
    }
    // Jika pocket lama tabungan/investasi, tetap tampil supaya bisa diganti
    if (payload?.pocketId && !list.some((p) => p.id === payload.pocketId)) {
      list.unshift({
        id: payload.pocketId,
        label: payload.pocketName ?? `Kantong ${payload.pocketId}`,
        balance: 0,
        search: (payload.pocketName ?? '').toLowerCase(),
      });
    }
    return list;
  }, [accounts, payload?.pocketId, payload?.pocketName]);

  const filteredPockets = useMemo(() => {
    const q = pocketQuery.trim().toLowerCase();
    if (!q) return pocketOptions;
    return pocketOptions.filter((p) => p.search.includes(q));
  }, [pocketOptions, pocketQuery]);

  const typedCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === txType)
        .slice()
        .sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        ),
    [categories, txType],
  );

  useEffect(() => {
    if (!typedCategories.some((c) => c.id === categoryId)) {
      setCategoryId(typedCategories[0]?.id ?? '');
    }
  }, [typedCategories, categoryId]);

  const amount = parseIdrDigits(digits);
  const selectedPocket =
    pocketOptions.find((p) => p.id === pocketId) ?? filteredPockets[0];

  const handleSave = async () => {
    if (!editingId || amount <= 0 || !selectedPocket) return;
    const category = typedCategories.find((c) => c.id === categoryId);
    const formDateIso = dateFromFormInput(dateIso);
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        await updateMoneyTransaction(editingId, {
          pocketId: selectedPocket.id,
          categoryId: category?.id ?? null,
          type: txType,
          amount,
          date: formDateIso,
          note: note.trim() || null,
        });
        await refreshApi();
        bumpActivity();
      } else {
        patchTransaction(editingId, {
          kind: txType,
          amount,
          dateIso: formDateIso,
          dateLabel: formatDateOnlyLabel(formDateIso),
          category: category?.name ?? '—',
          categoryId: category?.id ?? null,
          pocket: selectedPocket.label,
          pocketId: selectedPocket.id,
          title: note.trim() || category?.name || 'Transaksi',
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal mengubah transaksi.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (
      !window.confirm(
        'Hapus transaksi ini? Saldo kantong akan dihitung ulang. Tidak bisa dibatalkan.',
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        await deleteMoneyTransaction(editingId);
        await refreshApi();
        bumpActivity();
      } else {
        removeTransaction(editingId);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal menghapus transaksi.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MoneyModalShell
      title="Edit Transaksi"
      subtitle="Ubah detail atau hapus transaksi"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <div className="w-28">
            <MoneySecondaryButton disabled={saving} onClick={() => void handleDelete()}>
              Hapus
            </MoneySecondaryButton>
          </div>
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={
                saving ||
                amount <= 0 ||
                !selectedPocket ||
                typedCategories.length === 0
              }
              onClick={() => void handleSave()}
            >
              {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {error ? (
          <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
            {error}
          </div>
        ) : null}

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

        <div>
          <FieldLabel>Nominal</FieldLabel>
          <MoneyAmountInput value={digits} onChange={setDigits} />
        </div>

        <div>
          <FieldLabel>Kategori</FieldLabel>
          {typedCategories.length === 0 ? (
            <p className="text-[12.5px] text-money-faint">Belum ada kategori.</p>
          ) : (
            <div className="grid max-h-36 grid-cols-4 gap-2 overflow-y-auto">
              {typedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-[12px] bg-money-soft text-money-ink',
                      categoryId === cat.id
                        ? 'outline outline-2 outline-offset-2 outline-money-brown'
                        : '',
                    ].join(' ')}
                  >
                    <CategoryIcon icon={cat.icon} size={16} />
                  </span>
                  <span className="text-[10px] font-semibold text-money-muted">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Kantong</FieldLabel>
          <FieldInput
            value={pocketQuery}
            onChange={setPocketQuery}
            placeholder="Cari kantong…"
          />
          <div className="mt-2 max-h-32 space-y-1.5 overflow-y-auto">
            {filteredPockets.map((p) => (
              <OptionCard
                key={p.id}
                active={(pocketId || filteredPockets[0]?.id) === p.id}
                title={p.label}
                subtitle={formatIdr(p.balance)}
                onClick={() => setPocketId(p.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Tanggal</FieldLabel>
          <FieldInput type="date" value={dateIso} onChange={setDateIso} />
        </div>
        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldInput
            value={note}
            onChange={setNote}
            placeholder="Opsional"
          />
        </div>
      </div>
    </MoneyModalShell>
  );
}
