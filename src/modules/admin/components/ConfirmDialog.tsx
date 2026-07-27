import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'react-feather';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'neutral';
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setBusy(false);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError('');
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : tone === 'warning'
        ? 'bg-amber-600 hover:bg-amber-700'
        : 'bg-admin-600 hover:bg-admin-700';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-admin"
        onClose={busy ? () => {} : onClose}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-950/45 backdrop-blur-[2px]" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl shadow-ink-900/15 sm:p-6">
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      tone === 'danger'
                        ? 'bg-rose-50 text-rose-600'
                        : tone === 'warning'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-admin-50 text-admin-700'
                    }`}
                  >
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <DialogTitle className="font-admin-display text-lg font-bold text-ink-900">
                      {title}
                    </DialogTitle>
                    <div className="mt-1.5 text-sm leading-relaxed text-ink-500">
                      {description}
                    </div>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100 disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleConfirm()}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${confirmClass}`}
                  >
                    {busy ? 'Memproses…' : confirmLabel}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
