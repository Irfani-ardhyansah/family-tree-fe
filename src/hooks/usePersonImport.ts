import { useEffect, useRef, useState } from 'react';
import { ApiClientError } from '@/lib/apiClient';
import {
  downloadPersonImportTemplateFile,
  enqueuePersonImport,
  waitForPersonImportJob,
} from '@/lib/personApi';
import type {
  PersonImportError,
  PersonImportJobResponse,
  PersonImportPreviewRow,
} from '@/types/personImport';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.csv', '.json'];

export type PersonImportPhase =
  | 'idle'
  | 'checking'
  | 'preview'
  | 'importing'
  | 'done'
  | 'failed';

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function mapImportError(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'PERSON_IMPORT_FORBIDDEN':
        return 'Hanya admin keluarga yang dapat mengimpor anggota.';
      case 'PERSON_IMPORT_TOO_LARGE':
        return 'File terlalu besar atau melebihi 200 baris. Maksimal 2 MB / 200 baris.';
      case 'PERSON_IMPORT_UNSUPPORTED_FORMAT':
        return 'Format file tidak didukung. Gunakan .csv atau .json.';
      case 'PERSON_IMPORT_VALIDATION_FAILED':
        return error.message || 'Data import tidak valid.';
      case 'UNAUTHORIZED':
        return 'Sesi berakhir. Silakan login ulang.';
      default:
        return error.message;
    }
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '';
  }
  if (error instanceof TypeError) {
    return 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
  }
  return 'Terjadi kesalahan. Coba lagi nanti.';
}

export function usePersonImport(isOpen: boolean) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<PersonImportPhase>('idle');
  const [job, setJob] = useState<PersonImportJobResponse | null>(null);
  const [preview, setPreview] = useState<PersonImportPreviewRow[]>([]);
  const [rowErrors, setRowErrors] = useState<PersonImportError[]>([]);
  const [actionError, setActionError] = useState('');
  const [createdCount, setCreatedCount] = useState(0);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setFile(null);
    setPhase('idle');
    setJob(null);
    setPreview([]);
    setRowErrors([]);
    setActionError('');
    setCreatedCount(0);
    setIsDownloadingTemplate(false);
  };

  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
      setFile(null);
      setPhase('idle');
      setJob(null);
      setPreview([]);
      setRowErrors([]);
      setActionError('');
      setCreatedCount(0);
      setIsDownloadingTemplate(false);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen]);

  const selectFile = (next: File | null) => {
    if (!next) {
      setFile(null);
      setActionError('');
      setPhase('idle');
      setJob(null);
      setPreview([]);
      setRowErrors([]);
      return;
    }

    if (!isAcceptedFile(next)) {
      setFile(null);
      setActionError('File harus berformat .csv atau .json.');
      return;
    }

    if (next.size > MAX_FILE_BYTES) {
      setFile(null);
      setActionError('File terlalu besar. Maksimal 2 MB.');
      return;
    }

    setFile(next);
    setActionError('');
    setPhase('idle');
    setJob(null);
    setPreview([]);
    setRowErrors([]);
    setCreatedCount(0);
  };

  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setActionError('');
    try {
      await downloadPersonImportTemplateFile();
    } catch (err) {
      setActionError(mapImportError(err) || 'Gagal mengunduh template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const runJob = async (dryRun: boolean) => {
    if (!file) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setActionError('');
    setRowErrors([]);
    setPhase(dryRun ? 'checking' : 'importing');
    setJob(null);

    try {
      const enqueued = await enqueuePersonImport(file, dryRun);
      setJob(enqueued);

      const finalJob = await waitForPersonImportJob(
        enqueued.jobId,
        (progressJob) => setJob(progressJob),
        controller.signal,
      );

      if (finalJob.status === 'failed') {
        setPhase('failed');
        setRowErrors(finalJob.errors ?? []);
        setActionError(finalJob.message || 'Validasi gagal.');
        return;
      }

      if (dryRun) {
        setPreview(finalJob.result?.preview ?? []);
        setPhase('preview');
        return;
      }

      setCreatedCount(finalJob.result?.createdCount ?? 0);
      setPhase('done');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setPhase('failed');
      setActionError(mapImportError(err));
    }
  };

  const checkData = () => void runJob(true);
  const confirmImport = () => void runJob(false);

  const progressPercent = job?.progress.percent ?? 0;
  const progressMessage = job?.message ?? null;
  const isBusy = phase === 'checking' || phase === 'importing' || isDownloadingTemplate;
  const canCheck = Boolean(file) && !isBusy && phase !== 'done';
  const canImport = phase === 'preview' && preview.length > 0 && !isBusy;

  return {
    file,
    phase,
    job,
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
    reset,
  };
}
