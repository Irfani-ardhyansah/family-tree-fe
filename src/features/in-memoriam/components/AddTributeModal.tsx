import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, BookOpen } from 'react-feather';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { isRichTextEmpty, sanitizeRichText } from '@/utils/richText';

type AddTributeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; photoUrls: string[] }) => void;
  deceasedName: string;
  authorName: string;
};

export function AddTributeModal({
  isOpen,
  onClose,
  onSubmit,
  deceasedName,
  authorName,
}: AddTributeModalProps) {
  const [content, setContent] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleClose = () => {
    setContent('');
    setPhotoUrls([]);
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (isRichTextEmpty(content)) {
      setError('Cerita kenangan wajib diisi');
      return;
    }
    onSubmit({ content: sanitizeRichText(content), photoUrls });
    handleClose();
  };

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
              <DialogPanel className="w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                  <div>
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold text-slate-800"
                    >
                      Tulis Kenangan
                    </DialogTitle>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Untuk {deceasedName} · sebagai {authorName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cerita / Kesan <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                      key={isOpen ? 'open' : 'closed'}
                      value={content}
                      onChange={(html) => {
                        setContent(html);
                        if (error) setError('');
                      }}
                      placeholder={`Ceritakan kenanganmu dengan ${deceasedName}...`}
                      hasError={!!error}
                    />
                    {error && (
                      <p className="mt-1 text-xs text-red-500">{error}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Foto Kenangan{' '}
                      <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <ImageDropzone
                      value={photoUrls}
                      onChange={setPhotoUrls}
                      multiple
                      maxFiles={8}
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
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-sm font-semibold text-white"
                  >
                    <BookOpen size={16} />
                    Kirim Kenangan
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
