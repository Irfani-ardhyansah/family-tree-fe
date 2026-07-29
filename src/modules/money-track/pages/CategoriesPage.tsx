import { useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'react-feather';
import { DataSourceBanner } from '@/modules/money-track/components/DataSourceBanner';
import {
  FieldInput,
  FieldLabel,
} from '@/modules/money-track/components/modals/MoneyFormFields';
import {
  FilterChip,
  MoneyCard,
  PageHeader,
} from '@/modules/money-track/components/PageChrome';
import { useMoneyTrackUi } from '@/modules/money-track/context/MoneyTrackUiContext';
import type { MoneyUiCategory } from '@/modules/money-track/api/moneyApi';

type TypeFilter = 'expense' | 'income';

type Draft = {
  id?: string;
  name: string;
  icon: string;
  type: TypeFilter;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  icon: '',
  type: 'expense',
};

export function CategoriesPage() {
  const {
    categories,
    createCategory,
    updateCategory,
    removeCategory,
    dataSource,
  } = useMoneyTrackUi();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('expense');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      categories
        .filter((c) => c.type === typeFilter)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, typeFilter],
  );

  const openCreate = () => {
    setError(null);
    setDraft({ ...EMPTY_DRAFT, type: typeFilter });
  };

  const openEdit = (row: MoneyUiCategory) => {
    setError(null);
    setDraft({
      id: row.id,
      name: row.name,
      icon: row.icon ?? '',
      type: row.type,
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (draft.id) {
        await updateCategory(draft.id, {
          name,
          icon: draft.icon.trim() || null,
        });
      } else {
        await createCategory({
          name,
          type: draft.type,
          icon: draft.icon.trim() || null,
        });
      }
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: MoneyUiCategory) => {
    if (row.isSystem) return;
    const ok = window.confirm(`Hapus kategori "${row.name}"?`);
    if (!ok) return;
    setError(null);
    try {
      await removeCategory(row.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kategori.');
    }
  };

  return (
    <div>
      <DataSourceBanner />
      <PageHeader
        title="Kategori"
        description="Kelola kategori pemasukan & pengeluaran untuk transaksi."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-money-brown px-3.5 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep"
          >
            <Plus size={15} />
            Tambah Kategori
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['expense', 'Pengeluaran'],
            ['income', 'Pemasukan'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            active={typeFilter === value}
            onClick={() => setTypeFilter(value)}
          />
        ))}
      </div>

      {error ? (
        <div className="mb-4 rounded-[12px] border border-money-rose/30 bg-money-rose-soft px-4 py-3 text-[13px] font-semibold text-money-rose">
          {error}
        </div>
      ) : null}

      {draft ? (
        <MoneyCard className="mb-4 p-5">
          <div className="mb-3 text-[14px] font-bold text-money-ink">
            {draft.id ? 'Edit kategori' : 'Kategori baru'}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
            <div>
              <FieldLabel>Nama</FieldLabel>
              <FieldInput
                value={draft.name}
                onChange={(name) => setDraft((d) => (d ? { ...d, name } : d))}
                placeholder="mis. Makan"
              />
            </div>
            <div>
              <FieldLabel>Icon (opsional)</FieldLabel>
              <FieldInput
                value={draft.icon}
                onChange={(icon) => setDraft((d) => (d ? { ...d, icon } : d))}
                placeholder="🍜"
              />
            </div>
          </div>
          {!draft.id ? (
            <div className="mt-3">
              <FieldLabel>Tipe</FieldLabel>
              <div className="flex gap-2">
                {(
                  [
                    ['expense', 'Pengeluaran'],
                    ['income', 'Pemasukan'],
                  ] as const
                ).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    label={label}
                    active={draft.type === value}
                    onClick={() =>
                      setDraft((d) => (d ? { ...d, type: value } : d))
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="rounded-full bg-money-brown px-4 py-2 text-[13px] font-bold text-white hover:bg-money-brown-deep disabled:opacity-60"
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setDraft(null)}
              className="rounded-full border border-money-border bg-money-surface px-4 py-2 text-[13px] font-bold text-money-muted hover:bg-money-soft"
            >
              Batal
            </button>
          </div>
        </MoneyCard>
      ) : null}

      <MoneyCard className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13.5px] text-money-faint">
            Belum ada kategori {typeFilter === 'expense' ? 'pengeluaran' : 'pemasukan'}.
            {dataSource === 'api' ? ' Tambah atau sync dari API.' : ''}
          </div>
        ) : (
          <ul className="divide-y divide-money-border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-money-soft text-lg">
                  {row.icon || '🏷️'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-money-ink">
                      {row.name}
                    </span>
                    {row.isSystem ? (
                      <span className="rounded-full bg-money-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-money-muted">
                        Sistem
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(row)}
                    className="rounded-lg p-2 text-money-muted hover:bg-money-soft hover:text-money-ink"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    title={
                      row.isSystem
                        ? 'Kategori sistem tidak bisa dihapus'
                        : 'Hapus'
                    }
                    disabled={row.isSystem}
                    onClick={() => void handleDelete(row)}
                    className="rounded-lg p-2 text-money-muted hover:bg-money-rose-soft hover:text-money-rose disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </MoneyCard>
    </div>
  );
}
