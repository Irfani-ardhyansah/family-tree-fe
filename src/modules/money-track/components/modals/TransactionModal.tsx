import { useEffect, useMemo, useState } from 'react';
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
import { todayLabel } from '@/modules/money-track/components/modals/modalTypes';

type TxType = 'expense' | 'income';

export function TransactionModal({ onClose }: { onClose: () => void }) {
  const { data, accounts, categories, appendTransaction, dataSource } =
    useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const [txType, setTxType] = useState<TxType>('expense');
  const [digits, setDigits] = useState('85000');
  const [categoryId, setCategoryId] = useState('');
  const [pocketId, setPocketId] = useState('');
  const [note, setNote] = useState('');
  const [dateLabel, setDateLabel] = useState(todayLabel());

  const pocketOptions = useMemo(() => {
    const list: { id: string; label: string; balance: number; person: string }[] =
      [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        list.push({
          id: p.id,
          label: `${p.name} — ${acc.personName} (${acc.name})`,
          balance: p.balance,
          person: acc.personName,
        });
      }
    }
    return list;
  }, [accounts]);

  const selectedPocket =
    pocketOptions.find((p) => p.id === pocketId) ?? pocketOptions[0];

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

  const handleSave = () => {
    const pocket = selectedPocket;
    if (!pocket || amount <= 0 || !category) return;
    appendTransaction({
      id: `t-${Date.now()}`,
      dateLabel,
      dateIso: new Date().toISOString().slice(0, 10),
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
    setStep(5);
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
              <MoneySecondaryButton onClick={() => setStep((s) => s - 1)}>
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={
                (step === 1 && amount <= 0) ||
                (step === 2 && typedCategories.length === 0)
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
                  setStep(4);
                  return;
                }
                handleSave();
              }}
            >
              {step === 4 ? 'Simpan Transaksi' : 'Lanjut'}
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
            tone={txType === 'expense' ? 'expense' : 'income'}
          />
          <Numpad
            onDigit={pushDigit}
            on000={() => pushDigit('000')}
            onBackspace={() => setDigits((d) => d.slice(0, -1) || '0')}
          />
        </div>
      )}

      {step === 2 && (
        typedCategories.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-money-faint">
            Belum ada kategori {txType === 'expense' ? 'pengeluaran' : 'pemasukan'}.
            Tambah dulu di menu Kategori.
          </p>
        ) : (
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
                    'flex h-12 w-12 items-center justify-center rounded-[14px] text-lg',
                    categoryId === cat.id
                      ? 'outline outline-2 outline-offset-2 outline-money-brown'
                      : '',
                    'bg-money-soft',
                  ].join(' ')}
                >
                  {cat.icon || '🏷️'}
                </span>
                <span className="text-[10px] font-semibold text-money-muted">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        )
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <FieldLabel>Kantong</FieldLabel>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {pocketOptions.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Belum ada kantong. Tambah account/pocket dulu.
                </p>
              ) : (
                pocketOptions.map((p) => (
                  <OptionCard
                    key={p.id}
                    active={(pocketId || pocketOptions[0]?.id) === p.id}
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
            <FieldInput value={dateLabel} onChange={setDateLabel} />
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
            v={`${category?.icon || '🏷️'} ${category?.name ?? '—'}`}
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
      )}
    </MoneyModalShell>
  );
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-[12px]">
      <span className="text-money-faint">{k}</span>
      <span className="text-right font-bold text-money-ink">{v}</span>
    </div>
  );
}
