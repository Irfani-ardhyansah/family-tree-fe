import type { HTMLAttributes, ReactNode } from 'react';
import {
  formatInputIdr,
  sanitizeIdrDigits,
} from '@/modules/money-track/components/modals/modalTypes';

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-money-faint">
      {children}
    </label>
  );
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
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[10px] border border-money-border bg-money-soft px-3 py-2.5 text-[13.5px] font-semibold text-money-ink outline-none placeholder:font-medium placeholder:text-money-faint focus:border-money-brown focus:bg-money-surface"
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
    <input
      type="text"
      inputMode="numeric"
      value={formatInputIdr(value)}
      placeholder={placeholder}
      onChange={(e) => onChange(sanitizeIdrDigits(e.target.value))}
      className={[
        'font-money-mono w-full rounded-[10px] border border-money-border bg-money-soft px-3 py-2.5 text-[13.5px] font-semibold text-money-ink outline-none placeholder:font-medium placeholder:font-sans placeholder:text-money-faint focus:border-money-brown focus:bg-money-surface',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-[10px] border border-money-border bg-money-soft px-3 py-2.5 text-[13.5px] font-semibold text-money-ink outline-none focus:border-money-brown focus:bg-money-surface"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none rounded-[10px] border border-money-border bg-money-soft px-3 py-2.5 text-[13.5px] font-semibold text-money-ink outline-none placeholder:font-medium placeholder:text-money-faint focus:border-money-brown focus:bg-money-surface"
    />
  );
}
