import type { HTMLAttributes, ReactNode } from 'react';

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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
