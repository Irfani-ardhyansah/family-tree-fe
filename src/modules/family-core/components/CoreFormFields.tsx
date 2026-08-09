import type { ReactNode } from 'react';

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-brand-400">
      {children}
    </label>
  );
}

const fieldClassName =
  'w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] font-semibold text-brand-800 outline-none placeholder:font-medium placeholder:text-brand-300 focus:border-sky-500 focus:bg-white';

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
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClassName}
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
      className={fieldClassName}
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
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`${fieldClassName} resize-none`}
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
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-gray-200 bg-gray-50 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-brand-800">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[12px] text-brand-400">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-sky-600' : 'bg-gray-300',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left]',
            checked ? 'left-[22px]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
