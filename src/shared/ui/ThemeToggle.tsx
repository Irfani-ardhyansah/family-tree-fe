import { Moon, Sun } from 'react-feather';
import { useTheme } from '@/shared/context/ThemeContext';
import { cx } from '@/shared/ui/cx';

type ThemeToggleProps = {
  className?: string;
  tone?: 'default' | 'inverse';
};

export function ThemeToggle({
  className,
  tone = 'default',
}: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? 'Mode siang' : 'Mode malam'}
      aria-label={isDark ? 'Aktifkan mode siang' : 'Aktifkan mode malam'}
      className={cx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control transition-colors',
        tone === 'inverse'
          ? 'text-admin-rail-muted hover:bg-admin-rail-soft hover:text-admin-rail-ink'
          : 'text-suite-muted hover:bg-suite-soft hover:text-suite-ink',
        className,
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
