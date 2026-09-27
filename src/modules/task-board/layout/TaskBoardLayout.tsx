import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Grid, LogOut, Plus, X, CheckSquare } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths, taskBoardPaths } from '@/shared/routes';
import { Footer } from '@/shared/components/ui/Footer';
import { ThemeToggle } from '@/shared/ui';
import { shortPersonName } from '@/shared/utils/personDisplayName';

function TaskBoardChrome() {
  const navigate = useNavigate();
  const { logout, person } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const loginName = person
    ? shortPersonName(person, person.fullName)
    : null;

  const handleQuickAdd = () => {
    setQuickAddOpen(false);
    navigate(taskBoardPaths.new);
  };

  return (
    <div data-module="task-board" className="flex min-h-screen flex-col bg-suite-bg text-suite-ink">
      <header className="sticky top-0 z-40 border-b border-suite-border bg-suite-surface/90 shadow-[0_1px_0_rgba(180,83,9,0.06)] backdrop-blur-md dark:shadow-[0_1px_0_rgba(0,0,0,0.35)]">
        {/* Brand row */}
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-6 sm:py-3.5 lg:px-7">
          <Link
            to={appPaths.launcher}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-suite-muted transition-colors hover:bg-suite-soft hover:text-amber-600 dark:hover:text-amber-300"
            title="Semua modul"
            aria-label="Semua modul"
          >
            <Grid size={16} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-amber-500 to-amber-700 text-white sm:h-10 sm:w-10 sm:rounded-[12px]">
              <CheckSquare size={17} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-bold tracking-tight text-suite-ink">
                Task Board
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-amber-600 px-3 text-[12.5px] font-bold leading-none text-white hover:bg-amber-700 sm:px-3.5"
              aria-label="Buat task baru"
            >
              <Plus size={15} className="shrink-0" />
              <span className="hidden sm:inline">Task Baru</span>
            </button>

            <ThemeToggle />

            {loginName ? (
              <span className="hidden max-w-[7rem] truncate rounded-full bg-suite-soft px-2.5 py-1.5 text-[11.5px] font-semibold leading-none text-suite-muted lg:inline">
                {loginName}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[12.5px] font-medium leading-none text-suite-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
            >
              <LogOut size={15} className="shrink-0" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-3 py-5 sm:px-6 sm:py-7 lg:px-7">
        <Outlet />
      </main>

      <Footer moduleName="Task Board" />

      {quickAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(15,23,42,0.4)]"
            aria-label="Tutup"
            onClick={() => setQuickAddOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-sheet bg-suite-surface p-5 shadow-xl sm:rounded-card sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-suite-ink">
                  Buat Task Baru
                </h2>
                <p className="text-[12px] text-suite-faint">
                  Mulai tracking task development
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="rounded-full p-1.5 text-suite-faint hover:bg-suite-soft"
              >
                <X size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="flex w-full items-center gap-3 rounded-control bg-amber-50/80 px-2.5 py-2.5 text-left transition-colors hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-amber-600 text-white">
                <Plus size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold text-suite-ink">
                  Task Baru
                </span>
                <span className="block text-[11.5px] text-suite-faint">
                  Bugfixing, Feature, atau Refactor
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TaskBoardLayout() {
  return <TaskBoardChrome />;
}
