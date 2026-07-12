import type { MemoriamTribute } from '@/types/memoriam';
import { RichTextContent } from '@/components/ui/RichTextContent';

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
};

export function TributeCard({
  tribute,
  authorName,
  onPhotoClick,
}: TributeCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
          {getInitials(authorName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{authorName}</p>
          <p className="text-xs text-slate-400">{formatDate(tribute.createdAt)}</p>
        </div>
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
