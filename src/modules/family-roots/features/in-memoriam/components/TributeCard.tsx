import { Edit2, Trash2 } from 'react-feather';
import type { MemoriamTribute } from '@/shared/types/memoriam';
import { RichTextContent } from '@/shared/components/ui/RichTextContent';

function formatDate(dateStr: string): string {
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

type TributeCardProps = {
  tribute: MemoriamTribute;
  authorName: string;
  onPhotoClick?: (photoUrl: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TributeCard({
  tribute,
  authorName,
  onPhotoClick,
  onEdit,
  onDelete,
}: TributeCardProps) {
  const canManage = Boolean(tribute.canManage);

  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
          {getInitials(authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{authorName}</p>
          <p className="text-xs text-slate-400">{formatDate(tribute.createdAt)}</p>
        </div>
        {canManage && (onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                aria-label="Edit kenangan"
              >
                <Edit2 size={15} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Hapus kenangan"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-4">
        <RichTextContent content={tribute.content} />
      </div>

      {tribute.photoUrls.length > 0 && (
        <div
          className={`px-5 pb-5 grid gap-2 ${
            tribute.photoUrls.length === 1
              ? 'grid-cols-1'
              : tribute.photoUrls.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
          }`}
        >
          {tribute.photoUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPhotoClick?.(url)}
              className="rounded-xl overflow-hidden aspect-square bg-slate-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <img
                src={url}
                alt={`Foto kenangan ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
