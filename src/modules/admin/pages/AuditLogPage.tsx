import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  X,
} from 'react-feather';
import {
  fetchAuditLogDetail,
  fetchAuditLogs,
  fetchSelectableUsers,
  type AuditSortOrder,
} from '@/modules/admin/api/adminApi';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
} from '@/modules/admin/components/PageState';
import type { AuditAction, AuditLogEntry } from '@/modules/admin/types';
import { formatDateTime } from '@/modules/admin/utils/format';

/** Deretan tombol nomor halaman dengan elipsis di tengah (mis. 1 … 4 5 6 … 12). */
function buildPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push('…');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < total - 1) items.push('…');
  items.push(total);
  return items;
}

const ACTION_STYLES: Record<AuditAction, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-sky-50 text-sky-700',
  delete: 'bg-rose-50 text-rose-700',
  login: 'bg-ink-100 text-ink-700',
  logout: 'bg-ink-100 text-ink-600',
  toggle_module: 'bg-amber-50 text-amber-800',
  force_logout: 'bg-rose-50 text-rose-700',
  broadcast: 'bg-admin-50 text-admin-800',
  backup: 'bg-violet-50 text-violet-700',
  settings: 'bg-orange-50 text-orange-800',
};

const ACTIONS: AuditAction[] = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'toggle_module',
  'force_logout',
  'broadcast',
  'backup',
  'settings',
];

