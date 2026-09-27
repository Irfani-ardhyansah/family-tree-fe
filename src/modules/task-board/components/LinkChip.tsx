import { ExternalLink } from 'react-feather';
import type { TaskLink } from '../types';

const LINK_CONFIG: Record<
  TaskLink['type'],
  { label: string; className: string; icon: string }
> = {
  discord: {
    label: 'Discord',
    className:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    icon: '💬',
  },
  notion: {
    label: 'Notion',
    className:
      'bg-slate-100 text-slate-800 dark:bg-slate-950/60 dark:text-slate-300',
    icon: '📝',
  },
  mr: {
    label: 'MR',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
    icon: '🔀',
  },
};

interface LinkChipProps {
  link: TaskLink;
}

export function LinkChip({ link }: LinkChipProps) {
  const config = LINK_CONFIG[link.type];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${config.className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      <ExternalLink size={12} />
    </a>
  );
}
