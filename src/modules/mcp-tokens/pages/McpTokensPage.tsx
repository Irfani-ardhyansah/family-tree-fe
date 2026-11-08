import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Copy,
  Key,
  Plus,
  Shield,
  Trash2,
} from 'react-feather';
import {
  createMyMcpToken,
  listMyMcpTokens,
  revokeMyMcpToken,
} from '@/shared/lib/mcpTokenApi';
import {
  ApiClientError,
  getModuleUnlockToken,
} from '@/shared/lib/apiClient';
import { useSecondaryPasswordGate } from '@/shared/context/SecondaryPasswordGateContext';
import {
  MCP_OPTIONAL_MODULES,
  type CreateMcpTokenResponse,
  type McpOptionalModule,
  type McpTokenItem,
  type McpUnlockModule,
} from '@/shared/types/mcpToken';
import { EmptyState, ErrorState, LoadingState, ModalShell, PageHeader } from '@/shared/ui';

const MAX_ACTIVE_TOKENS = 5;

const MODULE_LABEL: Record<McpUnlockModule, string> = {
  money: 'Money Track',
  core: 'Family Core',
  household: 'Household',
};

/** Modul default yang otomatis aktif dan tidak punya checkbox. */
const MCP_DEFAULT_LABELS = ['Family Roots', 'Task Board', 'Money Track'];

