import type { ReactNode } from 'react';
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <SuiteFieldInput
      accent="core"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
    />
  );
}

export function FieldSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <SuiteFieldSelect
      accent="core"
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
      accent="core"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-suite-border bg-suite-soft px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-suite-ink">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[12px] text-suite-faint">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-sky-600' : 'bg-suite-border',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
