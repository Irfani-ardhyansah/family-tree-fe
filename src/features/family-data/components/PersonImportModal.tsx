import { Fragment, useRef, useState } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import {
  Upload,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'react-feather';
import { useFamily } from '@/context/FamilyDataContext';
import {
  downloadPersonImportTemplate,
  getValidImportDrafts,
  parsePersonImportCsv,
  type PersonImportPreviewRow,
} from '@/utils/personImport';

type PersonImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function StatusIcon({ row }: { row: PersonImportPreviewRow }) {
  if (row.errors.length > 0) {
    return <AlertCircle size={16} className="text-red-500 shrink-0" />;
  }
  return <CheckCircle size={16} className="text-green-500 shrink-0" />;
}

export function PersonImportModal({ isOpen, onClose }: PersonImportModalProps) {
  const { importPersons } = useFamily();
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PersonImportPreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState<number | null>(null);

  const resetState = () => {
    setFileName('');
    setPreviewRows([]);
    setParseError('');
    setIsImporting(false);
    setImportDone(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = async (file: File) => {
    setParseError('');
    setImportDone(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('File harus berformat .csv');
      setPreviewRows([]);
      setFileName('');
      return;
    }

    try {
      const text = await file.text();
      const result = parsePersonImportCsv(text);
      setFileName(file.name);
      setPreviewRows(result.rows);
    } catch {
      setParseError('Gagal membaca file. Pastikan format CSV benar.');
      setPreviewRows([]);
      setFileName('');
    }
  };

  const validDrafts = getValidImportDrafts(previewRows);
  const invalidCount = previewRows.length - validDrafts.length;

  const handleImport = async () => {
    if (validDrafts.length === 0) return;
    setIsImporting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    const count = importPersons(validDrafts);
    setIsImporting(false);
    setImportDone(count);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
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
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                  <div>
                    <DialogTitle className="text-lg font-semibold text-brand-700">
                      Import Anggota Keluarga
                    </DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Khusus admin — unggah file CSV untuk menambah banyak anggota sekaligus.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label="Tutup"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {importDone != null ? (
                    <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-5 text-center">
                      <CheckCircle
                        size={32}
                        className="mx-auto text-green-500 mb-3"
                      />
                      <p className="text-sm font-semibold text-green-800">
                        {importDone} anggota berhasil diimport
                      </p>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
                      >
                        Selesai
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={downloadPersonImportTemplate}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-brand-700 hover:bg-gray-50 transition-colors"
                        >
                          <Download size={16} />
                          Unduh Template CSV
                        </button>
                      </div>

                      <div
                        className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 text-center"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) void handleFile(file);
                        }}
                      >
                        <Upload
                          size={28}
                          className="mx-auto text-gray-300 mb-3"
                        />
                        <p className="text-sm font-medium text-gray-700">
                          Seret file CSV ke sini
                        </p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                          atau pilih dari perangkat Anda
                        </p>
                        <input
                          ref={inputRef}
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleFile(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-brand-700 hover:bg-gray-50"
                        >
                          <FileText size={15} />
                          Pilih File CSV
                        </button>
                        {fileName && (
                          <p className="text-xs text-primary-600 mt-3 font-medium">
                            {fileName}
                          </p>
                        )}
                      </div>

                      {parseError && (
                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                          {parseError}
                        </div>
                      )}

                      {previewRows.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-green-700 font-medium">
                              {validDrafts.length} siap import
                            </span>
                            {invalidCount > 0 && (
                              <span className="text-red-600 font-medium">
                                {invalidCount} baris error
                              </span>
                            )}
                          </div>

                          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                            {previewRows.map((row) => (
                              <div
                                key={row.rowNumber}
                                className="flex items-start gap-3 px-4 py-3 text-sm"
                              >
                                <StatusIcon row={row} />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-brand-700">
                                    Baris {row.rowNumber}:{' '}
                                    {row.draft?.fullName ?? '—'}
                                  </p>
                                  {row.errors.length > 0 ? (
                                    <p className="text-xs text-red-600 mt-0.5">
                                      {row.errors.join(' ')}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {row.draft?.gender === 'male'
                                        ? 'Laki-laki'
                                        : 'Perempuan'}{' '}
                                      · {row.draft?.birthDate}
                                      {row.draft?.generationLabel
                                        ? ` · ${row.draft.generationLabel}`
                                        : ''}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {importDone == null && (
                  <div className="px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={
                        isImporting || validDrafts.length === 0 || !!parseError
                      }
                      className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold"
                    >
                      {isImporting
                        ? 'Mengimport…'
                        : `Import ${validDrafts.length} Anggota`}
                    </button>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
