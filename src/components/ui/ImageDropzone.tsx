import {
  useState,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { Upload, X, Plus, Loader } from 'react-feather';
import { useDataSource } from '@/context/DataSourceContext';
import { deleteMedia, uploadMedia } from '@/lib/mediaApi';
import {
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  isPendingMediaItem,
  type MediaPurpose,
  type MediaUploadItem,
} from '@/types/media';

type ImageDropzoneProps = {
  value: MediaUploadItem[];
  onChange: (items: MediaUploadItem[]) => void;
  purpose: MediaPurpose;
  contextId?: string | number;
  multiple?: boolean;
  maxFiles?: number;
  onPendingTrack?: (id: string) => void;
  onPendingUntrack?: (id: string) => void;
  disabled?: boolean;
};

const ALLOWED_TYPES = new Set(MEDIA_ACCEPT.split(','));

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Format harus JPEG, PNG, WEBP, atau GIF';
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return 'Ukuran file maksimal 5 MB';
  }
  return null;
}

export function ImageDropzone({
  value,
  onChange,
  purpose,
  contextId,
  multiple = false,
  maxFiles = 10,
  onPendingTrack,
  onPendingUntrack,
  disabled = false,
}: ImageDropzoneProps) {
  const { source } = useDataSource();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledTempIds = useRef(new Set<string>());
  const valueRef = useRef(value);
  valueRef.current = value;

  const setItems = (next: MediaUploadItem[]) => {
    valueRef.current = next;
    onChange(next);
  };

  const slots = multiple ? maxFiles - value.length : value.length === 0 ? 1 : 0;
  const canAdd = !disabled && slots > 0;
  const isUploading = value.some((i) => i.uploading);

  const uploadOne = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const placeholder: MediaUploadItem = {
      id: tempId,
      url: URL.createObjectURL(file),
      uploading: true,
      pending: true,
    };

    setItems(multiple ? [...valueRef.current, placeholder] : [placeholder]);

    if (source === 'mock') {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (cancelledTempIds.current.has(tempId)) return;
        setItems(
          multiple
            ? valueRef.current
                .filter((i) => i.id !== tempId)
                .concat({ id: `mock-${tempId}`, url: dataUrl, pending: false })
            : [{ id: `mock-${tempId}`, url: dataUrl, pending: false }],
        );
      } catch {
        if (cancelledTempIds.current.has(tempId)) return;
        setItems(valueRef.current.filter((i) => i.id !== tempId));
      } finally {
        URL.revokeObjectURL(placeholder.url);
      }
      return;
    }

    try {
      const record = await uploadMedia(file, purpose, contextId);
      if (cancelledTempIds.current.has(tempId)) {
        try {
          await deleteMedia(record.id);
        } catch {
          // best-effort
        }
        return;
      }

      const item: MediaUploadItem = {
        id: record.id,
        url: record.url,
        pending: true,
      };
      onPendingTrack?.(record.id);

      setItems(
        multiple
          ? valueRef.current.filter((i) => i.id !== tempId).concat(item)
          : [item],
      );
    } catch (err) {
      if (cancelledTempIds.current.has(tempId)) return;
      const message =
        err instanceof Error ? err.message : 'Gagal mengunggah foto';
      setItems(
        valueRef.current.map((i) =>
          i.id === tempId ? { ...i, uploading: false, error: message } : i,
        ),
      );
    } finally {
      URL.revokeObjectURL(placeholder.url);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    if (disabled) return;
    const imageFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, slots);
    for (const file of imageFiles) {
      await uploadOne(file);
    }
  };

  const remove = async (idx: number) => {
    const item = value[idx];
    if (!item || disabled) return;

    if (item.uploading) {
      cancelledTempIds.current.add(item.id);
      setItems(valueRef.current.filter((_, i) => i !== idx));
      return;
    }

    if (source === 'api' && isPendingMediaItem(item)) {
      onPendingUntrack?.(item.id);
      try {
        await deleteMedia(item.id);
      } catch {
        // already removed or attached — drop from UI anyway
      }
    }

    setItems(valueRef.current.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void processFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      {canAdd && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all select-none ${
            disabled
              ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              : dragging
                ? 'border-primary-400 bg-primary-50 scale-[1.01] cursor-pointer'
                : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              dragging ? 'bg-primary-100' : 'bg-gray-100'
            }`}
          >
            <Upload
              size={20}
              className={dragging ? 'text-primary-500' : 'text-gray-400'}
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-700">
              Seret foto ke sini atau{' '}
              <span className="text-primary-500 font-medium">
                klik untuk pilih
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {multiple
                ? `Maks. ${maxFiles} foto · JPEG, PNG, WEBP, GIF · ≤ 5 MB`
                : 'JPEG, PNG, WEBP, GIF · maks. 5 MB'}
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={MEDIA_ACCEPT}
            multiple={multiple}
            disabled={disabled}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {value.length > 0 && (
        <div
          className={`grid gap-2 ${
            multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1'
          }`}
        >
          {value.map((item, idx) => (
            <div
              key={item.id}
              className={`relative group rounded-xl overflow-hidden bg-gray-100 ${
                multiple ? 'aspect-square' : 'h-48'
              } ${item.error ? 'ring-2 ring-red-400' : ''}`}
            >
              <img
                src={item.url}
                alt={`Foto ${idx + 1}`}
                className={`w-full h-full object-cover ${
                  item.uploading ? 'opacity-50' : ''
                }`}
              />
              {item.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader size={24} className="text-white animate-spin" />
                </div>
              )}
              {item.error && (
                <div className="absolute inset-x-0 bottom-0 bg-red-500/90 px-2 py-1">
                  <p className="text-[10px] text-white leading-tight">
                    {item.error}
                  </p>
                </div>
              )}
              {!item.uploading && !disabled && (
                <>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={() => void remove(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    aria-label={`Hapus foto ${idx + 1}`}
                  >
                    <X size={12} />
                  </button>
                </>
              )}
              {multiple && !item.uploading && (
                <span className="absolute bottom-1.5 left-1.5 text-xs text-white bg-black/40 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx + 1}
                </span>
              )}
            </div>
          ))}

          {multiple && canAdd && (
            <div
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={18} className="text-gray-300" />
              <span className="text-xs text-gray-400">Tambah</span>
            </div>
          )}
        </div>
      )}

      {multiple && value.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {value.length} / {maxFiles} foto
          {isUploading && ' · mengunggah…'}
        </p>
      )}
    </div>
  );
}