export function AuditLogPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [userId, setUserId] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<AuditSortOrder>('desc');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);
  const pageSize = 8;

  useEffect(() => {
    void fetchSelectableUsers().then(setUsers);
  }, []);

  // Filter daftar user secara lokal oleh input pencarian.
  const filteredUsers = useMemo(() => {
    const term = userQuery.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => u.name.toLowerCase().includes(term));
  }, [users, userQuery]);

  const openDetail = async (log: AuditLogEntry) => {
    setDetail(log);
    try {
      const full = await fetchAuditLogDetail(log.id);
      setDetail(full);
    } catch {
      // keep list row payload if detail endpoint fails
    }
  };

  const load = () => {
    setLoading(true);
    setError('');
    void fetchAuditLogs({
      q,
      userId: userId || undefined,
      moduleId: moduleId || undefined,
      action,
      from: from || undefined,
      to: to || undefined,
      sort,
      page,
      pageSize,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat audit log'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [q, userId, moduleId, action, from, to, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = buildPageItems(page, totalPages);

  const toggleSort = () =>
    setSort((current) => {
      setPage(1);
      return current === 'desc' ? 'asc' : 'desc';
    });

  return (
    <div>
      <AdminPageHeader
        title="Audit Log"
        description="Jejak aktivitas penting untuk transparansi dan keamanan data keluarga."
      />

      <div className="mb-4 grid gap-2 rounded-2xl border border-ink-200/80 bg-white/90 p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative lg:col-span-2">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Cari keyword…"
            className="w-full rounded-xl border-ink-200 py-2 pl-9 text-sm focus:border-admin-500 focus:ring-admin-500"
          />
        </label>
        <Combobox
          value={userId}
          onChange={(id: string | null) => {
            setPage(1);
            setUserId(id ?? '');
          }}
          onClose={() => setUserQuery('')}
        >
          <div className="relative">
            <ComboboxInput
              className="w-full rounded-xl border-ink-200 py-2 pl-3 pr-8 text-sm focus:border-admin-500 focus:ring-admin-500"
              displayValue={(id: string) =>
                id ? (users.find((u) => u.id === id)?.name ?? '') : 'Semua user'
              }
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Cari user…"
              aria-label="Filter user"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-ink-400">
              <ChevronDown size={16} />
            </span>
            {userId ? (
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setUserId('');
                  setUserQuery('');
                }}
                className="absolute inset-y-0 right-7 flex items-center text-ink-400 hover:text-ink-700"
                aria-label="Hapus filter user"
              >
                <X size={14} />
              </button>
            ) : null}
            <ComboboxOptions className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-ink-100 bg-white py-1 text-sm shadow-lg">
              <ComboboxOption
                value=""
                className="cursor-pointer px-3 py-2 font-medium text-ink-500 data-[focus]:bg-admin-50 data-[selected]:bg-admin-50"
              >
                Semua user
              </ComboboxOption>
              {filteredUsers.map((u) => (
                <ComboboxOption
                  key={u.id}
                  value={u.id}
                  className="cursor-pointer px-3 py-2 text-ink-700 data-[focus]:bg-admin-50 data-[selected]:bg-admin-50"
                >
                  {u.name}
                </ComboboxOption>
              ))}
              {filteredUsers.length === 0 ? (
                <div className="px-3 py-2 italic text-ink-400">
                  User tidak ditemukan
                </div>
              ) : null}
            </ComboboxOptions>
          </div>
        </Combobox>
        <select
          value={moduleId}
          onChange={(e) => {
            setPage(1);
            setModuleId(e.target.value);
          }}
          className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
        >
          <option value="">Semua modul</option>
          <option value="admin">Admin</option>
          <option value="auth">Auth</option>
          <option value="roots">Family Roots</option>
          <option value="core">Family Core</option>
          <option value="money">Money Track</option>
          <option value="household">Household</option>
          <option value="task-board">Task Board</option>
        </select>
        <select
          value={action}
          onChange={(e) => {
            setPage(1);
            setAction(e.target.value as AuditAction | '');
          }}
          className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
        >
          <option value="">Semua aksi</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <div
          className="flex rounded-xl border border-ink-200 p-0.5"
          role="group"
          aria-label="Urutan waktu"
        >
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSort('desc');
            }}
            aria-pressed={sort === 'desc'}
            className={`flex flex-1 items-center justify-center gap-1 rounded-[10px] px-2 py-1.5 text-xs font-semibold transition-colors ${
              sort === 'desc'
                ? 'bg-admin-50 text-admin-700'
                : 'text-ink-500 hover:bg-ink-50'
            }`}
          >
            <ArrowDown size={13} />
            Terbaru
          </button>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSort('asc');
            }}
            aria-pressed={sort === 'asc'}
            className={`flex flex-1 items-center justify-center gap-1 rounded-[10px] px-2 py-1.5 text-xs font-semibold transition-colors ${
              sort === 'asc'
                ? 'bg-admin-50 text-admin-700'
                : 'text-ink-500 hover:bg-ink-50'
            }`}
          >
            <ArrowUp size={13} />
            Terlama
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:col-span-6">
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setPage(1);
              setFrom(e.target.value);
            }}
            className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setPage(1);
              setTo(e.target.value);
            }}
            className="rounded-xl border-ink-200 text-sm focus:border-admin-500 focus:ring-admin-500"
          />
        </div>
      </div>

      {loading ? (
        <AdminLoading label="Memuat audit log…" />
      ) : error ? (
        <AdminError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <AdminEmpty
          title="Tidak ada log"
          description="Coba longgarkan filter atau rentang tanggal."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white/90 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-ink-50/80 text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={toggleSort}
                        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-700"
                        title="Ubah urutan waktu"
                      >
                        Waktu
                        {sort === 'desc' ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUp size={12} />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Modul</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                    <th className="px-4 py-3 font-semibold">Detail</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {items.map((log) => (
                    <tr key={log.id} className="hover:bg-admin-50/30">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {log.userName}
                      </td>
                      <td className="px-4 py-3 text-ink-500">{log.moduleId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            ACTION_STYLES[log.action] ?? 'bg-ink-100 text-ink-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-ink-600">
                        {log.summary}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(log)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-admin-700 hover:bg-admin-50"
                        >
                          <Eye size={14} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {total} entri · halaman {page}/{totalPages}
            </p>
            <nav
              className="flex flex-wrap items-center gap-1"
              aria-label="Navigasi halaman audit log"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-ink-200 font-semibold hover:bg-white disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              {pageItems.map((item, index) =>
                item === '…' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1.5 text-ink-400"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    aria-current={item === page ? 'page' : undefined}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-xl border px-2 font-semibold transition-colors ${
                      item === page
                        ? 'border-admin-500 bg-admin-50 text-admin-700'
                        : 'border-ink-200 hover:bg-white'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-ink-200 font-semibold hover:bg-white disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </>
      )}

      <Transition appear show={detail != null} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 font-admin"
          onClose={() => setDetail(null)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink-950/45" />
          </TransitionChild>
          <div className="fixed inset-0 flex justify-end">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-x-8 opacity-0"
              enterTo="translate-x-0 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0 opacity-100"
              leaveTo="translate-x-8 opacity-0"
            >
              <DialogPanel className="h-full w-full max-w-md overflow-y-auto border-l border-ink-200 bg-white p-5 shadow-2xl sm:p-6">
                {detail && (
                  <>
                    <DialogTitle className="font-admin-display text-xl font-bold text-ink-900">
                      Detail Audit
                    </DialogTitle>
                    <dl className="mt-5 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs font-semibold uppercase text-ink-400">
                          Waktu
                        </dt>
                        <dd className="mt-0.5 text-ink-800">
                          {formatDateTime(detail.timestamp)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase text-ink-400">
                          User
                        </dt>
                        <dd className="mt-0.5 text-ink-800">{detail.userName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase text-ink-400">
                          Ringkasan
                        </dt>
                        <dd className="mt-0.5 text-ink-800">{detail.summary}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase text-ink-400">
                          Before
                        </dt>
                        <pre className="overflow-x-auto rounded-xl bg-ink-950 p-3 text-xs text-admin-100">
                          {JSON.stringify(detail.before ?? null, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase text-ink-400">
                          After
                        </dt>
                        <pre className="overflow-x-auto rounded-xl bg-ink-950 p-3 text-xs text-admin-100">
                          {JSON.stringify(detail.after ?? null, null, 2)}
                        </pre>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => setDetail(null)}
                      className="mt-6 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Tutup
                    </button>
                  </>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
