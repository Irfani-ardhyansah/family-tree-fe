import { ExternalLink } from 'react-feather';
import { LINK_META } from '../lib/taskMeta';
import type { TaskLink } from '../types';

interface LinkChipProps {
  link: TaskLink;
}

export function LinkChip({ link }: LinkChipProps) {
  const meta = LINK_META[link.type];
  const Icon = meta.icon;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 ${meta.chipClass}`}
    >
      <Icon size={13} />
      {meta.label}
      <ExternalLink size={11} />
    </a>
  );
}
