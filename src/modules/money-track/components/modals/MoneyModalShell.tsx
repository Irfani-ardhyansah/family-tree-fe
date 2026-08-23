import type { ReactNode } from 'react';
import { ModalShell, PrimaryButton, SecondaryButton } from '@/shared/ui';

export {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  MoneyAmountInput,
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
    <ModalShell
      accent="money"
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={footer}
      wide={wide}
      step={step}
      stepTotal={stepTotal}
      titleId="money-modal-title"
    >
      {children}
    </ModalShell>
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
    <PrimaryButton
      accent="money"
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </PrimaryButton>
  );
}

export function MoneySecondaryButton({
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

export function AmountDisplay({
  digits,
  onChange,
  tone = 'default',
  autoFocus = true,
}: {
  digits: string;
  /** Jika diisi, nominal bisa diketik keyboard (selain numpad). */
  onChange?: (digits: string) => void;
  tone?: 'default' | 'expense' | 'income';
  autoFocus?: boolean;
}) {
  const color =
    tone === 'expense'
      ? 'text-money-rose'
      : tone === 'income'
        ? 'text-money-brown-deep'
        : 'text-money-ink';
  const display = (() => {
    const raw = digits.replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('id-ID');
  })();

  return (
    <div className="py-2 text-center">
      <div className="text-[12px] font-bold text-money-faint">Rp</div>
      {onChange ? (
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={display}
          placeholder="0"
          aria-label="Nominal"
          onChange={(e) => {
            const next = e.target.value
              .replace(/\D/g, '')
              .replace(/^0+(?=\d)/, '')
              .slice(0, 12);
            onChange(next);
          }}
          onKeyDown={(e) => {
            if (
              e.key.length === 1 &&
              !/\d/.test(e.key) &&
              !e.metaKey &&
              !e.ctrlKey &&
              !e.altKey
            ) {
              e.preventDefault();
            }
          }}
          className={`font-money-mono w-full bg-transparent text-center text-[32px] font-extrabold tracking-tight outline-none placeholder:text-money-faint ${color}`}
        />
      ) : (
        <div
          className={`font-money-mono text-[32px] font-extrabold tracking-tight ${color}`}
        >
          {display || '0'}
          <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-money-brown align-middle" />
        </div>
      )}
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
        <div className="mt-4 w-full rounded-control bg-suite-soft px-4 py-2.5 text-[12px] text-suite-muted">
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
        'flex w-full items-center gap-2.5 rounded-control border px-3 py-2.5 text-left transition-colors',
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
