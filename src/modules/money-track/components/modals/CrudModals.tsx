import { useState } from 'react';
import {
  archiveMoneyPocket,
  createMoneyAccount,
  createMoneyPocket,
  deleteMoneyAccount,
  updateMoneyAccount,
  updateMoneyPocket,
} from '@/modules/money-track/api/moneyApi';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import { formatIdr } from '@/modules/money-track/types';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  MoneyAmountInput,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  MoneyModalShell,
  MoneyPrimaryButton,
  MoneySecondaryButton,
  SuccessPanel,
} from '@/modules/money-track/components/modals/MoneyModalShell';
import {
  parseIdrDigits,
  todayLabel,
  type MoneyModalPayload,
} from '@/modules/money-track/components/modals/modalTypes';
import { ApiClientError } from '@/shared/lib/apiClient';

export function AccountModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload?: MoneyModalPayload;
}) {
  const {
    data,
    accounts,
    appendAccount,
    patchAccount,
    removeAccount,
    dataSource,
    refreshApi,
  } = useMoneyTrackUi();
  const editingId = payload?.accountId;
  const editing = Boolean(editingId);
  const existing = editing
    ? accounts.find((a) => a.id === editingId)
    : undefined;

  const [personId, setPersonId] = useState(
    payload?.personId ?? data.persons[0]?.id ?? '',
  );
  const [name, setName] = useState(payload?.accountName ?? '');
  const [type, setType] = useState(payload?.accountType ?? 'bank');
  const [done, setDone] = useState(false);
  const [doneAction, setDoneAction] = useState<'save' | 'delete'>('save');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCash = (existing?.type ?? type) === 'cash';

  if (done) {
    return (
      <MoneyModalShell
        title={editing ? 'Edit Account' : 'Tambah Account'}
        onClose={onClose}
      >
        <SuccessPanel
          title={doneAction === 'delete' ? 'Account dihapus' : 'Account tersimpan'}
          body={`${name}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title={editing ? 'Edit Account' : 'Tambah Account'}
      subtitle={
        editing
          ? isCash
            ? 'Account cash — hapus tidak diizinkan'
            : 'Ubah nama atau hapus account'
          : 'Bank, e-wallet, atau cash'
      }
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {editing && !isCash ? (
            <div className="w-28">
              <MoneySecondaryButton
                disabled={saving}
                onClick={() => {
                  void (async () => {
                    if (
                      !window.confirm(
                        `Hapus account "${name}"? Semua pocket harus sudah di-archive/hapus dulu.`,
                      )
                    ) {
                      return;
                    }
                    setSaving(true);
                    setError(null);
                    try {
                      if (dataSource === 'api') {
                        await deleteMoneyAccount(editingId!);
                        await refreshApi();
                      } else {
                        removeAccount(editingId!);
                      }
                      setDoneAction('delete');
                      setDone(true);
                    } catch (err) {
                      setError(
                        err instanceof ApiClientError
                          ? err.message
                          : 'Gagal menghapus account.',
                      );
                    } finally {
                      setSaving(false);
                    }
                  })();
                }}
              >
                Hapus
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={
                !name.trim() ||
                saving ||
                (!editing && (!personId || data.persons.length === 0))
              }
              onClick={() => {
                void (async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    const trimmed = name.trim();
                    if (editing) {
                      if (dataSource === 'api') {
                        await updateMoneyAccount(editingId!, {
                          name: trimmed,
                          bankName:
                            (existing?.type ?? type) === 'bank'
                              ? trimmed
                              : undefined,
                        });
                        await refreshApi();
                      } else {
                        patchAccount(editingId!, { name: trimmed });
                      }
                    } else {
                      const person = data.persons.find((p) => p.id === personId);
                      if (dataSource === 'api') {
                        await createMoneyAccount({
                          personId,
                          name: trimmed,
                          type: type as 'bank' | 'ewallet' | 'cash',
                          bankName: type === 'bank' ? trimmed : null,
                        });
                        await refreshApi();
                      } else {
                        appendAccount({
                          id: `acc-${Date.now()}`,
                          personId,
                          personName: person?.name ?? '—',
                          name: trimmed,
                          type: type as 'bank' | 'ewallet' | 'cash',
                          pockets: [],
                        });
                      }
                    }
                    setDoneAction('save');
                    setDone(true);
                  } catch (err) {
                    setError(
                      err instanceof ApiClientError
                        ? err.message
                        : editing
                          ? 'Gagal mengubah account.'
                          : 'Gagal menambah account.',
                    );
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              {saving ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Simpan Account'}
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
        {!editing && data.persons.length === 0 ? (
          <p className="text-[12.5px] text-money-faint">
            Belum ada person Money Track. Selesaikan setup dulu.
          </p>
        ) : null}
        {!editing ? (
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
        ) : (
          <div className="rounded-[10px] bg-money-soft px-3 py-2 text-[12.5px] text-money-muted">
            Pemilik: <b className="text-money-ink">{existing?.personName ?? '—'}</b>
            {' · '}
            Tipe:{' '}
            <b className="capitalize text-money-ink">
              {existing?.type === 'ewallet' ? 'E-wallet' : existing?.type}
            </b>
          </div>
        )}
        <div>
          <FieldLabel>Nama</FieldLabel>
          <FieldInput
            value={name}
            onChange={setName}
            placeholder="mis. BCA, GoPay"
          />
        </div>
        {!editing ? (
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
        ) : null}
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
  const {
    accounts,
    appendPocket,
    patchPocket,
    removePocket,
    dataSource,
    refreshApi,
    data,
  } = useMoneyTrackUi();
  const editingId = payload?.pocketId;
  const editing = Boolean(editingId);
  const creatableAccounts = accounts.filter((a) => a.type !== 'cash');

  const [accountId, setAccountId] = useState(
    payload?.accountId ?? creatableAccounts[0]?.id ?? accounts[0]?.id ?? '',
  );
  const [name, setName] = useState(
    editing ? (payload?.pocketName ?? '') : 'Transaksi',
  );
  const [category, setCategory] = useState(
    payload?.pocketCategory ?? 'transaksi',
  );
  const [ownerType, setOwnerType] = useState<'person' | 'joint'>('person');
  const [goal, setGoal] = useState(
    payload?.pocketGoalAmount != null && payload.pocketGoalAmount > 0
      ? String(payload.pocketGoalAmount)
      : '',
  );
  const [done, setDone] = useState(false);
  const [doneAction, setDoneAction] = useState<'save' | 'delete'>('save');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount =
    accounts.find((a) => a.id === accountId) ?? creatableAccounts[0];
  const isCashAccount = selectedAccount?.type === 'cash';
  const isSystem = Boolean(payload?.pocketIsSystem);
  const canDelete = editing
    ? Boolean(payload?.pocketCanDelete)
    : true;

  if (done) {
    return (
      <MoneyModalShell
        title={editing ? 'Edit Pocket' : 'Tambah Pocket'}
        onClose={onClose}
      >
        <SuccessPanel
          title={
            doneAction === 'delete' ? 'Pocket dihapus' : 'Pocket tersimpan'
          }
          body={`${name}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title={editing ? 'Edit Pocket' : 'Tambah Pocket'}
      subtitle={
        editing
          ? isSystem
            ? 'Pocket sistem — nama/kategori terkunci; hapus tidak diizinkan'
            : !canDelete
              ? 'Ubah detail. Hapus tidak tersedia (saldo harus 0).'
              : 'Ubah detail atau hapus pocket'
          : payload?.accountName
            ? `Di account ${payload.accountName}`
            : 'Kantong logis di dalam account'
      }
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {editing && canDelete ? (
            <div className="w-28">
              <MoneySecondaryButton
                disabled={saving}
                onClick={() => {
                  void (async () => {
                    if (
                      !window.confirm(
                        `Hapus pocket "${name}"? Pocket akan di-archive dan bisa dipulihkan nanti.`,
                      )
                    ) {
                      return;
                    }
                    setSaving(true);
                    setError(null);
                    try {
                      if (dataSource === 'api') {
                        await archiveMoneyPocket(editingId!);
                        await refreshApi();
                      } else {
                        removePocket(accountId, editingId!);
                      }
                      setDoneAction('delete');
                      setDone(true);
                    } catch (err) {
                      setError(
                        err instanceof ApiClientError
                          ? err.message
                          : 'Gagal menghapus pocket.',
                      );
                    } finally {
                      setSaving(false);
                    }
                  })();
                }}
              >
                Hapus
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={
                !name.trim() ||
                saving ||
                (!editing &&
                  (!accountId ||
                    isCashAccount ||
                    creatableAccounts.length === 0))
              }
              onClick={() => {
                void (async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    const trimmed = name.trim();
                    const goalAmount = goal ? parseIdrDigits(goal) : null;
                    const cat = category as
                      | 'transaksi'
                      | 'tabungan'
                      | 'investasi'
                      | 'custom';

                    if (editing) {
                      if (dataSource === 'api') {
                        await updateMoneyPocket(editingId!, {
                          ...(isSystem ? {} : { name: trimmed, category: cat }),
                          goalAmount,
                        });
                        await refreshApi();
                      } else {
                        patchPocket(accountId, editingId!, {
                          ...(isSystem ? {} : { name: trimmed, category: cat }),
                          ...(goalAmount
                            ? { goalAmount, goalPct: 0 }
                            : { goalAmount: undefined, goalPct: undefined }),
                        });
                      }
                    } else {
                      if (dataSource === 'api') {
                        await createMoneyPocket({
                          accountId,
                          name: trimmed,
                          category: cat,
                          ownerType:
                            data.mode === 'couple' ? ownerType : 'person',
                          goalAmount,
                        });
                        await refreshApi();
                      } else {
                        appendPocket(accountId, {
                          id: `p-${Date.now()}`,
                          name: trimmed,
                          category: cat,
                          balance: 0,
                          canDelete: true,
                          ...(goalAmount ? { goalAmount, goalPct: 0 } : {}),
                          ...(ownerType === 'joint' ? { joint: true } : {}),
                        });
                      }
                    }
                    setDoneAction('save');
                    setDone(true);
                  } catch (err) {
                    setError(
                      err instanceof ApiClientError
                        ? err.message
                        : editing
                          ? 'Gagal mengubah pocket.'
                          : 'Gagal menambah pocket.',
                    );
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              {saving
                ? 'Menyimpan…'
                : editing
                  ? 'Simpan Perubahan'
                  : 'Simpan Pocket'}
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
        {!editing && creatableAccounts.length === 0 ? (
          <p className="text-[12.5px] text-money-faint">
            Belum ada account bank/e-wallet. Tambah account dulu (bukan cash).
          </p>
        ) : null}
        <div>
          <FieldLabel>Account</FieldLabel>
          {editing ? (
            <div className="rounded-[10px] bg-money-soft px-3 py-2.5 text-[13.5px] font-semibold text-money-ink">
              {selectedAccount
                ? `${selectedAccount.personName} · ${selectedAccount.name}`
                : payload?.accountName ?? '—'}
            </div>
          ) : (
            <FieldSelect
              value={accountId}
              onChange={setAccountId}
              options={creatableAccounts.map((a) => ({
                value: a.id,
                label: `${a.personName} · ${a.name}`,
              }))}
            />
          )}
          {!editing && isCashAccount ? (
            <p className="mt-1 text-[11.5px] text-money-rose">
              Account cash tidak bisa ditambah pocket manual.
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel>Nama kantong</FieldLabel>
          <FieldInput
            value={name}
            onChange={setName}
            placeholder="mis. Transaksi"
          />
          {editing && isSystem ? (
            <p className="mt-1 text-[11.5px] text-money-faint">
              Nama pocket sistem tidak bisa diubah di API (simpan hanya goal).
            </p>
          ) : null}
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
        {!editing && data.mode === 'couple' ? (
          <div>
            <FieldLabel>Kepemilikan</FieldLabel>
            <FieldSelect
              value={ownerType}
              onChange={(v) => setOwnerType(v as 'person' | 'joint')}
              options={[
                { value: 'person', label: 'Pribadi (ikut pemilik account)' },
                { value: 'joint', label: 'Bersama (joint)' },
              ]}
            />
          </div>
        ) : null}
        <div>
          <FieldLabel>Goal (opsional)</FieldLabel>
          <MoneyAmountInput
            value={goal}
            onChange={setGoal}
            placeholder="mis. 50.000.000"
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
          <MoneyAmountInput
            value={price}
            onChange={setPrice}
            placeholder="mis. 2.500.000"
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
              directionLabel: direction === 'piutang' ? 'Piutang' : 'Utang',
              person: person?.name ?? '',
              personId,
              amount: amt,
              paidTotal: 0,
              remaining: amt,
              remainingLabel:
                direction === 'piutang' ? 'Sisa piutang' : 'Sisa utang',
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
          <MoneyAmountInput
            value={amount}
            onChange={setAmount}
            placeholder="mis. 1.000.000"
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
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
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
      subtitle={`${debt.directionLabel} · ${debt.counterparty} · ${debt.remainingLabel} ${formatIdr(debt.remaining)}`}
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
          <MoneyAmountInput
            value={amount}
            onChange={setAmount}
            placeholder="mis. 200.000"
          />
        </div>
        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldInput
            value={note}
            onChange={setNote}
            placeholder="mis. Cicilan 1"
          />
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
  const [actual, setActual] = useState(
    String(payload?.actual ?? recorded).replace(/\D/g, ''),
  );
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
          <MoneyAmountInput
            value={actual}
            onChange={setActual}
            placeholder="mis. 8.330.000"
          />
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
