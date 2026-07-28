import { useState } from 'react';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  MoneyModalShell,
  MoneyPrimaryButton,
  SuccessPanel,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import {
  parseIdrDigits,
  todayLabel,
  type MoneyModalPayload,
} from '@/modules/money-track/components/modals/modalTypes';

export function AccountModal({ onClose }: { onClose: () => void }) {
  const { data, appendAccount, dataSource } = useMoneyTrackUi();
  const [personId, setPersonId] = useState(data.persons[0]?.id ?? '');
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <MoneyModalShell title="Tambah Account" onClose={onClose}>
        <SuccessPanel
          title="Account ditambahkan"
          body={`${name} tersimpan${dataSource === 'dummy' ? ' di dummy' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Tambah Account"
      subtitle="Bank, e-wallet, atau cash"
      onClose={onClose}
      footer={
        <MoneyPrimaryButton
          disabled={!name.trim() || !personId}
          onClick={() => {
            const person = data.persons.find((p) => p.id === personId);
            appendAccount({
              id: `acc-${Date.now()}`,
              personId,
              personName: person?.name ?? '—',
              name: name.trim(),
              type: type as 'bank' | 'ewallet' | 'cash',
              pockets: [],
            });
            setDone(true);
          }}
        >
          Simpan Account
        </MoneyPrimaryButton>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>Pemilik</FieldLabel>
          <FieldSelect
            value={personId}
            onChange={setPersonId}
            options={data.persons.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </div>
        <div>
          <FieldLabel>Nama</FieldLabel>
          <FieldInput
            value={name}
            onChange={setName}
            placeholder="mis. BCA, GoPay"
          />
        </div>
        <div>
          <FieldLabel>Tipe</FieldLabel>
          <FieldSelect
            value={type}
            onChange={setType}
            options={[
              { value: 'bank', label: 'Bank' },
              { value: 'ewallet', label: 'E-wallet' },
              { value: 'cash', label: 'Cash' },
            ]}
          />
        </div>
      </div>
    </MoneyModalShell>
  );
}

export function PocketModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload?: MoneyModalPayload;
}) {
  const { accounts, appendPocket, dataSource } = useMoneyTrackUi();
  const [accountId, setAccountId] = useState(
    payload?.accountId ?? accounts[0]?.id ?? '',
  );
  const [name, setName] = useState('Transaksi');
  const [category, setCategory] = useState('transaksi');
  const [goal, setGoal] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <MoneyModalShell title="Tambah Pocket" onClose={onClose}>
        <SuccessPanel
          title="Pocket ditambahkan"
          body={`${name} tersimpan${dataSource === 'dummy' ? ' di dummy' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Tambah Pocket"
      subtitle="Kantong logis di dalam account"
      onClose={onClose}
      footer={
        <MoneyPrimaryButton
          disabled={!name.trim() || !accountId}
          onClick={() => {
            const goalAmount = goal ? parseIdrDigits(goal) : undefined;
            appendPocket(accountId, {
              id: `p-${Date.now()}`,
              name: name.trim(),
              category: category as 'transaksi' | 'tabungan' | 'investasi' | 'custom',
              balance: 0,
              ...(goalAmount
                ? { goalAmount, goalPct: 0 }
                : {}),
            });
            setDone(true);
          }}
        >
          Simpan Pocket
        </MoneyPrimaryButton>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>Account</FieldLabel>
          <FieldSelect
            value={accountId}
            onChange={setAccountId}
            options={accounts.map((a) => ({
              value: a.id,
              label: `${a.personName} · ${a.name}`,
            }))}
          />
        </div>
        <div>
          <FieldLabel>Nama kantong</FieldLabel>
          <FieldInput value={name} onChange={setName} />
        </div>
        <div>
          <FieldLabel>Kategori</FieldLabel>
          <FieldSelect
            value={category}
            onChange={setCategory}
            options={[
              { value: 'transaksi', label: 'Transaksi' },
              { value: 'tabungan', label: 'Tabungan' },
              { value: 'investasi', label: 'Investasi' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Goal (opsional)</FieldLabel>
          <FieldInput
            value={goal}
            onChange={setGoal}
            placeholder="mis. 50000000"
            inputMode="numeric"
          />
        </div>
      </div>
    </MoneyModalShell>
  );
}

export function WishlistModal({ onClose }: { onClose: () => void }) {
  const { data, accounts, appendWishlist, dataSource } = useMoneyTrackUi();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState('medium');
  const [personId, setPersonId] = useState(data.persons[0]?.id ?? '');
  const [pocketId, setPocketId] = useState('');
  const [done, setDone] = useState(false);

  const pocketOptions = accounts.flatMap((a) =>
    a.pockets.map((p) => ({
      id: p.id,
      label: `${p.name} · ${a.personName}`,
      balance: p.balance,
    })),
  );

  if (done) {
    return (
      <MoneyModalShell title="Tambah Wishlist" onClose={onClose}>
        <SuccessPanel
          title="Wishlist ditambahkan"
          body={`${name} tersimpan${dataSource === 'dummy' ? ' di dummy' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Tambah Wishlist"
      onClose={onClose}
      footer={
        <MoneyPrimaryButton
          disabled={!name.trim() || parseIdrDigits(price) <= 0}
          onClick={() => {
            const estimatedPrice = parseIdrDigits(price);
            const person = data.persons.find((p) => p.id === personId);
            const linked = pocketOptions.find((p) => p.id === pocketId);
            appendWishlist({
              id: `w-${Date.now()}`,
              name: name.trim(),
              estimatedPrice,
              priority: priority as 'low' | 'medium' | 'high',
              person: person?.name ?? 'Bersama',
              personId: personId || null,
              linkedPocket: linked?.label ?? null,
              progressAmount: linked?.balance ?? 0,
              progressPct: linked
                ? Math.min(
                    100,
                    Math.round((linked.balance / estimatedPrice) * 100),
                  )
                : 0,
              note: null,
            });
            setDone(true);
          }}
        >
          Simpan Wishlist
        </MoneyPrimaryButton>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>Nama item</FieldLabel>
          <FieldInput value={name} onChange={setName} placeholder="mis. Vacuum" />
        </div>
        <div>
          <FieldLabel>Estimasi harga</FieldLabel>
          <FieldInput
            value={price}
            onChange={setPrice}
            placeholder="2500000"
            inputMode="numeric"
          />
        </div>
        <div>
          <FieldLabel>Prioritas</FieldLabel>
          <FieldSelect
            value={priority}
            onChange={setPriority}
            options={[
              { value: 'high', label: 'Tinggi' },
              { value: 'medium', label: 'Sedang' },
              { value: 'low', label: 'Rendah' },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Person</FieldLabel>
          <FieldSelect
            value={personId}
            onChange={setPersonId}
            options={data.persons.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </div>
        <div>
          <FieldLabel>Link kantong (opsional)</FieldLabel>
          <FieldSelect
            value={pocketId}
            onChange={setPocketId}
            options={[
              { value: '', label: '— Manual —' },
              ...pocketOptions.map((p) => ({
                value: p.id,
                label: p.label,
              })),
            ]}
          />
        </div>
      </div>
    </MoneyModalShell>
  );
}

export function DebtModal({ onClose }: { onClose: () => void }) {
  const { data, appendDebt, dataSource } = useMoneyTrackUi();
  const [counterparty, setCounterparty] = useState('');
  const [direction, setDirection] = useState('piutang');
  const [amount, setAmount] = useState('');
  const [personId, setPersonId] = useState(data.persons[0]?.id ?? '');
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <MoneyModalShell title="Tambah Utang/Piutang" onClose={onClose}>
        <SuccessPanel
          title="Catatan tersimpan"
          body={`${direction} ke ${counterparty}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Tambah Utang / Piutang"
      onClose={onClose}
      footer={
        <MoneyPrimaryButton
          disabled={!counterparty.trim() || parseIdrDigits(amount) <= 0}
          onClick={() => {
            const amt = parseIdrDigits(amount);
            const person = data.persons.find((p) => p.id === personId);
            appendDebt({
              id: `d-${Date.now()}`,
              counterparty: counterparty.trim(),
              direction: direction as 'utang' | 'piutang',
              person: person?.name ?? '',
              personId,
              amount: amt,
              paidTotal: 0,
              remaining: amt,
              status: 'open',
              dateLabel: todayLabel(),
              dueLabel: due || '—',
              dueSoon: false,
              note: note || null,
            });
            setDone(true);
          }}
        >
          Simpan
        </MoneyPrimaryButton>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>Lawanan (nama)</FieldLabel>
          <FieldInput
            value={counterparty}
            onChange={setCounterparty}
            placeholder="mis. Budi"
          />
        </div>
        <div>
          <FieldLabel>Arah</FieldLabel>
          <FieldSelect
            value={direction}
            onChange={setDirection}
            options={[
              { value: 'piutang', label: 'Piutang (mereka hutang ke saya)' },
              { value: 'utang', label: 'Utang (saya hutang)' },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Jumlah</FieldLabel>
          <FieldInput
            value={amount}
            onChange={setAmount}
            inputMode="numeric"
            placeholder="1000000"
          />
        </div>
        <div>
          <FieldLabel>Person</FieldLabel>
          <FieldSelect
            value={personId}
            onChange={setPersonId}
            options={data.persons.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </div>
        <div>
          <FieldLabel>Jatuh tempo</FieldLabel>
          <FieldInput
            value={due}
            onChange={setDue}
            placeholder="mis. 1 Agu 2026"
          />
        </div>
        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldTextarea value={note} onChange={setNote} />
        </div>
      </div>
    </MoneyModalShell>
  );
}

export function DebtPaymentModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload?: MoneyModalPayload;
}) {
  const { debts, appendDebtPayment, dataSource } = useMoneyTrackUi();
  const debt = debts.find((d) => d.id === payload?.debtId) ?? debts[0];
  const [amount, setAmount] = useState(
    debt ? String(Math.min(200_000, debt.remaining)) : '',
  );
  const [note, setNote] = useState('Cicilan');
  const [done, setDone] = useState(false);

  if (!debt) {
    return (
      <MoneyModalShell title="Catat Pembayaran" onClose={onClose}>
        <p className="py-6 text-center text-sm text-money-faint">
          Tidak ada utang/piutang aktif.
        </p>
        <MoneyPrimaryButton onClick={onClose}>Tutup</MoneyPrimaryButton>
      </MoneyModalShell>
    );
  }

  if (done) {
    return (
      <MoneyModalShell title="Catat Pembayaran" onClose={onClose}>
        <SuccessPanel
          title="Pembayaran tercatat"
          body={`Pembayaran ${formatIdr(parseIdrDigits(amount))} untuk ${debt.counterparty}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Catat Pembayaran"
      subtitle={`${debt.direction} · ${debt.counterparty} · sisa ${formatIdr(debt.remaining)}`}
      onClose={onClose}
      footer={
        <MoneyPrimaryButton
          disabled={
            parseIdrDigits(amount) <= 0 ||
            parseIdrDigits(amount) > debt.remaining
          }
          onClick={() => {
            appendDebtPayment(debt.id, parseIdrDigits(amount));
            setDone(true);
          }}
        >
          Simpan Pembayaran
        </MoneyPrimaryButton>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>Jumlah bayar</FieldLabel>
          <FieldInput
            value={amount}
            onChange={setAmount}
            inputMode="numeric"
          />
        </div>
        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldInput value={note} onChange={setNote} />
        </div>
      </div>
    </MoneyModalShell>
  );
}

export function AdjustmentModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload?: MoneyModalPayload;
}) {
  const { applyAdjustment, dataSource } = useMoneyTrackUi();
  const recorded = payload?.recorded ?? 0;
  const [actual, setActual] = useState(String(payload?.actual ?? recorded));
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const actualN = parseIdrDigits(actual);
  const diff = actualN - recorded;

  if (done) {
    return (
      <MoneyModalShell title="Adjustment" onClose={onClose}>
        <SuccessPanel
          title="Adjustment tersimpan"
          body={`Selisih ${formatIdr(diff)} untuk ${payload?.pocketName ?? 'kantong'}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Buat Adjustment"
      subtitle={payload?.pocketName ?? 'Penyesuaian saldo'}
      onClose={onClose}
      footer={
        <MoneyPrimaryButton
          disabled={!note.trim() || diff === 0}
          onClick={() => {
            if (payload?.pocketId) {
              applyAdjustment(payload.pocketId, actualN);
            }
            setDone(true);
          }}
        >
          Simpan Adjustment
        </MoneyPrimaryButton>
      }
    >
      <div className="space-y-3">
        <div className="rounded-[10px] bg-money-soft px-3 py-2 text-[12.5px] text-money-muted">
          Tercatat:{' '}
          <b className="font-money-mono text-money-ink">{formatIdr(recorded)}</b>
          <br />
          Selisih:{' '}
          <b
            className={`font-money-mono ${diff === 0 ? '' : diff > 0 ? 'text-money-blue' : 'text-money-rose'}`}
          >
            {diff === 0 ? 'Rp 0' : `${diff > 0 ? '+' : ''}${formatIdr(diff)}`}
          </b>
        </div>
        <div>
          <FieldLabel>Saldo riil</FieldLabel>
          <FieldInput value={actual} onChange={setActual} inputMode="numeric" />
        </div>
        <div>
          <FieldLabel>Catatan (wajib)</FieldLabel>
          <FieldTextarea
            value={note}
            onChange={setNote}
            placeholder="Alasan penyesuaian"
          />
        </div>
      </div>
    </MoneyModalShell>
  );
}
