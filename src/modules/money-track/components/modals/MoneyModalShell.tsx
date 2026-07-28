import type { ReactNode } from 'react';
import { X } from 'react-feather';

export {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
} from '@/modules/money-track/components/modals/MoneyFormFields';

type MoneyModalShellProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  step?: number;
  stepTotal?: number;
};

export function MoneyModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  step,
  stepTotal,
}: MoneyModalShellProps) {
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
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-money-surface shadow-xl sm:rounded-2xl',
          wide ? 'sm:max-w-xl' : 'sm:max-w-md',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="money-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-money-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id="money-modal-title"
                className="text-[15px] font-extrabold text-money-ink"
              >
                {title}
              </h2>
              {step != null && stepTotal != null ? (
                <div className="flex gap-1">
                  {Array.from({ length: stepTotal }, (_, i) => (
                    <i
                      key={i}
                      className={[
                        'block h-1.5 rounded-full',
                        i + 1 === step
                          ? 'w-3 bg-money-brown'
                          : i + 1 < step
                            ? 'w-1.5 bg-money-brown/50'
                            : 'w-1.5 bg-money-border',
                      ].join(' ')}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] text-money-faint">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-money-faint hover:bg-money-soft"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-money-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MoneyPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[11px] bg-money-brown px-4 py-3 text-[13px] font-extrabold text-white shadow-[0_8px_16px_-6px_rgba(91,124,153,0.45)] hover:bg-money-brown-deep disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function MoneySecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[11px] border border-money-border bg-money-surface px-4 py-3 text-[13px] font-bold text-money-muted hover:bg-money-soft"
    >
      {children}
    </button>
  );
}

export function AmountDisplay({
  digits,
  tone = 'default',
}: {
  digits: string;
  tone?: 'default' | 'expense' | 'income';
}) {
  const n = Number(digits.replace(/\D/g, '')) || 0;
  const color =
    tone === 'expense'
      ? 'text-money-rose'
      : tone === 'income'
        ? 'text-money-brown-deep'
        : 'text-money-ink';
  return (
    <div className="py-2 text-center">
      <div className="text-[12px] font-bold text-money-faint">Rp</div>
      <div className={`font-money-mono text-[32px] font-extrabold tracking-tight ${color}`}>
        {n.toLocaleString('id-ID')}
        <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-money-brown align-middle" />
      </div>
    </div>
  );
}

export function Numpad({
  onDigit,
  onBackspace,
  on000,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  on000: () => void;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            if (key === '⌫') onBackspace();
            else if (key === '000') on000();
            else onDigit(key);
          }}
          className={[
            'rounded-[9px] border border-money-border py-2.5 font-money-mono text-[15px] font-bold text-money-ink',
            key === '⌫' || key === '000'
              ? 'bg-money-soft text-money-faint'
              : 'bg-money-surface',
          ].join(' ')}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

export function SuccessPanel({
  title,
  body,
  balanceLabel,
  balanceValue,
  onAgain,
  onDone,
  againLabel = 'Tambah lagi',
}: {
  title: string;
  body: string;
  balanceLabel?: string;
  balanceValue?: string;
  onAgain?: () => void;
  onDone: () => void;
  againLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-money-brown-soft text-2xl text-money-brown-deep">
        ✓
      </div>
      <h3 className="text-[15px] font-extrabold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[12.5px] text-money-muted">{body}</p>
      {balanceLabel && balanceValue ? (
        <div className="mt-4 w-full rounded-[10px] bg-money-soft px-4 py-2.5 text-[12px] text-money-muted">
          {balanceLabel}
          <b className="font-money-mono mt-0.5 block text-[14px] text-money-ink">
            {balanceValue}
          </b>
        </div>
      ) : null}
      <div className="mt-5 flex w-full gap-2">
        {onAgain ? (
          <MoneySecondaryButton onClick={onAgain}>{againLabel}</MoneySecondaryButton>
        ) : null}
        <div className={onAgain ? 'flex-1' : 'w-full'}>
          <MoneyPrimaryButton onClick={onDone}>Selesai</MoneyPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function OptionCard({
  active,
  title,
  subtitle,
  onClick,
  icon,
}: {
  active?: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
        active
          ? 'border-money-brown bg-money-brown-soft'
          : 'border-money-border bg-money-surface hover:bg-money-soft',
      ].join(' ')}
    >
      {icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-money-soft text-sm">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">{title}</span>
        {subtitle ? (
          <span className="block text-[11px] text-money-faint">{subtitle}</span>
        ) : null}
      </span>
      <span
        className={[
          'h-4 w-4 shrink-0 rounded-full border-2',
          active
            ? 'border-money-brown bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-money-brown from-40% to-transparent to-42%'
            : 'border-money-border',
        ].join(' ')}
      />
    </button>
  );
}
