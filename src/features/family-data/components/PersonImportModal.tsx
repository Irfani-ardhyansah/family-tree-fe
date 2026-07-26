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
import { useDataSource } from '@/context/DataSourceContext';
import { useFamily } from '@/context/FamilyDataContext';
import { usePersonImport } from '@/hooks/usePersonImport';
import {
  downloadPersonImportTemplate,
  getValidImportDrafts,
  parsePersonImportCsv,
  type PersonImportPreviewRow as LocalPreviewRow,
} from '@/utils/personImport';

type PersonImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const EXAMPLE_CSV_URL = '/templates/persons-import-example.csv';

function ProgressBlock({
  percent,
  message,
}: {
  percent: number;
  message: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{message || 'Memproses…'}</span>
        <span className="font-medium text-brand-700">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

function ApiPersonImportModal({
  isOpen,
  onClose,
  onSuccess,
}: PersonImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    file,
    phase,
    preview,
    rowErrors,
    actionError,
    createdCount,
    progressPercent,
    progressMessage,
    isBusy,
    canCheck,
    canImport,
    isDownloadingTemplate,
    selectFile,
    downloadTemplate,
    checkData,
    confirmImport,
  } = usePersonImport(isOpen);

  const handleClose = () => {
    onClose();
  };

  const handleFile = (next: File) => {
    selectFile(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDone = () => {
    onSuccess?.();
    onClose();
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
                      Khusus admin — unggah CSV/JSON untuk menambah banyak anggota
                      sekaligus beserta relasi pohon keluarga.
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
                  {phase === 'done' ? (
                    <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-5 text-center">
                      <CheckCircle
                        size={32}
                        className="mx-auto text-green-500 mb-3"
                      />
                      <p className="text-sm font-semibold text-green-800">
                        Import selesai. {createdCount} person ditambahkan.
                      </p>
                      <button
                        type="button"
                        onClick={handleDone}
                        className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold"
                      >
                        Selesai
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
                        Isi ayah &amp; ibu di baris anak pakai{' '}
                        <code className="text-xs">fatherTempId</code> /{' '}
                        <code className="text-xs">motherTempId</code>. Jangan isi
                        daftar anak — anak muncul otomatis dari parent link.
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => void downloadTemplate()}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-brand-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <Download size={16} />
                          {isDownloadingTemplate
                            ? 'Mengunduh…'
                            : 'Unduh Template CSV'}
                        </button>
                        <a
                          href={EXAMPLE_CSV_URL}
                          download="persons-import-example.csv"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-brand-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText size={16} />
                          Unduh Contoh
                        </a>
                      </div>

                      <div
                        className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 text-center"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (isBusy) return;
                          const next = e.dataTransfer.files?.[0];
                          if (next) handleFile(next);
                        }}
                      >
                        <Upload
                          size={28}
                          className="mx-auto text-gray-300 mb-3"
                        />
                        <p className="text-sm font-medium text-gray-700">
                          Seret file CSV atau JSON ke sini
                        </p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                          Maks. 200 baris · 2 MB
                        </p>
                        <input
                          ref={inputRef}
                          type="file"
                          accept=".csv,.json,text/csv,application/json"
                          className="hidden"
                          disabled={isBusy}
                          onChange={(e) => {
                            const next = e.target.files?.[0];
                            if (next) handleFile(next);
                          }}
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => inputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-brand-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <FileText size={15} />
                          Pilih File
                        </button>
                        {file && (
                          <p className="text-xs text-primary-600 mt-3 font-medium">
                            {file.name}
                          </p>
                        )}
                      </div>

                      {(phase === 'checking' || phase === 'importing') && (
                        <ProgressBlock
                          percent={progressPercent}
                          message={progressMessage}
                        />
                      )}

                      {actionError && (
                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                          {actionError}
                        </div>
                      )}

                      {rowErrors.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-red-700">
                            {rowErrors.length} error validasi
                          </p>
                          <div className="max-h-40 overflow-y-auto rounded-xl border border-red-100 divide-y divide-red-50">
                            {rowErrors.map((err, idx) => (
                              <div
                                key={`${err.row}-${err.field ?? ''}-${idx}`}
                                className="px-4 py-2.5 text-sm"
                              >
                                <p className="font-medium text-brand-700">
                                  Baris {err.row}
                                  {err.tempId ? ` · ${err.tempId}` : ''}
                                  {err.field ? ` · ${err.field}` : ''}
                                </p>
                                <p className="text-xs text-red-600 mt-0.5">
                                  {err.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase === 'preview' && preview.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-green-700 font-medium">
                              {preview.length} baris valid — siap diimpor
                            </span>
                          </div>
                          <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                            {preview.map((row) => (
                              <div
                                key={row.tempId}
                                className="flex items-start gap-3 px-4 py-3 text-sm"
                              >
                                <CheckCircle
                                  size={16}
                                  className="text-green-500 shrink-0 mt-0.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-brand-700">
                                    {row.fullName}{' '}
                                    <span className="text-xs font-normal text-gray-400">
                                      ({row.tempId})
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {row.gender === 'male'
                                      ? 'Laki-laki'
                                      : 'Perempuan'}{' '}
                                    · {row.birthDate}
                                    {row.fatherTempId || row.motherTempId
                                      ? ` · ortu: ${[row.fatherTempId, row.motherTempId].filter(Boolean).join(', ')}`
                                      : ''}
                                    {row.spouseTempIds.length > 0
                                      ? ` · pasangan: ${row.spouseTempIds.join(', ')}`
                                      : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {phase !== 'done' && (
                  <div className="px-6 py-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    {phase === 'preview' ? (
                      <button
                        type="button"
                        onClick={confirmImport}
                        disabled={!canImport}
                        className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold"
                      >
                        Konfirmasi Import
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={checkData}
                        disabled={!canCheck}
                        className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold"
                      >
                        {phase === 'checking'
                          ? 'Mengecek…'
                          : phase === 'importing'
                            ? 'Mengimport…'
                            : 'Cek data'}
                      </button>
                    )}
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

/** Local/mock fallback — client-side CSV parse (schema lama). */
function MockPersonImportModal({
  isOpen,
  onClose,
}: Omit<PersonImportModalProps, 'onSuccess'>) {
  const { importPersons } = useFamily();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<LocalPreviewRow[]>([]);
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
                      Mode mock — unggah file CSV untuk menambah banyak anggota
                      sekaligus.
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
                          const next = e.dataTransfer.files?.[0];
                          if (next) void handleFile(next);
                        }}
                      >
                        <Upload
                          size={28}
                          className="mx-auto text-gray-300 mb-3"
                        />
                        <p className="text-sm font-medium text-gray-700">
                          Seret file CSV ke sini
                        </p>
                        <input
                          ref={inputRef}
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => {
                            const next = e.target.files?.[0];
                            if (next) void handleFile(next);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-brand-700 hover:bg-gray-50"
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
                                {row.errors.length > 0 ? (
                                  <AlertCircle
                                    size={16}
                                    className="text-red-500 shrink-0"
                                  />
                                ) : (
                                  <CheckCircle
                                    size={16}
                                    className="text-green-500 shrink-0"
                                  />
                                )}
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
                      onClick={() => void handleImport()}
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

export function PersonImportModal({
  isOpen,
  onClose,
  onSuccess,
}: PersonImportModalProps) {
  const { source } = useDataSource();

  if (source === 'api') {
    return (
      <ApiPersonImportModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return <MockPersonImportModal isOpen={isOpen} onClose={onClose} />;
}
