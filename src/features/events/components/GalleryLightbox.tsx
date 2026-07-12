import { Dialog, DialogBackdrop, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { X, ChevronLeft, ChevronRight } from 'react-feather';
import type { GalleryItem } from '@/utils/eventAccess';

type GalleryLightboxProps = {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function GalleryLightbox({
  items,
  currentIndex,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const item = items[currentIndex];
  if (!item) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/90" />
        </TransitionChild>

        <div className="fixed inset-0 flex flex-col pointer-events-none">
          <div className="pointer-events-auto flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {item.contributorName}
              </p>
              <p className="text-xs text-white/60">
                {formatDateTime(item.createdAt)}
                {item.caption && ` · ${item.caption}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-white/50">
                {currentIndex + 1} / {items.length}
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Tutup"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative px-4 pb-4">
            {hasPrev && (
              <button
                onClick={() => onNavigate(currentIndex - 1)}
                className="absolute left-2 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto sebelumnya"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <img
              src={item.photoUrl}
              alt={item.caption ?? 'Foto acara'}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {hasNext && (
              <button
                onClick={() => onNavigate(currentIndex + 1)}
                className="absolute right-2 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto berikutnya"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
