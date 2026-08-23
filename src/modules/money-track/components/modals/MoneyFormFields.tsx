import type { HTMLAttributes, ReactNode } from 'react';
import {
  formatInputIdr,
  sanitizeIdrDigits,
} from '@/modules/money-track/components/modals/modalTypes';
import {
  FieldInput as SuiteFieldInput,
  FieldLabel as SuiteFieldLabel,
  FieldSelect as SuiteFieldSelect,
  FieldTextarea as SuiteFieldTextarea,
  cx,
} from '@/shared/ui';

export function FieldLabel({ children }: { children: ReactNode }) {
  return <SuiteFieldLabel>{children}</SuiteFieldLabel>;
}

export function FieldInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <SuiteFieldInput
      accent="money"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
    />
  );
}

/**
 * Money input: displays id-ID thousand separators, stores digit-only in `value`/`onChange`.
 */
export function MoneyAmountInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
}: {
  /** Digit-only string, e.g. "200000" — never include separators in state. */
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <SuiteFieldInput
      accent="money"
      type="text"
      inputMode="numeric"
      value={formatInputIdr(value)}
      placeholder={placeholder}
      onChange={(next) => onChange(sanitizeIdrDigits(next))}
      className={cx('font-money-mono placeholder:font-sans', className)}
    />
  );
}

export function FieldSelect<T extends string = string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <SuiteFieldSelect
      accent="money"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

export function FieldTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <SuiteFieldTextarea
      accent="money"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
}
