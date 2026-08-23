import type { ReactNode } from 'react';
import { X } from 'react-feather';
import { ACCENT, type SuiteAccent } from '@/shared/ui/accent';
import { cx } from '@/shared/ui/cx';

type ModalShellProps = {
  accent: SuiteAccent;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  step?: number;
  stepTotal?: number;
  titleId?: string;
};

export function ModalShell({
  accent,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  step,
  stepTotal,
  titleId = 'suite-modal-title',
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(20,24,15,0.45)]"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div
        className={cx(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-sheet bg-suite-surface shadow-xl sm:rounded-card',
          wide ? 'sm:max-w-xl' : 'sm:max-w-md',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-suite-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id={titleId}
                className="text-[15px] font-extrabold text-suite-ink"
              >
                {title}
              </h2>
              {step != null && stepTotal != null ? (
                <div className="flex gap-1">
                  {Array.from({ length: stepTotal }, (_, i) => (
                    <i
                      key={i}
                      className={cx(
                        'block h-1.5 rounded-full',
                        i + 1 === step
                          ? `w-3 ${ACCENT[accent].stepActive}`
                          : i + 1 < step
                            ? `w-1.5 ${ACCENT[accent].stepDone}`
                            : 'w-1.5 bg-suite-border',
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] text-suite-faint">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-suite-faint hover:bg-suite-soft"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-suite-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
