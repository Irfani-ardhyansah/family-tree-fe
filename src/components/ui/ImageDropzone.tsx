import {
  useState,
  useRef,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { Upload, X, Plus } from 'react-feather';

type ImageDropzoneProps = {
  /** Array of base64/object URL strings */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Allow multiple photos. Default: false */
  multiple?: boolean;
  /** Max number of photos when multiple=true. Default: 10 */
  maxFiles?: number;
};

function readFilesAsDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export function ImageDropzone({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
}: ImageDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const slots = multiple ? maxFiles - value.length : value.length === 0 ? 1 : 0;
  const canAdd = slots > 0;

  const processFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, slots);
    if (imageFiles.length === 0) return;

    const urls = await readFilesAsDataUrls(imageFiles);
    onChange(multiple ? [...value, ...urls].slice(0, maxFiles) : [urls[0]]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {/* Dropzone — only shown when more slots available */}
      {canAdd && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all select-none ${
            dragging
              ? 'border-primary-400 bg-primary-50 scale-[1.01]'
              : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
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
              <span className="text-primary-500 font-medium">klik untuk pilih</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {multiple
                ? `Bisa pilih banyak foto sekaligus (maks. ${maxFiles})`
                : 'JPG, PNG, GIF, WEBP'}
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div
          className={`grid gap-2 ${
            multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1'
          }`}
        >
          {value.map((url, idx) => (
            <div
              key={idx}
              className={`relative group rounded-xl overflow-hidden bg-gray-100 ${
                multiple ? 'aspect-square' : 'h-48'
              }`}
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label={`Hapus foto ${idx + 1}`}
              >
                <X size={12} />
              </button>
              {multiple && (
                <span className="absolute bottom-1.5 left-1.5 text-xs text-white bg-black/40 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx + 1}
                </span>
              )}
            </div>
          ))}

          {/* "+ Tambah" slot when grid has existing photos */}
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
        </p>
      )}
    </div>
  );
}
