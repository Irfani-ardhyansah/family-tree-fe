import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { AlertTriangle } from 'react-feather';
import { ApiClientError } from '@/lib/apiClient';

type DeleteConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  personName: string;
};

function mapDeleteError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === 'PERSON_HAS_CHILDREN') {
      return error.message;
    }
    return error.message || 'Gagal menghapus anggota.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Gagal menghapus anggota.';
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  personName,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError('');
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(mapDeleteError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={isDeleting ? () => {} : onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="text-red-500" size={20} />
                  </div>
                  <DialogTitle
                    as="h3"
                    className="text-lg font-semibold text-brand-800"
                  >
                    Hapus Anggota Keluarga
                  </DialogTitle>
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Apakah Anda yakin ingin menghapus{' '}
                  <span className="font-semibold text-brand-700">
                    {personName}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700 leading-relaxed"
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirm()}
                    disabled={isDeleting}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Menghapus…' : 'Ya, Hapus'}
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