function McpAccessList() {
  return (
    <div className="rounded-control border border-suite-border bg-suite-soft/70 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-suite-faint">
        Akses default
      </p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-suite-muted">
        Token MCP otomatis bisa mengakses <strong>Family Roots</strong>,{' '}
        <strong>Task Board</strong>, dan <strong>Money Track</strong> sesuai hak
        akun. Ketiganya tidak punya checkbox.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MCP_DEFAULT_LABELS.map((label) => (
          <span
            key={label}
            className="inline-flex rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
          >
            {label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-suite-faint">
        Family Core dan Household opsional lewat checkbox di bawah. Modul
        opsional butuh verifikasi password kedua saat token dibuat.
      </p>
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Terjadi kesalahan. Coba lagi.';
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback di bawah
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

function UnlockBadges({ unlocks }: { unlocks: McpUnlockModule[] }) {
  if (unlocks.length === 0) {
    return (
      <span className="inline-flex rounded-full bg-suite-soft px-2.5 py-1 text-[11px] font-semibold text-suite-muted">
        Tanpa modul opsional
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {unlocks.map((moduleId) => (
        <span
          key={moduleId}
          className="inline-flex rounded-full bg-emerald-500/12 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
        >
          {MODULE_LABEL[moduleId]}
        </span>
      ))}
    </div>
  );
}

function TokenCard({
  item,
  onRevoke,
}: {
  item: McpTokenItem;
  onRevoke: (item: McpTokenItem) => void;
}) {
  return (
    <div className="rounded-[20px] border border-suite-border/80 bg-suite-surface/90 p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-bold tracking-tight text-suite-ink">
              {item.label}
            </h2>
            {item.isActive ? (
              <span className="inline-flex rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Aktif
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-suite-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-suite-muted">
                Dicabut
              </span>
            )}
          </div>
          <p className="mt-1.5 break-all font-mono text-[12.5px] text-suite-muted">
            {item.tokenHint}
          </p>
        </div>

        {item.isActive ? (
          <button
            type="button"
            onClick={() => onRevoke(item)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12.5px] font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
          >
            <Trash2 size={14} />
            Hapus
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <UnlockBadges unlocks={item.unlocks} />
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 border-t border-suite-border/70 pt-3 text-[12px] sm:grid-cols-3">
        <div>
          <dt className="font-semibold uppercase tracking-wide text-suite-faint">
            Dibuat
          </dt>
          <dd className="text-suite-muted">{formatDateTime(item.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-suite-faint">
            Terakhir dipakai
          </dt>
          <dd className="text-suite-muted">{formatDateTime(item.lastUsedAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wide text-suite-faint">
            Dicabut
          </dt>
          <dd className="text-suite-muted">{formatDateTime(item.revokedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

function CreateTokenModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { ensureUnlocked } = useSecondaryPasswordGate();
  const [label, setLabel] = useState('Nouride');
  const [modules, setModules] = useState<McpOptionalModule[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreateMcpTokenResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleModule = (moduleId: McpOptionalModule) => {
    setModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const handleCreate = async () => {
    setError('');
    setBusy(true);
    try {
      let unlockToken: string | null = null;

      // Money Track otomatis; password kedua hanya perlu kalau memilih modul
      // opsional (Family Core / Household).
      if (modules.length > 0) {
        const unlocked = await ensureUnlocked();
        if (!unlocked) {
          setError(
            'Verifikasi password kedua diperlukan untuk memberi akses modul opsional. Token belum dibuat.',
          );
          return;
        }
        unlockToken = getModuleUnlockToken();
        if (!unlockToken) {
          throw new Error(
            'Unlock password kedua tidak tersedia. Coba verifikasi ulang.',
          );
        }
      }

      const result = await createMyMcpToken(
        { label: label.trim() || 'Nouride', modules },
        unlockToken,
      );
      setCreated(result);
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    const ok = await copyToClipboard(created.token);
    setCopied(ok);
    if (ok) {
      globalThis.setTimeout(() => setCopied(false), 2500);
    }
  };

  const isResult = created != null;

  return (
    <ModalShell
      accent="roots"
      title={isResult ? 'Token berhasil dibuat' : 'Buat token MCP'}
      subtitle={
        isResult
          ? 'Simpan token ini sekarang. Server tidak bisa menampilkannya lagi.'
          : 'Token dipakai agent Nouride atau MCP client lain untuk mengakses FamilyRoots atas namamu.'
      }
      onClose={onClose}
      dismissOnBackdrop={!isResult}
      closeDisabled={isResult || busy}
      footer={
        isResult ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-control bg-primary-500 px-4 py-3 text-[13px] font-extrabold text-white shadow-[0_8px_16px_-6px_rgba(106,168,106,0.45)] transition hover:bg-primary-600"
          >
            Selesai
          </button>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-control px-4 py-2.5 text-sm font-semibold text-suite-muted transition hover:bg-suite-soft disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreate()}
              className="inline-flex items-center justify-center gap-2 rounded-control bg-primary-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              Buat token
            </button>
          </div>
        )
      }
    >
      {isResult && created ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-suite-border bg-suite-soft/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-suite-faint">
              Token MCP · {created.item.label}
            </p>
            <p className="mt-2 break-all select-all font-mono text-[13px] font-semibold text-suite-ink">
              {created.token}
            </p>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-control border border-suite-border bg-suite-surface px-4 py-2.5 text-sm font-semibold text-suite-ink transition hover:bg-suite-soft"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Tersalin' : 'Salin token'}
            </button>
          </div>

          <div className="flex gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-[12.5px] leading-relaxed text-amber-800 dark:text-amber-200">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            <p>
              Token ini hanya ditampilkan sekali. Simpan di tempat aman. Kalau
              hilang, hapus token lama lalu buat yang baru.
            </p>
          </div>

          <p className="text-[12px] leading-relaxed text-suite-muted">
            Token ini otomatis bisa mengakses <strong>Family Roots</strong>,{' '}
            <strong>Task Board</strong>, dan <strong>Money Track</strong> sesuai
            hak akun. Modul opsional yang diizinkan:
          </p>

          <UnlockBadges
            unlocks={created.item.unlocks.filter(
              (moduleId) => moduleId !== 'money',
            )}
          />

          <p className="text-[12px] leading-relaxed text-suite-muted">
            Tempel token ini di Nouride → <strong>Connectors</strong> →{' '}
            <strong>FamilyRoots</strong>, lalu simpan sebagai credential agent.
            Panduan lengkap ada di bawah daftar token.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-suite-faint">
              Label
            </span>
            <input
              type="text"
              value={label}
              maxLength={60}
              placeholder="Contoh: Nouride - Discord, Nouride - Telegram, Laptop"
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-control border border-suite-border bg-suite-soft px-3 py-2.5 text-[13.5px] font-semibold text-suite-ink outline-none transition placeholder:font-medium placeholder:text-suite-faint focus:border-primary-500 focus:bg-suite-surface"
            />
            <span className="mt-1 block text-[11.5px] leading-relaxed text-suite-faint">
              Maksimal 60 karakter. Default: Nouride. Satu token untuk satu agent
              Nouride. Kalau kamu punya beberapa agent atau device, buat token
              terpisah untuk masing-masing.
            </span>
          </label>

          <McpAccessList />

          <fieldset>
            <legend className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-suite-faint">
              Modul opsional{' '}
              <span className="font-medium normal-case">(opsional)</span>
            </legend>
            <p className="mb-2.5 text-[12px] leading-relaxed text-suite-muted">
              Centang hanya kalau agent perlu akses modul ini. Token tanpa
              centang tidak bisa mengakses modul tersebut.
            </p>
            <div className="space-y-2">
              {MCP_OPTIONAL_MODULES.map((moduleId) => {
                const checked = modules.includes(moduleId);
                return (
                  <label
                    key={moduleId}
                    className={`flex cursor-pointer items-center gap-3 rounded-control border px-3 py-2.5 transition ${
                      checked
                        ? 'border-primary-500/40 bg-primary-500/10'
                        : 'border-suite-border bg-suite-soft hover:bg-suite-surface'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(moduleId)}
                      className="h-4 w-4 rounded border-suite-border text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-[13px] font-semibold text-suite-ink">
                      {MODULE_LABEL[moduleId]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {modules.length > 0 ? (
            <div className="flex gap-2.5 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-3.5 text-[12.5px] leading-relaxed text-sky-800 dark:text-sky-200">
              <Shield size={17} className="mt-0.5 shrink-0" />
              <p>
                Kamu akan diminta password kedua. Setelah terverifikasi, token
                boleh mengakses modul opsional yang dipilih tanpa unlock ulang.
              </p>
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
            >
              {error}
            </p>
          ) : null}
        </div>
      )}
    </ModalShell>
  );
}

function RevokeTokenModal({
  item,
  onClose,
  onRevoked,
}: {
  item: McpTokenItem;
  onClose: () => void;
  onRevoked: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRevoke = async () => {
    setError('');
    setBusy(true);
    try {
      await revokeMyMcpToken(item.id);
      onRevoked();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      accent="roots"
      title="Hapus token MCP?"
      onClose={onClose}
      closeDisabled={busy}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-control px-4 py-2.5 text-sm font-semibold text-suite-muted transition hover:bg-suite-soft disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleRevoke()}
            className="rounded-control bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Menghapus…' : 'Hapus token'}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-suite-muted">
        Hapus token <span className="font-semibold text-suite-ink">{item.label}</span>
        ? Agent Nouride yang memakai token ini akan langsung kehilangan akses.
        Buat token baru lalu ganti di Nouride.
      </p>
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}
    </ModalShell>
  );
}

function NourideGuide() {
  return (
    <section className="mt-5 rounded-[20px] border border-suite-border/80 bg-suite-surface/80 p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/12 text-primary-600 dark:text-primary-400">
          <BookOpen size={17} />
        </span>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-suite-ink">
            Cara menghubungkan ke Nouride
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-suite-muted">
            Nouride adalah agent yang memakai token ini. Satu agent Nouride
            memakai satu token FamilyRoots. Token otomatis bisa mengakses Family
            Roots, Task Board, dan Money Track sesuai hak akun.
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-2.5">
        {[
          'Buat token dengan label "Nouride - <nama agent>".',
          'Salin token dari modal — token hanya muncul sekali.',
          'Di Nouride, buka agent tersebut → Connectors → FamilyRoots, lalu isi token sebagai credential.',
          'Simpan token di secret store/credential agent. Jangan menaruh token mentah di file config yang di-commit.',
          'Kalau token dicabut atau hilang, agent akan gagal dengan MCP_TOKEN_INVALID. Buat token baru lalu ganti credential di Nouride.',
        ].map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-suite-soft text-[11px] font-bold text-suite-muted">
              {index + 1}
            </span>
            <p className="pt-0.5 text-[12.5px] leading-relaxed text-suite-muted">
              {step}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-4 rounded-control border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
        Money Track otomatis bersifat trusted untuk semua token MCP: agent bisa
        membaca dan menulis data money tanpa unlock ulang. Karena itu perlakukan
        token seperti password.
      </p>
    </section>
  );
}

export function McpTokensPage() {
  const [items, setItems] = useState<McpTokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<McpTokenItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listMyMcpTokens();
      setItems(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Token MCP"
        description="Token ini dipakai agent Nouride atau MCP client lain untuk mengakses data FamilyRoots atas nama kamu. Perlakukan seperti password."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={activeCount >= MAX_ACTIVE_TOKENS}
            className="inline-flex items-center gap-2 rounded-control bg-primary-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_16px_-6px_rgba(106,168,106,0.45)] transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              activeCount >= MAX_ACTIVE_TOKENS
                ? `Maksimal ${MAX_ACTIVE_TOKENS} token aktif`
                : undefined
            }
          >
            <Plus size={15} />
            Buat token
          </button>
        }
      />

      <div className="mb-5 flex gap-2.5 rounded-[20px] border border-suite-border/80 bg-suite-surface/80 p-4 text-[12.5px] leading-relaxed text-suite-muted shadow-card">
        <Key size={17} className="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400" />
        <div>
          <p className="font-semibold text-suite-ink">
            {activeCount}/{MAX_ACTIVE_TOKENS} token aktif
          </p>
          <p className="mt-0.5">
            Satu token untuk satu agent Nouride. Kalau kamu punya beberapa agent
            atau device, buat token terpisah untuk masing-masing. Token asli
            hanya muncul sekali saat dibuat — server hanya menyimpan hash-nya.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Memuat token MCP…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada token MCP"
          description="Buat token kalau kamu ingin menghubungkan agent Nouride ke FamilyRoots."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-control bg-primary-500 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-primary-600"
            >
              <Plus size={15} />
              Buat token pertama
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <TokenCard
              key={item.id}
              item={item}
              onRevoke={setRevokeTarget}
            />
          ))}
        </div>
      )}

      <NourideGuide />

      {createOpen ? (
        <CreateTokenModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => void load()}
        />
      ) : null}

      {revokeTarget ? (
        <RevokeTokenModal
          item={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onRevoked={() => void load()}
        />
      ) : null}
    </div>
  );
}
