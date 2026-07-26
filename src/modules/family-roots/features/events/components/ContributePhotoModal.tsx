import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { X, Upload } from 'react-feather';
import { ImageDropzone } from '@/shared/components/ui/ImageDropzone';
import { useMediaModalSession } from '@/shared/hooks/useMediaModalSession';
import { splitMediaForSubmit, type MediaUploadItem } from '@/shared/types/media';

type ContributePhotoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    mediaIds: string[];
    photoUrls?: string[];
    caption?: string;
  }) => void;
  contributorName: string;
  eventId?: string;
};

export function ContributePhotoModal({
  isOpen,
  onClose,
  onSubmit,
  contributorName,
  eventId,
}: ContributePhotoModalProps) {
  const [photos, setPhotos] = useState<MediaUploadItem[]>([]);
  const [caption, setCaption] = useState('');
  const mediaSession = useMediaModalSession();

  useEffect(() => {
    if (isOpen) {
      setPhotos([]);
      setCaption('');
    }
  }, [isOpen]);

  const handleClose = () => {
    void mediaSession.cleanupPending();
    setPhotos([]);
    setCaption('');
    onClose();
  };

  const handleSubmit = () => {
    const { mediaIds, photoUrls } = splitMediaForSubmit(photos);
    if (mediaIds.length === 0 && photoUrls.length === 0) return;
    mediaSession.commitPending();
    onSubmit({
      mediaIds,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      caption: caption.trim() || undefined,
    });
    setPhotos([]);
    setCaption('');
    onClose();
  };

  const hasReadyPhotos = photos.some((p) => !p.uploading && !p.error);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
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
              <DialogPanel className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                  <div>
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold text-brand-700"
                    >
                      Tambah Foto ke Galeri
                    </DialogTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Berkontribusi sebagai{' '}
                      <span className="font-medium text-primary-600">
                        {contributorName}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <ImageDropzone
                    value={photos}
                    onChange={setPhotos}
                    purpose="event_contribution"
                    contextId={eventId}
                    onPendingTrack={mediaSession.trackPending}
                    onPendingUntrack={mediaSession.untrackPending}
                    multiple
                    maxFiles={10}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keterangan Foto{' '}
                      <span className="text-gray-400 font-normal">
                        (opsional, berlaku untuk semua foto)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="contoh: Momen seru bareng keluarga"
                      className="block w-full rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 px-6 pb-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!hasReadyPhotos}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    Unggah{' '}
                    {photos.length > 0 ? `(${photos.filter((p) => !p.uploading).length})` : ''}
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
