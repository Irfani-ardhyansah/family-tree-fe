import { useEffect, useMemo, useState } from 'react';
import {
  createMoneyCashWithdrawal,
  createMoneyTransfer,
} from '@/modules/money-track/api/moneyApi';
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
import {
  dateFromFormInput,
  formatDateOnlyLabel,
  todayDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import { ApiClientError } from '@/shared/lib/apiClient';

export function TransferModal({ onClose }: { onClose: () => void }) {
  const {
    data,
    accounts,
    appendTransaction,
    dataSource,
    refreshApi,
    bumpActivity,
  } = useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const [fromPersonId, setFromPersonId] = useState(
    data.persons[0]?.id ?? '',
  );
  const toPersonId =
    data.persons.find((p) => p.id !== fromPersonId)?.id ??
    data.persons[1]?.id ??
    '';
  const [fromPocketId, setFromPocketId] = useState('');
  const [toPocketId, setToPocketId] = useState('');
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [digits, setDigits] = useState('3000000');
  const [note, setNote] = useState('Uang belanja bulan ini');
  const [dateIso, setDateIso] = useState(todayDateOnlyIso);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromPockets = useMemo(() => {
    const person = data.persons.find((p) => p.id === fromPersonId);
    if (!person) return [];
    return accounts
      .filter((a) => a.personId === fromPersonId)
      .flatMap((a) =>
        a.pockets.map((p) => ({
          id: p.id,
          label: `${p.name} · ${a.name}`,
          balance: p.balance,
          person: person.name,
          search:
            `${p.name} ${a.name} ${person.name} ${p.category}`.toLowerCase(),
        })),
      );
  }, [accounts, data.persons, fromPersonId]);

  const toPockets = useMemo(() => {
    const person = data.persons.find((p) => p.id === toPersonId);
    if (!person) return [];
    return accounts
      .filter((a) => a.personId === toPersonId)
      .flatMap((a) =>
        a.pockets.map((p) => ({
          id: p.id,
          label: `${p.name} · ${a.name}`,
          balance: p.balance,
          person: person.name,
          search:
            `${p.name} ${a.name} ${person.name} ${p.category}`.toLowerCase(),
        })),
      );
  }, [accounts, data.persons, toPersonId]);

  const filteredFromPockets = useMemo(() => {
    const q = fromQuery.trim().toLowerCase();
    if (!q) return fromPockets;
    return fromPockets.filter((p) => p.search.includes(q));
  }, [fromPockets, fromQuery]);
  const filteredToPockets = useMemo(() => {
    const q = toQuery.trim().toLowerCase();
    if (!q) return toPockets;
    return toPockets.filter((p) => p.search.includes(q));
  }, [toPockets, toQuery]);
  const fromPocket =
    fromPockets.find((p) => p.id === fromPocketId) ??
    filteredFromPockets[0] ??
    fromPockets[0];
  const toPocket =
    toPockets.find((p) => p.id === toPocketId) ??
    filteredToPockets[0] ??
    toPockets[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;
  const fromPerson = data.persons.find((p) => p.id === fromPersonId);
  const toPerson = data.persons.find((p) => p.id === toPersonId);

  const swap = () => {
    if (!toPersonId) return;
    setFromPersonId(toPersonId);
    setFromPocketId('');
    setToPocketId('');
    setFromQuery('');
    setToQuery('');
  };

  const handleSave = async () => {
    if (!fromPocket || !toPocket || amount <= 0) return;
    const formDateIso = dateFromFormInput(dateIso);
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        await createMoneyTransfer({
          kind: 'interpersonal',
          fromPocketId: fromPocket.id,
          toPocketId: toPocket.id,
          amount,
          date: formDateIso,
          note: note.trim() || null,
        });
        await refreshApi();
        bumpActivity();
      } else {
        appendTransaction({
          id: `t-${Date.now()}`,
          dateLabel: formatDateOnlyLabel(formDateIso),
          dateIso: formDateIso,
          title: `Transfer ke ${toPerson?.name ?? 'pasangan'}`,
          category: 'Transfer',
          categoryId: null,
          person: fromPerson?.name ?? '',
          personId: fromPersonId,
          pocket: `${fromPocket.label} → ${toPocket.label}`,
          pocketId: fromPocket.id,
          kind: 'transfer',
          amount,
        });
      }
      setStep(4);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal mengirim transfer.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (data.persons.length < 2) {
    return (
      <MoneyModalShell title="Transfer ke Pasangan" onClose={onClose}>
        <p className="py-6 text-center text-[13px] text-money-muted">
          Transfer antar pasangan hanya tersedia di mode couple (butuh 2
          person).
        </p>
        <MoneyPrimaryButton onClick={onClose}>Tutup</MoneyPrimaryButton>
      </MoneyModalShell>
    );
  }

  if (step === 4) {
    return (
      <MoneyModalShell title="Transfer ke Pasangan" onClose={onClose}>
        <SuccessPanel
          title="Transfer berhasil"
          body={`${formatIdr(amount)} terkirim dari ${fromPocket?.label} ke ${toPocket?.label}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          balanceLabel={`Saldo ${fromPocket?.label}`}
          balanceValue={
            fromPocket ? formatIdr(fromPocket.balance - amount) : undefined
          }
          againLabel="Transfer lagi"
          onAgain={() => {
            setDigits('');
            setStep(1);
          }}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Transfer ke Pasangan"
      subtitle={
        step === 1
          ? 'Arah & kantong asal'
          : step === 2
            ? 'Nominal & tujuan'
            : 'Review dua sisi'
      }
      onClose={onClose}
      step={step}
      stepTotal={3}
      footer={
        <div className="flex gap-2">
          {step > 1 ? (
            <div className="w-28">
              <MoneySecondaryButton
                disabled={saving}
                onClick={() => setStep((s) => s - 1)}
              >
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={saving || (step > 1 && amount <= 0)}
              onClick={() => {
                if (step === 1) {
                  if (!fromPocketId && filteredFromPockets[0]) {
                    setFromPocketId(filteredFromPockets[0].id);
                  }
                  setStep(2);
                  return;
                }
                if (step === 2) {
                  if (!toPocketId && filteredToPockets[0]) {
                    setToPocketId(filteredToPockets[0].id);
                  }
                  setStep(3);
                  return;
                }
                void handleSave();
              }}
            >
              {step === 3
                ? saving
                  ? 'Mengirim…'
                  : 'Kirim Transfer'
                : 'Lanjut'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 py-2">
            <PersonChip name={fromPerson?.name ?? '—'} role="Pengirim" />
            <button
              type="button"
              onClick={swap}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-money-border bg-money-surface text-money-brown-deep"
            >
              ⇄
            </button>
            <PersonChip name={toPerson?.name ?? '—'} role="Penerima" />
          </div>
          <div>
            <FieldLabel>Kirim dari kantong</FieldLabel>
            <FieldInput
              value={fromQuery}
              onChange={setFromQuery}
              placeholder="Cari kantong atau rekening…"
            />
            <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto">
              {fromPockets.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Belum ada kantong untuk {fromPerson?.name ?? 'pengirim'}.
                </p>
              ) : filteredFromPockets.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Tidak ada kantong yang cocok.
                </p>
              ) : (
                filteredFromPockets.map((p) => (
                  <OptionCard
                    key={p.id}
                    active={
                      (fromPocketId || filteredFromPockets[0]?.id) === p.id
                    }
                    title={p.label}
                    subtitle={formatIdr(p.balance)}
                    onClick={() => setFromPocketId(p.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <AmountDisplay digits={digits} onChange={setDigits} />
          <Numpad
            onDigit={(d) =>
              setDigits((prev) => (prev + d).replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            on000={() =>
              setDigits((prev) => (prev + '000').replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            onBackspace={() => setDigits((d) => d.slice(0, -1) || '0')}
          />
          <div>
            <FieldLabel>Masuk ke kantong {toPerson?.name}</FieldLabel>
            <FieldInput
              value={toQuery}
              onChange={setToQuery}
              placeholder="Cari kantong atau rekening…"
            />
            <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
              {toPockets.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Belum ada kantong untuk {toPerson?.name ?? 'penerima'}.
                </p>
              ) : filteredToPockets.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Tidak ada kantong yang cocok.
                </p>
              ) : (
                filteredToPockets.map((p) => (
                  <OptionCard
                    key={p.id}
                    active={(toPocketId || filteredToPockets[0]?.id) === p.id}
                    title={p.label}
                    subtitle={formatIdr(p.balance)}
                    onClick={() => setToPocketId(p.id)}
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
            <FieldLabel>Catatan</FieldLabel>
            <FieldInput value={note} onChange={setNote} />
          </div>
        </div>
      )}

      {step === 3 && fromPocket && toPocket && (
        <div className="space-y-3">
          {error ? (
            <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
              {error}
            </div>
          ) : null}
          <div className="rounded-[12px] border border-money-border p-4 text-center">
            <div className="text-[10px] font-bold uppercase text-money-faint">
              Transfer
            </div>
            <div className="font-money-mono text-xl font-extrabold">
              {formatIdr(amount)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BalanceBox
              name={`${fromPerson?.name} · ${fromPocket.label}`}
              before={fromPocket.balance}
              after={fromPocket.balance - amount}
            />
            <span className="text-money-faint">→</span>
            <BalanceBox
              name={`${toPerson?.name} · ${toPocket.label}`}
              before={toPocket.balance}
              after={toPocket.balance + amount}
            />
          </div>
          <p className="text-[12px] text-money-faint">
            Tanggal: {formatDateOnlyLabel(dateFromFormInput(dateIso))}
          </p>
          <p className="text-[12px] text-money-faint">Catatan: {note || '—'}</p>
        </div>
      )}
    </MoneyModalShell>
  );
}

export function MovePocketModal({ onClose }: { onClose: () => void }) {
  const {
    data,
    accounts,
    appendTransaction,
    dataSource,
    refreshApi,
    bumpActivity,
  } = useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [dateIso, setDateIso] = useState(todayDateOnlyIso);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPockets = useMemo(() => {
    const list: {
      id: string;
      label: string;
      balance: number;
      personId: string | null;
      personName: string;
      search: string;
    }[] = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        const personName =
          acc.personId == null ? 'Bersama' : acc.personName;
        const label = `${p.name} — ${personName} (${acc.name})`;
        list.push({
          id: p.id,
          label,
          balance: p.balance,
          personId: acc.personId,
          personName,
          search: `${p.name} ${personName} ${acc.name} ${p.category}`.toLowerCase(),
        });
      }
    }
    return list;
  }, [accounts]);

  const filterPockets = (query: string, excludeId?: string) => {
    const q = query.trim().toLowerCase();
    return allPockets.filter((p) => {
      if (excludeId && p.id === excludeId) return false;
      if (!q) return true;
      return p.search.includes(q);
    });
  };

  const fromOptions = useMemo(
    () => filterPockets(fromQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allPockets via filterPockets
    [allPockets, fromQuery],
  );
  const from = allPockets.find((p) => p.id === fromId) ?? fromOptions[0];
  const toOptions = useMemo(
    () => filterPockets(toQuery, from?.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPockets, toQuery, from?.id],
  );
  const to = allPockets.find((p) => p.id === toId && p.id !== from?.id) ??
    toOptions[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;

  useEffect(() => {
    if (fromId && !allPockets.some((p) => p.id === fromId)) {
      setFromId(fromOptions[0]?.id ?? '');
    }
  }, [allPockets, fromId, fromOptions]);

  useEffect(() => {
    if (toId && (!to || to.id === from?.id)) {
      setToId(toOptions[0]?.id ?? '');
    }
  }, [toId, to, from?.id, toOptions]);

  const transferKind: 'interpersonal' | 'interpocket' =
    from?.personId &&
    to?.personId &&
    from.personId !== to.personId
      ? 'interpersonal'
      : 'interpocket';

  const handleSave = async () => {
    if (!from || !to || amount <= 0) return;
    const formDateIso = dateFromFormInput(dateIso);
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        await createMoneyTransfer({
          kind: transferKind,
          fromPocketId: from.id,
          toPocketId: to.id,
          amount,
          date: formDateIso,
          note: note.trim() || null,
        });
        await refreshApi();
        bumpActivity();
      } else {
        appendTransaction({
          id: `t-${Date.now()}`,
          dateLabel: formatDateOnlyLabel(formDateIso),
          dateIso: formDateIso,
          title: 'Pindah antar kantong',
          category: 'Pindah kantong',
          categoryId: null,
          person: from.personName,
          personId: from.personId ?? data.loginPersonId,
          pocket: `${from.label} → ${to.label}`,
          pocketId: from.id,
          kind: 'transfer',
          amount,
        });
      }
      setStep(4);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal memindahkan saldo.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (step === 4) {
    return (
      <MoneyModalShell title="Pindah Antar Kantong" onClose={onClose}>
        <SuccessPanel
          title="Saldo dipindahkan"
          body={`${formatIdr(amount)} dari ${from?.label} ke ${to?.label}${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Pindah Antar Kantong"
      subtitle="Pilih kantong sumber & tujuan (termasuk kantong pasangan)"
      onClose={onClose}
      step={step}
      stepTotal={3}
      footer={
        <div className="flex gap-2">
          {step > 1 ? (
            <div className="w-28">
              <MoneySecondaryButton
                disabled={saving}
                onClick={() => setStep((s) => s - 1)}
              >
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={
                saving ||
                (step === 1 && fromOptions.length === 0) ||
                (step === 2 && toOptions.length === 0) ||
                (step === 3 && (!from || !to || amount <= 0))
              }
              onClick={() => {
                if (step === 1) {
                  if (!fromId && fromOptions[0]) setFromId(fromOptions[0].id);
                  setStep(2);
                  return;
                }
                if (step === 2) {
                  if (!toId && toOptions[0]) setToId(toOptions[0].id);
                  setStep(3);
                  return;
                }
                void handleSave();
              }}
            >
              {step === 3
                ? saving
                  ? 'Memindahkan…'
                  : 'Pindahkan Saldo'
                : 'Lanjut'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-2">
          <FieldLabel>Dari kantong</FieldLabel>
          <FieldInput
            value={fromQuery}
            onChange={setFromQuery}
            placeholder="Cari kantong, person, atau account…"
          />
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {fromOptions.length === 0 ? (
              <p className="text-[12.5px] text-money-faint">
                Tidak ada kantong yang cocok.
              </p>
            ) : (
              fromOptions.map((p) => (
                <OptionCard
                  key={p.id}
                  active={(fromId || fromOptions[0]?.id) === p.id}
                  title={p.label}
                  subtitle={formatIdr(p.balance)}
                  onClick={() => setFromId(p.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <FieldLabel>Ke kantong</FieldLabel>
          <FieldInput
            value={toQuery}
            onChange={setToQuery}
            placeholder="Cari kantong, person, atau account…"
          />
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {toOptions.length === 0 ? (
              <p className="text-[12.5px] text-money-faint">
                Tidak ada kantong tujuan yang cocok.
              </p>
            ) : (
              toOptions.map((p) => (
                <OptionCard
                  key={p.id}
                  active={(toId || toOptions[0]?.id) === p.id}
                  title={p.label}
                  subtitle={formatIdr(p.balance)}
                  onClick={() => setToId(p.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
      {step === 3 && from && to && (
        <div className="space-y-3">
          {error ? (
            <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
              {error}
            </div>
          ) : null}
          <AmountDisplay digits={digits} onChange={setDigits} />
          <Numpad
            onDigit={(d) =>
              setDigits((prev) =>
                (prev + d).replace(/^0+(?=\d)/, '').slice(0, 12),
              )
            }
            on000={() =>
              setDigits((prev) =>
                (prev + '000').replace(/^0+(?=\d)/, '').slice(0, 12),
              )
            }
            onBackspace={() => setDigits((d) => d.slice(0, -1))}
          />
          <div>
            <FieldLabel>Tanggal</FieldLabel>
            <FieldInput type="date" value={dateIso} onChange={setDateIso} />
          </div>
          <FieldInput
            value={note}
            onChange={setNote}
            placeholder="Catatan (opsional)"
          />
          <div className="flex items-center gap-2">
            <BalanceBox
              name={from.label}
              before={from.balance}
              after={from.balance - amount}
            />
            <span>→</span>
            <BalanceBox
              name={to.label}
              before={to.balance}
              after={to.balance + amount}
            />
          </div>
          <p className="text-center text-[12px] font-semibold text-money-faint">
            {transferKind === 'interpersonal'
              ? 'Transfer antar person (pasangan)'
              : 'Pindah antar kantong'}
          </p>
        </div>
      )}
    </MoneyModalShell>
  );
}

export function CashWithdrawalModal({ onClose }: { onClose: () => void }) {
  const {
    data,
    accounts,
    appendTransaction,
    dataSource,
    refreshApi,
    bumpActivity,
  } = useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState('');
  const [sourceQuery, setSourceQuery] = useState('');
  const [digits, setDigits] = useState('500000');
  const [dateIso, setDateIso] = useState(todayDateOnlyIso);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = useMemo(() => {
    return accounts
      .filter((a) => a.type !== 'cash')
      .flatMap((a) =>
        a.pockets.map((p) => ({
          id: p.id,
          accountId: a.id,
          label: `${a.name} — ${p.name}`,
          balance: p.balance,
          person: a.personName,
          personId: a.personId,
          search:
            `${p.name} ${a.name} ${a.personName} ${p.category}`.toLowerCase(),
        })),
      );
  }, [accounts]);

  const filteredSources = useMemo(() => {
    const q = sourceQuery.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((s) => s.search.includes(q));
  }, [sources, sourceQuery]);

  const source =
    sources.find((s) => s.id === sourceId) ??
    filteredSources[0] ??
    sources[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;
  const cashAcc = accounts.find(
    (a) => a.type === 'cash' && a.personId === (source?.personId ?? data.loginPersonId),
  );
  const cashBal = cashAcc?.pockets[0]?.balance ?? 0;

  const handleSave = async () => {
    if (!source || amount <= 0) return;
    const formDateIso = dateFromFormInput(dateIso);
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        await createMoneyCashWithdrawal({
          fromAccountId: source.accountId,
          fromPocketId: source.id,
          amount,
          date: formDateIso,
          note: note.trim() || null,
        });
        await refreshApi();
        bumpActivity();
      } else {
        appendTransaction({
          id: `t-${Date.now()}`,
          dateLabel: formatDateOnlyLabel(formDateIso),
          dateIso: formDateIso,
          title: 'Tarik tunai ATM',
          category: 'Cash',
          categoryId: null,
          person: source.person,
          personId: source.personId ?? data.loginPersonId,
          pocket: `${source.label} → Cash`,
          pocketId: source.id,
          kind: 'cash_withdrawal',
          amount,
        });
      }
      setStep(3);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal mencatat penarikan.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (step === 3) {
    return (
      <MoneyModalShell title="Tarik Tunai" onClose={onClose}>
        <SuccessPanel
          title="Penarikan tercatat"
          body={`${formatIdr(amount)} pindah ke Cash${dataSource === 'dummy' ? ' (dummy)' : ''}.`}
          balanceLabel="Saldo Cash"
          balanceValue={formatIdr(cashBal + amount)}
          onDone={onClose}
        />
      </MoneyModalShell>
    );
  }

  return (
    <MoneyModalShell
      title="Tarik Tunai"
      subtitle={step === 1 ? 'Sumber & nominal' : 'Tanggal & catatan'}
      onClose={onClose}
      step={step}
      stepTotal={2}
      footer={
        <div className="flex gap-2">
          {step > 1 ? (
            <div className="w-28">
              <MoneySecondaryButton
                disabled={saving}
                onClick={() => setStep(1)}
              >
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={saving || (step === 1 && amount <= 0)}
              onClick={() => {
                if (step === 1) {
                  if (!sourceId && filteredSources[0]) {
                    setSourceId(filteredSources[0].id);
                  }
                  setStep(2);
                  return;
                }
                void handleSave();
              }}
            >
              {step === 2
                ? saving
                  ? 'Menyimpan…'
                  : 'Catat Penarikan'
                : 'Lanjut'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-3">
          <AmountDisplay digits={digits} onChange={setDigits} />
          <Numpad
            onDigit={(d) =>
              setDigits((prev) => (prev + d).replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            on000={() =>
              setDigits((prev) => (prev + '000').replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            onBackspace={() => setDigits((d) => d.slice(0, -1) || '0')}
          />
          <div>
            <FieldLabel>Dari rekening / kantong</FieldLabel>
            <FieldInput
              value={sourceQuery}
              onChange={setSourceQuery}
              placeholder="Cari kantong, person, atau rekening…"
            />
            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {sources.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Belum ada kantong sumber (non-cash).
                </p>
              ) : filteredSources.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Tidak ada kantong yang cocok.
                </p>
              ) : (
                filteredSources.map((s) => (
                  <OptionCard
                    key={s.id}
                    active={(sourceId || filteredSources[0]?.id) === s.id}
                    title={s.label}
                    subtitle={`${s.person} · ${formatIdr(s.balance)}`}
                    onClick={() => setSourceId(s.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {step === 2 && source && (
        <div className="space-y-3">
          {error ? (
            <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
              {error}
            </div>
          ) : null}
          <div>
            <FieldLabel>Tanggal Penarikan</FieldLabel>
            <FieldInput type="date" value={dateIso} onChange={setDateIso} />
            <p className="mt-1.5 text-[11px] text-money-faint">
              Bukan hari ini? Ubah tanggal — wajar kalau baru sempat dicatat.
            </p>
          </div>
          <div>
            <FieldLabel>Catatan</FieldLabel>
            <FieldInput
              value={note}
              onChange={setNote}
              placeholder='mis. "Buat bayar tukang"'
            />
          </div>
          <div className="flex items-center gap-2">
            <BalanceBox
              name={source.label}
              before={source.balance}
              after={source.balance - amount}
            />
            <span>→</span>
            <BalanceBox
              name={`Cash — ${source.person}`}
              before={cashBal}
              after={cashBal + amount}
            />
          </div>
        </div>
      )}
    </MoneyModalShell>
  );
}

function PersonChip({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-money-brown text-sm font-extrabold text-white">
        {name.slice(0, 1)}
      </div>
      <span className="text-[11px] font-bold">{name}</span>
      <small className="text-[9px] text-money-faint">{role}</small>
    </div>
  );
}

function BalanceBox({
  name,
  before,
  after,
}: {
  name: string;
  before: number;
  after: number;
}) {
  return (
    <div className="flex-1 rounded-[9px] border border-money-border bg-money-surface p-2 text-center">
      <div className="truncate text-[10px] font-extrabold">{name}</div>
      <div className="font-money-mono text-[9px] text-money-faint line-through">
        {formatIdr(before)}
      </div>
      <div className="font-money-mono text-[11px] font-extrabold text-money-brown-deep">
        {formatIdr(after)}
      </div>
    </div>
  );
}
