import type { ReactNode } from 'react';
import { CheckCircle, X } from 'react-feather';

type CoreModalShellProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export function CoreModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: CoreModalShellProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(20,24,15,0.45)]"
        aria-label="Tutup"
        onClick={onClose}
      />
      <div
        className={[
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-white shadow-xl sm:rounded-2xl',
          wide ? 'sm:max-w-xl' : 'sm:max-w-md',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="core-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="core-modal-title"
              className="text-[15px] font-extrabold text-brand-800"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] text-brand-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-brand-400 hover:bg-gray-50"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-gray-200 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CorePrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  form,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  form?: string;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[11px] bg-sky-600 px-4 py-3 text-[13px] font-extrabold text-white shadow-[0_8px_16px_-6px_rgba(2,132,199,0.45)] hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function CoreSecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[11px] border border-gray-200 bg-white px-4 py-3 text-[13px] font-bold text-brand-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function CoreSuccessPanel({
  title,
  description,
  onAgain,
  onDone,
  againLabel = 'Tambah lagi',
  doneLabel = 'Selesai',
}: {
  title: string;
  description?: string;
  onAgain?: () => void;
  onDone: () => void;
  againLabel?: string;
  doneLabel?: string;
}) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle size={28} />
      </div>
      <h3 className="mt-3 text-[16px] font-extrabold text-brand-800">{title}</h3>
      {description ? (
        <p className="mt-1 text-[13px] text-brand-500">{description}</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-2">
        {onAgain ? (
          <CorePrimaryButton onClick={onAgain}>{againLabel}</CorePrimaryButton>
        ) : null}
        <CoreSecondaryButton onClick={onDone}>{doneLabel}</CoreSecondaryButton>
      </div>
    </div>
  );
}

export function CoreFormFooter({
  onCancel,
  submitLabel,
  cancelLabel = 'Batal',
  disabled,
  formId,
}: {
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
  disabled?: boolean;
  /** If set, submit button uses form attribute */
  formId?: string;
}) {
  return (
    <div className="flex gap-2">
      <CoreSecondaryButton onClick={onCancel}>{cancelLabel}</CoreSecondaryButton>
      <CorePrimaryButton type="submit" disabled={disabled} form={formId}>
        {submitLabel}
      </CorePrimaryButton>
    </div>
  );
}
