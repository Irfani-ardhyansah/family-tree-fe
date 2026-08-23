import type { ReactNode } from 'react';
import { CheckCircle } from 'react-feather';
import { ModalShell, PrimaryButton, SecondaryButton } from '@/shared/ui';

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
    <ModalShell
      accent="core"
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={footer}
      wide={wide}
      titleId="core-modal-title"
    >
      {children}
    </ModalShell>
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
    <PrimaryButton
      accent="core"
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PrimaryButton>
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
    <SecondaryButton onClick={onClick} disabled={disabled}>
      {children}
    </SecondaryButton>
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
      <h3 className="mt-3 text-[16px] font-extrabold text-suite-ink">{title}</h3>
      {description ? (
        <p className="mt-1 text-[13px] text-suite-muted">{description}</p>
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
