import {
  isHtmlContent,
  RICH_TEXT_CONTENT_CLASS,
  sanitizeRichText,
} from '@/shared/utils/richText';

type RichTextContentProps = {
  content: string;
  className?: string;
};

export function RichTextContent({ content, className = '' }: RichTextContentProps) {
  if (!content?.trim()) return null;

  if (isHtmlContent(content)) {
    return (
      <div
        className={`${RICH_TEXT_CONTENT_CLASS} ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
      />
    );
  }

  return (
    <p className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${className}`}>
      {content}
    </p>
  );
}
