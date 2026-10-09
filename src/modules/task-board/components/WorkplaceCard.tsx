import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Archive,
  Calendar,
  Edit,
  MapPin,
  MoreVertical,
  RotateCcw,
  Trash2,
} from 'react-feather';
import type { Workplace } from '../types';
import { TASK_STATUS_META } from '../lib/taskMeta';
import {
  EMPLOYMENT_META,
  formatMonthYear,
  formatTenure,
  workplaceAccent,
  workplaceInitials,
  type WorkplaceTaskStats,
} from '../lib/workplaceMeta';
import { taskBoardPaths } from '@/shared/routes';
import { cx } from '@/shared/ui';

export function WorkplaceCard({
  workplace,
  stats,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  workplace: Workplace;
  stats: WorkplaceTaskStats;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}) {
  const accent = workplaceAccent(workplace.accent);
  const employment = EMPLOYMENT_META[workplace.employment_type];
  const progress =
    stats.total > 0 ? Math.round((stats.merged / stats.total) * 100) : 0;
  const tenure = formatTenure(workplace.started_at, workplace.ended_at);
  const archived = Boolean(workplace.archived_at);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  const runMenuAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <div
      className={cx(
        'suite-card group relative flex flex-col overflow-hidden transition-all duration-200',
        archived
          ? 'opacity-90'
          : 'hover:-translate-y-0.5 hover:shadow-lg',
        accent.hoverBorder,
      )}
    >
      {/* Link overlay: seluruh kartu bisa diklik untuk buka, tanpa membungkus
          tombol menu (menghindari button di dalam anchor). */}
      <Link
        to={taskBoardPaths.workplace(workplace.id)}
        className="absolute inset-0 z-0"
        aria-label={`Buka task ${workplace.name}`}
      />

      <span
        className={cx(
          'pointer-events-none absolute inset-x-0 top-0 z-10 h-1',
          archived ? 'bg-suite-border' : accent.bar,
        )}
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <div className="flex items-start gap-3 px-5 pb-3 pt-5">
          <span
            className={cx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-[15px] font-black tracking-tight',
              accent.avatar,
            )}
            aria-hidden
          >
            {workplaceInitials(workplace.name)}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="truncate pr-7 text-[15px] font-bold text-suite-ink transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
              {workplace.name}
            </h3>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold',
                  employment.chipClass,
                )}
              >
                <span
                  className={cx('h-1.5 w-1.5 rounded-full', employment.dotClass)}
                />
                {employment.label}
              </span>
              {workplace.role ? (
                <span className="truncate text-[11.5px] font-semibold text-suite-muted">
                  {workplace.role}
                </span>
              ) : null}
              {archived ? (
                <span className="shrink-0 rounded-full bg-suite-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-suite-faint">
                  Diarsipkan
                </span>
              ) : workplace.is_default ? (
                <span
                  className="shrink-0 rounded-full bg-suite-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-suite-faint"
                  title="Task lama tanpa tempat kerja dipetakan ke sini"
                >
                  Default
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 pb-4 text-[11.5px] text-suite-faint">
          {workplace.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0" />
              {workplace.location}
            </span>
          ) : null}
          {workplace.started_at ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} className="shrink-0" />
              Sejak {formatMonthYear(workplace.started_at)}
              {tenure ? ` · ${tenure}` : ''}
            </span>
          ) : null}
        </div>

        <div className="mt-auto border-t border-suite-border px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-money-mono text-[24px] font-bold leading-none text-suite-ink">
                {stats.total}
              </div>
              <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-suite-faint">
                Task
              </div>
            </div>

            {stats.total > 0 ? (
              <div className="flex items-center gap-3">
                <Legend
                  color={TASK_STATUS_META['To-Do'].dotClass}
                  value={stats.todo}
                  label="To-Do"
                />
                <Legend
                  color={TASK_STATUS_META['In Progress'].dotClass}
                  value={stats.inProgress}
                  label="In Progress"
                />
                <Legend
                  color={TASK_STATUS_META.Merged.dotClass}
                  value={stats.merged}
                  label="Merged"
                />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-suite-faint transition-colors group-hover:text-suite-muted">
                Belum ada task
                <ArrowRight size={12} />
              </span>
            )}
          </div>

          {stats.total > 0 ? (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-suite-soft">
                <div
                  className={cx('h-full rounded-full transition-all', accent.bar)}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-suite-faint">
                <span>{stats.merged} selesai</span>
                <span className="font-money-mono">{progress}%</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Menu aksi — sibling dari Link overlay supaya tidak nested. */}
      <div ref={menuRef} className="absolute right-3 top-3 z-20">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Menu tempat kerja"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={cx(
            'pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-control transition-colors hover:bg-suite-soft hover:text-suite-ink',
            menuOpen
              ? 'bg-suite-soft text-suite-ink'
              : 'text-suite-faint',
          )}
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-card border border-suite-border bg-suite-surface py-1 shadow-xl"
          >
            <MenuItem
              icon={<Edit size={14} />}
              label="Edit"
              onClick={() => runMenuAction(onEdit)}
            />
            {archived ? (
              onRestore ? (
                <MenuItem
                  icon={<RotateCcw size={14} />}
                  label="Pulihkan"
                  onClick={() => runMenuAction(onRestore)}
                />
              ) : null
            ) : onArchive ? (
              <MenuItem
                icon={<Archive size={14} />}
                label="Arsipkan"
                onClick={() => runMenuAction(onArchive)}
              />
            ) : null}
            <MenuItem
              icon={<Trash2 size={14} />}
              label="Hapus"
              danger
              onClick={() => runMenuAction(onDelete)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-semibold transition-colors',
        danger
          ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-300'
          : 'text-suite-muted hover:bg-suite-soft hover:text-suite-ink',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Legend({
  color,
  value,
  label,
}: {
  color: string;
  value: number;
  label: string;
}) {
  return (
    <span className="flex flex-col items-center" title={label}>
      <span className="flex items-center gap-1 font-money-mono text-[12.5px] font-bold text-suite-ink">
        <span className={cx('h-1.5 w-1.5 rounded-full', color)} />
        {value}
      </span>
      <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-suite-faint">
        {label}
      </span>
    </span>
  );
}
