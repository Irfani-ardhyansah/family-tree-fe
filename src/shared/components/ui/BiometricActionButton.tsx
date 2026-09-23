import { ArrowRight } from 'react-feather';
import { FingerprintMark } from '@/shared/components/ui/FingerprintMark';

type BiometricActionButtonProps = {
  title: string;
  hint: string;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function BiometricActionButton({
  title,
  hint,
  busy = false,
  disabled = false,
  onClick,
}: BiometricActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-suite-border/80 bg-suite-surface px-3 py-3 text-left shadow-sm transition hover:border-primary-400/50 hover:bg-primary-500/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/12 text-primary-700 dark:text-primary-300">
        <FingerprintMark />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-suite-ink">
          {busy ? 'Menunggu konfirmasi perangkat…' : title}
        </span>
        {!busy && (
          <span className="mt-0.5 block text-xs leading-relaxed text-suite-muted">
            {hint}
          </span>
        )}
      </span>
      {!busy && (
        <ArrowRight
          size={14}
          className="shrink-0 text-primary-700 transition-transform group-hover:translate-x-0.5 dark:text-primary-300"
        />
      )}
    </button>
  );
}
