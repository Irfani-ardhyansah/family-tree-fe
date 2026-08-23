import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ACCENT, type SuiteAccent } from '@/shared/ui/accent';
import { cx } from '@/shared/ui/cx';

type SharedButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  form?: string;
};

const BASE =
  'w-full rounded-control px-4 py-3 text-[13px] disabled:cursor-not-allowed disabled:opacity-45';

export function PrimaryButton({
  accent,
  children,
  onClick,
  disabled,
  className,
  type = 'button',
  form,
}: SharedButtonProps & { accent: SuiteAccent }) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className={cx(BASE, 'font-extrabold text-white', ACCENT[accent].primary, className)}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
  type = 'button',
}: SharedButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        BASE,
        'border border-suite-border bg-suite-surface font-bold text-suite-muted hover:bg-suite-soft',
        className,
      )}
    >
      {children}
    </button>
  );
}
