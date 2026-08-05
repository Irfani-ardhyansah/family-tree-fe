import { useEffect, useMemo, useState } from 'react';
import {
  deleteMoneyCashWithdrawal,
  deleteMoneyTransfer,
  fetchMoneyCashWithdrawal,
  fetchMoneyTransfer,
  updateMoneyCashWithdrawal,
  updateMoneyTransfer,
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
import {
  dateFromFormInput,
  formatDateOnlyLabel,
  todayDateOnlyIso,
  toDateOnlyIso,
} from '@/modules/money-track/lib/dateOnly';
import { formatIdr } from '@/modules/money-track/types';
import { ApiClientError } from '@/shared/lib/apiClient';

type PocketOption = {
  id: string;
  accountId: string;
  label: string;
  balance: number;
  personId: string | null;
  personName: string;
  search: string;
};

export function EditActivityModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload?: MoneyModalPayload;
}) {
  const {
    accounts,
    dataSource,
    refreshApi,
    bumpActivity,
    removeTransaction,
    patchTransaction,
  } = useMoneyTrackUi();

  const kind = payload?.activityKind ?? 'transfer';
  const editingId = payload?.activityId ?? '';
  const title =
    kind === 'cash_withdrawal' ? 'Edit Tarik Tunai' : 'Edit Transfer / Pindah';

  const [digits, setDigits] = useState(
    payload?.txAmount != null && payload.txAmount > 0
      ? String(payload.txAmount)
      : '',
  );
  const [dateIso, setDateIso] = useState(
    payload?.txDateIso
      ? toDateOnlyIso(payload.txDateIso)
      : todayDateOnlyIso(),
  );
  const [note, setNote] = useState(payload?.txNote ?? '');
  const [fromPocketId, setFromPocketId] = useState(
    payload?.fromPocketId ?? payload?.pocketId ?? '',
  );
  const [toPocketId, setToPocketId] = useState(payload?.toPocketId ?? '');
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(dataSource === 'api');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPockets = useMemo(() => {
    const list: PocketOption[] = [];
    for (const acc of accounts) {
      for (const p of acc.pockets) {
        const personName = acc.personId == null ? 'Bersama' : acc.personName;
        list.push({
          id: p.id,
          accountId: acc.id,
          label: `${p.name} — ${personName} (${acc.name})`,
          balance: p.balance,
          personId: acc.personId,
          personName,
          search:
            `${p.name} ${personName} ${acc.name} ${p.category}`.toLowerCase(),
        });
      }
    }
    return list;
  }, [accounts]);

  const cashSources = useMemo(
    () =>
      allPockets.filter((p) => {
        const acc = accounts.find((a) => a.id === p.accountId);
        return acc?.type !== 'cash';
      }),
    [allPockets, accounts],
  );

  const filterPockets = (list: PocketOption[], query: string, excludeId?: string) => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (excludeId && p.id === excludeId) return false;
      if (!q) return true;
      return p.search.includes(q);
    });
  };

  const fromOptions = useMemo(
    () =>
      filterPockets(
        kind === 'cash_withdrawal' ? cashSources : allPockets,
        fromQuery,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, cashSources, allPockets, fromQuery],
  );
  const toOptions = useMemo(
    () => filterPockets(allPockets, toQuery, fromPocketId || undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPockets, toQuery, fromPocketId],
  );

  const fromPocket =
    allPockets.find((p) => p.id === fromPocketId) ?? fromOptions[0];
  const toPocket =
    allPockets.find((p) => p.id === toPocketId && p.id !== fromPocket?.id) ??
    toOptions[0];

  const transferKind: 'interpersonal' | 'interpocket' =
    fromPocket?.personId &&
    toPocket?.personId &&
    fromPocket.personId !== toPocket.personId
      ? 'interpersonal'
      : 'interpocket';

  useEffect(() => {
    if (dataSource !== 'api' || !editingId) {
      setLoadingDetail(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingDetail(true);
      setError(null);
      try {
        if (kind === 'cash_withdrawal') {
          const detail = await fetchMoneyCashWithdrawal(editingId);
          if (cancelled) return;
          setDigits(String(detail.amount));
          setDateIso(toDateOnlyIso(detail.date));
          setNote(detail.note ?? '');
          if (detail.fromPocketId != null) {
            setFromPocketId(String(detail.fromPocketId));
          }
        } else {
          const detail = await fetchMoneyTransfer(editingId);
          if (cancelled) return;
          setDigits(String(detail.amount));
          setDateIso(toDateOnlyIso(detail.date));
          setNote(detail.note ?? '');
          setFromPocketId(String(detail.fromPocketId));
          setToPocketId(String(detail.toPocketId));
        }
      } catch (err) {
        if (!cancelled) {
          // Form tetap bisa diisi dari payload list jika detail gagal.
          setError(
            err instanceof ApiClientError
              ? `Detail belum lengkap: ${err.message}`
              : 'Detail belum lengkap — lengkapi kantong manual.',
          );
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dataSource, editingId, kind]);

  const amount = parseIdrDigits(digits);
  const canSave =
    amount > 0 &&
    Boolean(fromPocket) &&
    (kind === 'cash_withdrawal' || Boolean(toPocket));

  const handleSave = async () => {
    if (!editingId || !canSave || !fromPocket) return;
    if (kind !== 'cash_withdrawal' && !toPocket) return;
    const formDateIso = dateFromFormInput(dateIso);
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        if (kind === 'cash_withdrawal') {
          await updateMoneyCashWithdrawal(editingId, {
            fromAccountId: fromPocket.accountId,
            fromPocketId: fromPocket.id,
            amount,
            date: formDateIso,
            note: note.trim() || null,
          });
        } else {
          await updateMoneyTransfer(editingId, {
            kind: transferKind,
            fromPocketId: fromPocket.id,
            toPocketId: toPocket!.id,
            amount,
            date: formDateIso,
            note: note.trim() || null,
          });
        }
        await refreshApi();
        bumpActivity();
      } else {
        patchTransaction(editingId, {
          amount,
          dateIso: formDateIso,
          dateLabel: formatDateOnlyLabel(formDateIso),
          title:
            note.trim() ||
            (kind === 'cash_withdrawal'
              ? 'Tarik tunai'
              : `Transfer ${fromPocket.label} → ${toPocket!.label}`),
          pocket:
            kind === 'cash_withdrawal'
              ? `${fromPocket.label} → Cash`
              : `${fromPocket.label} → ${toPocket!.label}`,
          pocketId: fromPocket.id,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal mengubah data.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (
      !window.confirm(
        `Hapus "${payload?.activityTitle ?? 'item ini'}"? Tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (dataSource === 'api') {
        if (kind === 'cash_withdrawal') {
          await deleteMoneyCashWithdrawal(editingId);
        } else {
          await deleteMoneyTransfer(editingId);
        }
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
            : 'Gagal menghapus data.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MoneyModalShell
      title={title}
      subtitle={payload?.activityTitle ?? undefined}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <div className="w-28">
            <MoneySecondaryButton
              disabled={saving || loadingDetail}
              onClick={() => void handleDelete()}
            >
              Hapus
            </MoneySecondaryButton>
          </div>
          <div className="flex-1">
            <MoneyPrimaryButton
              disabled={saving || loadingDetail || !canSave}
              onClick={() => void handleSave()}
            >
              {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </MoneyPrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {loadingDetail ? (
          <p className="text-[12.5px] text-money-faint">Memuat detail…</p>
        ) : null}
        {error ? (
          <div className="rounded-[10px] border border-money-rose/30 bg-money-rose-soft px-3 py-2 text-[12.5px] font-semibold text-money-rose">
            {error}
          </div>
        ) : null}

        <div>
          <FieldLabel>Nominal</FieldLabel>
          <MoneyAmountInput value={digits} onChange={setDigits} />
        </div>
        <div>
          <FieldLabel>Tanggal</FieldLabel>
          <FieldInput type="date" value={dateIso} onChange={setDateIso} />
        </div>
        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldInput value={note} onChange={setNote} placeholder="Opsional" />
        </div>

        <div>
          <FieldLabel>
            {kind === 'cash_withdrawal' ? 'Dari kantong' : 'Kantong asal'}
          </FieldLabel>
          <FieldInput
            value={fromQuery}
            onChange={setFromQuery}
            placeholder="Cari kantong, person, atau rekening…"
          />
          <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
            {fromOptions.length === 0 ? (
              <p className="text-[12.5px] text-money-faint">
                Tidak ada kantong yang cocok.
              </p>
            ) : (
              fromOptions.map((p) => (
                <OptionCard
                  key={p.id}
                  active={(fromPocketId || fromOptions[0]?.id) === p.id}
                  title={p.label}
                  subtitle={formatIdr(p.balance)}
                  onClick={() => setFromPocketId(p.id)}
                />
              ))
            )}
          </div>
        </div>

        {kind === 'transfer' ? (
          <div>
            <FieldLabel>Kantong tujuan</FieldLabel>
            <FieldInput
              value={toQuery}
              onChange={setToQuery}
              placeholder="Cari kantong tujuan…"
            />
            <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto">
              {toOptions.length === 0 ? (
                <p className="text-[12.5px] text-money-faint">
                  Tidak ada kantong tujuan yang cocok.
                </p>
              ) : (
                toOptions.map((p) => (
                  <OptionCard
                    key={p.id}
                    active={(toPocketId || toOptions[0]?.id) === p.id}
                    title={p.label}
                    subtitle={formatIdr(p.balance)}
                    onClick={() => setToPocketId(p.id)}
                  />
                ))
              )}
            </div>
            {fromPocket && toPocket ? (
              <p className="mt-2 text-[12px] font-semibold text-money-faint">
                {transferKind === 'interpersonal'
                  ? `Transfer antar person (${fromPocket.personName} → ${toPocket.personName})`
                  : 'Pindah antar kantong'}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[10px] border border-money-border bg-money-soft px-3 py-2.5 text-[12.5px] text-money-muted">
            Tujuan otomatis: <b className="text-money-ink">Cash</b> milik owner
            kantong sumber
            {fromPocket ? ` (${fromPocket.personName})` : ''}.
          </div>
        )}
      </div>
    </MoneyModalShell>
  );
}
