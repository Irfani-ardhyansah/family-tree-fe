import type { HTMLAttributes, ReactNode } from 'react';
import { ACCENT, type SuiteAccent } from '@/shared/ui/accent';
import { cx } from '@/shared/ui/cx';

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-suite-faint">
      {children}
    </label>
  );
}

function fieldClass(accent: SuiteAccent, extra?: string) {
  return cx(
    'w-full rounded-control border border-suite-border bg-suite-soft px-3 py-2.5 text-[13.5px] font-semibold text-suite-ink outline-none placeholder:font-medium placeholder:text-suite-faint focus:bg-suite-surface',
    ACCENT[accent].focus,
    extra,
  );
}

export function FieldInput({
  accent,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  className,
}: {
  accent: SuiteAccent;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  className?: string;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass(accent, className)}
    />
  );
}

export function FieldSelect<T extends string = string>({
  accent,
  value,
  onChange,
  options,
  className,
}: {
  accent: SuiteAccent;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={fieldClass(accent, className)}
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
  accent,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  accent: SuiteAccent;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass(accent, cx('resize-none', className))}
    />
  );
}
