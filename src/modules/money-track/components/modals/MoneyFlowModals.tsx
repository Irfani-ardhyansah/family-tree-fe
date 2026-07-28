import { useMemo, useState } from 'react';
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

export function TransferModal({ onClose }: { onClose: () => void }) {
  const { data, accounts, appendTransaction, dataSource } = useMoneyTrackUi();
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
  const [digits, setDigits] = useState('3000000');
  const [note, setNote] = useState('Uang belanja bulan ini');

  const pocketsOf = (personId: string) => {
    const person = data.persons.find((p) => p.id === personId);
    if (!person) return [];
    return accounts
      .filter((a) => a.personId === personId)
      .flatMap((a) =>
        a.pockets.map((p) => ({
          id: p.id,
          label: `${p.name} · ${a.name}`,
          balance: p.balance,
          person: person.name,
        })),
      );
  };

  const fromPockets = pocketsOf(fromPersonId);
  const toPockets = pocketsOf(toPersonId);
  const fromPocket =
    fromPockets.find((p) => p.id === fromPocketId) ?? fromPockets[0];
  const toPocket = toPockets.find((p) => p.id === toPocketId) ?? toPockets[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;
  const fromPerson = data.persons.find((p) => p.id === fromPersonId);
  const toPerson = data.persons.find((p) => p.id === toPersonId);

  const swap = () => {
    if (!toPersonId) return;
    setFromPersonId(toPersonId);
    setFromPocketId('');
    setToPocketId('');
  };

  const handleSave = () => {
    if (!fromPocket || !toPocket || amount <= 0) return;
    appendTransaction({
      id: `t-${Date.now()}`,
      dateLabel: todayLabel(),
      title: `Transfer ke ${toPerson?.name ?? 'pasangan'}`,
      category: 'Transfer',
      person: fromPerson?.name ?? '',
      personId: fromPersonId,
      pocket: `${fromPocket.label} → ${toPocket.label}`,
      kind: 'transfer',
      amount,
    });
    setStep(4);
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
              <MoneySecondaryButton onClick={() => setStep((s) => s - 1)}>
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={step > 1 && amount <= 0}
              onClick={() => {
                if (step === 1) {
                  if (!fromPocketId && fromPockets[0]) {
                    setFromPocketId(fromPockets[0].id);
                  }
                  setStep(2);
                  return;
                }
                if (step === 2) {
                  if (!toPocketId && toPockets[0]) setToPocketId(toPockets[0].id);
                  setStep(3);
                  return;
                }
                handleSave();
              }}
            >
              {step === 3 ? 'Kirim Transfer' : 'Lanjut'}
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
          <FieldLabel>Kirim dari kantong</FieldLabel>
          <div className="space-y-1.5">
            {fromPockets.map((p) => (
              <OptionCard
                key={p.id}
                active={(fromPocketId || fromPockets[0]?.id) === p.id}
                title={p.label}
                subtitle={formatIdr(p.balance)}
                onClick={() => setFromPocketId(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <AmountDisplay digits={digits} />
          <Numpad
            onDigit={(d) =>
              setDigits((prev) => (prev + d).replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            on000={() =>
              setDigits((prev) => (prev + '000').replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            onBackspace={() => setDigits((d) => d.slice(0, -1) || '0')}
          />
          <FieldLabel>Masuk ke kantong {toPerson?.name}</FieldLabel>
          <div className="max-h-36 space-y-1.5 overflow-y-auto">
            {toPockets.map((p) => (
              <OptionCard
                key={p.id}
                active={(toPocketId || toPockets[0]?.id) === p.id}
                title={p.label}
                subtitle={formatIdr(p.balance)}
                onClick={() => setToPocketId(p.id)}
              />
            ))}
          </div>
          <div>
            <FieldLabel>Catatan</FieldLabel>
            <FieldInput value={note} onChange={setNote} />
          </div>
        </div>
      )}

      {step === 3 && fromPocket && toPocket && (
        <div className="space-y-3">
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
          <p className="text-[12px] text-money-faint">Catatan: {note || '—'}</p>
        </div>
      )}
    </MoneyModalShell>
  );
}

export function MovePocketModal({ onClose }: { onClose: () => void }) {
  const { data, accounts, appendTransaction, dataSource } = useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const personId = data.loginPersonId || data.persons[0]?.id || '';
  const person = data.persons.find((p) => p.id === personId);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [digits, setDigits] = useState('2000000');
  const [note, setNote] = useState('Nabung rutin bulanan');

  const allPockets = useMemo(() => {
    return accounts
      .filter((a) => a.personId === personId || a.personId === null)
      .flatMap((a) =>
        a.pockets.map((p) => ({
          id: p.id,
          label: `${p.name}${a.personId === null ? ' (Bersama)' : ''} · ${a.name}`,
          balance: p.balance,
        })),
      );
  }, [accounts, personId]);

  const from = allPockets.find((p) => p.id === fromId) ?? allPockets[0];
  const toOptions = allPockets.filter((p) => p.id !== from?.id);
  const to = toOptions.find((p) => p.id === toId) ?? toOptions[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;

  const handleSave = () => {
    if (!from || !to || amount <= 0) return;
    appendTransaction({
      id: `t-${Date.now()}`,
      dateLabel: todayLabel(),
      title: 'Pindah antar kantong',
      category: 'Pindah kantong',
      person: person?.name ?? '',
      personId,
      pocket: `${from.label} → ${to.label}`,
      kind: 'transfer',
      amount,
    });
    setStep(4);
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
      subtitle={person ? `Milik ${person.name}` : undefined}
      onClose={onClose}
      step={step}
      stepTotal={3}
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
              onClick={() => {
                if (step === 1) {
                  if (!fromId && allPockets[0]) setFromId(allPockets[0].id);
                  setStep(2);
                  return;
                }
                if (step === 2) {
                  if (!toId && toOptions[0]) setToId(toOptions[0].id);
                  setStep(3);
                  return;
                }
                handleSave();
              }}
            >
              {step === 3 ? 'Pindahkan Saldo' : 'Lanjut'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-1.5">
          <FieldLabel>Dari kantong</FieldLabel>
          {allPockets.map((p) => (
            <OptionCard
              key={p.id}
              active={(fromId || allPockets[0]?.id) === p.id}
              title={p.label}
              subtitle={formatIdr(p.balance)}
              onClick={() => setFromId(p.id)}
            />
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-1.5">
          <FieldLabel>Ke kantong</FieldLabel>
          {toOptions.map((p) => (
            <OptionCard
              key={p.id}
              active={(toId || toOptions[0]?.id) === p.id}
              title={p.label}
              subtitle={formatIdr(p.balance)}
              onClick={() => setToId(p.id)}
            />
          ))}
        </div>
      )}
      {step === 3 && from && to && (
        <div className="space-y-3">
          <AmountDisplay digits={digits} />
          <Numpad
            onDigit={(d) =>
              setDigits((prev) => (prev + d).replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            on000={() =>
              setDigits((prev) => (prev + '000').replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            onBackspace={() => setDigits((d) => d.slice(0, -1) || '0')}
          />
          <FieldInput value={note} onChange={setNote} placeholder="Catatan" />
          <div className="flex items-center gap-2">
            <BalanceBox name={from.label} before={from.balance} after={from.balance - amount} />
            <span>→</span>
            <BalanceBox name={to.label} before={to.balance} after={to.balance + amount} />
          </div>
          <p className="text-center text-[12px] font-semibold text-money-faint">
            Total saldo {person?.name ?? ''} tidak berubah
          </p>
        </div>
      )}
    </MoneyModalShell>
  );
}

export function CashWithdrawalModal({ onClose }: { onClose: () => void }) {
  const { data, accounts, appendTransaction, dataSource } = useMoneyTrackUi();
  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState('');
  const [digits, setDigits] = useState('500000');
  const [dateLabel, setDateLabel] = useState(todayLabel());
  const [note, setNote] = useState('');

  const sources = useMemo(() => {
    return accounts
      .filter((a) => a.type !== 'cash')
      .flatMap((a) =>
        a.pockets.map((p) => ({
          id: p.id,
          label: `${a.name} — ${p.name}`,
          balance: p.balance,
          person: a.personName,
          personId: a.personId,
        })),
      );
  }, [accounts]);

  const source = sources.find((s) => s.id === sourceId) ?? sources[0];
  const amount = Number(digits.replace(/\D/g, '')) || 0;
  const cashAcc = accounts.find(
    (a) => a.type === 'cash' && a.personId === (source?.personId ?? data.loginPersonId),
  );
  const cashBal = cashAcc?.pockets[0]?.balance ?? 0;

  const handleSave = () => {
    if (!source || amount <= 0) return;
    appendTransaction({
      id: `t-${Date.now()}`,
      dateLabel,
      title: 'Tarik tunai ATM',
      category: 'Cash',
      person: source.person,
      personId: source.personId ?? data.loginPersonId,
      pocket: `${source.label} → Cash`,
      kind: 'cash_withdrawal',
      amount,
    });
    setStep(3);
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
              <MoneySecondaryButton onClick={() => setStep(1)}>
                Kembali
              </MoneySecondaryButton>
            </div>
          ) : null}
          <div className="flex-1">
            <MoneyPrimaryButton
              onClick={() => {
                if (step === 1) {
                  if (!sourceId && sources[0]) setSourceId(sources[0].id);
                  setStep(2);
                  return;
                }
                handleSave();
              }}
            >
              {step === 2 ? 'Catat Penarikan' : 'Lanjut'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-3">
          <AmountDisplay digits={digits} />
          <Numpad
            onDigit={(d) =>
              setDigits((prev) => (prev + d).replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            on000={() =>
              setDigits((prev) => (prev + '000').replace(/^0+(?=\d)/, '').slice(0, 12))
            }
            onBackspace={() => setDigits((d) => d.slice(0, -1) || '0')}
          />
          <FieldLabel>Dari rekening / kantong</FieldLabel>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {sources.map((s) => (
              <OptionCard
                key={s.id}
                active={(sourceId || sources[0]?.id) === s.id}
                title={s.label}
                subtitle={formatIdr(s.balance)}
                onClick={() => setSourceId(s.id)}
              />
            ))}
          </div>
        </div>
      )}
      {step === 2 && source && (
        <div className="space-y-3">
          <div>
            <FieldLabel>Tanggal Penarikan</FieldLabel>
            <FieldInput value={dateLabel} onChange={setDateLabel} />
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
