import { Outlet, Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Grid, LogOut, Plus } from 'react-feather';
import { useAuth } from '@/shared/context/AuthContext';
import { appPaths, taskBoardPaths } from '@/shared/routes';
import { Footer } from '@/shared/components/ui/Footer';
import { ThemeToggle } from '@/shared/ui';
import { shortPersonName } from '@/shared/utils/personDisplayName';

function TaskBoardChrome() {
  const navigate = useNavigate();
  const { logout, person } = useAuth();

  const loginName = person ? shortPersonName(person, person.fullName) : null;

  return (
    <div
      data-module="task-board"
      className="flex min-h-screen flex-col bg-suite-bg text-suite-ink"
    >
      <header className="sticky top-0 z-40 border-b border-suite-border bg-suite-surface/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-6">
          <Link
            to={appPaths.launcher}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
            title="Semua modul"
            aria-label="Semua modul"
          >
            <Grid size={16} />
          </Link>

          <Link
            to={taskBoardPaths.home}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-1 py-1 transition-colors hover:bg-suite-soft"
            title="Ke daftar Task Board"
            aria-label="Ke daftar Task Board"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-amber-500 text-white shadow-[0_6px_14px_-6px_rgba(245,158,11,0.6)]">
              <CheckSquare size={17} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-bold tracking-tight text-suite-ink">
                Task Board
              </div>
              <div className="hidden truncate text-[11.5px] text-suite-faint sm:block">
                Kelola task per tempat kerja
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => navigate(taskBoardPaths.new)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-3 text-[12.5px] font-bold leading-none text-white transition-colors hover:bg-amber-600 sm:px-3.5"
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
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control px-2.5 text-[12.5px] font-medium leading-none text-suite-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
            >
              <LogOut size={15} className="shrink-0" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-3 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <Footer moduleName="Task Board" />
    </div>
  );
}

export function TaskBoardLayout() {
  return <TaskBoardChrome />;
}
