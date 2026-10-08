import { htmlToPlainText } from '../lib/taskMeta';
import { cx } from '@/shared/ui';

const CLAMP_CLASS: Record<number, string> = {
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
};

interface TaskTextPreviewProps {
  html: string;
  /** Jumlah baris maksimum sebelum dipotong. Default 3. */
  lines?: 2 | 3 | 4;
  emptyLabel?: string;
  className?: string;
}

/** Preview teks polos terpotong (line-clamp) dari rich text HTML. */
export function TaskTextPreview({
  html,
  lines = 3,
  emptyLabel = '—',
  className,
}: TaskTextPreviewProps) {
  const text = htmlToPlainText(html);
  if (!text) {
    return <p className="text-[13px] text-suite-faint">{emptyLabel}</p>;
  }
  return (
    <p
      className={cx(
        'text-[13px] leading-relaxed text-suite-ink',
        CLAMP_CLASS[lines] ?? CLAMP_CLASS[3],
        className,
      )}
    >
      {text}
    </p>
  );
}
