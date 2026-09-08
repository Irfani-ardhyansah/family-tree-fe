import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { PersonNodeData } from '@/shared/utils/treeLayout';

function formatBirthYear(birthDate: string): string {
  return birthDate.slice(0, 4);
}

const SHOWN_LABELS = new Set(['Kamu', 'Pasangan', 'Ayah', 'Ibu', 'Saudara', 'Anak']);

function MaleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
      <circle cx="10" cy="14" r="5.5" />
      <line x1="14.2" y1="9.8" x2="20" y2="4" />
      <polyline points="15.5 4 20 4 20 8.5" />
    </svg>
  );
}

function FemaleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
      <circle cx="12" cy="8" r="5.5" />
      <line x1="12" y1="13.5" x2="12" y2="20" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

function PersonNode({ data }: { data: PersonNodeData }) {
  const {
    person,
    isFocus,
    isHighlighted,
    isSelected,
    isDimmed,
    isAncestorPath,
    isDescendantPath,
  } = data;
  const isDeceased = person.status === 'deceased';
  const showBadge = isFocus;

  const borderClass = isFocus
    ? 'border-primary-500 ring-2 ring-primary-500/30'
    : isSelected
      ? 'border-amber-500 ring-2 ring-amber-400/30'
      : isAncestorPath && !isSelected
        ? 'border-violet-400 ring-2 ring-violet-400/30'
        : isDescendantPath
          ? 'border-teal-400 ring-2 ring-teal-400/30'
          : isHighlighted
            ? 'border-yellow-400 ring-2 ring-yellow-400/30'
            : 'border-suite-border';

  const opacityClass = isDimmed ? 'opacity-30' : 'opacity-100';
  const hasHeaderBadge =
    showBadge || isSelected || (isAncestorPath && !isSelected) || isDescendantPath;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-primary-400 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-suite-faint !border-0"
      />

      <div
        className={`
          w-44 rounded-xl border-2 bg-suite-surface shadow-md transition-all duration-200
          hover:shadow-lg hover:-translate-y-0.5
          ${borderClass} ${opacityClass}
          ${isDeceased ? 'bg-suite-soft' : ''}
        `}
      >
        {showBadge && (
          <div className="bg-primary-500 text-white text-[10px] font-semibold text-center py-0.5 rounded-t-[10px]">
            {person.isSelf ? 'Kamu' : 'Fokus'}
          </div>
        )}
        {!showBadge && isSelected && (
          <div className="bg-amber-500 text-white text-[10px] font-semibold text-center py-0.5 rounded-t-[10px]">
            Dipilih
          </div>
        )}
        {!showBadge && !isSelected && isAncestorPath && (
          <div className="bg-violet-500 text-white text-[10px] font-semibold text-center py-0.5 rounded-t-[10px]">
            Leluhur
          </div>
        )}
        {!showBadge && !isSelected && !isAncestorPath && isDescendantPath && (
          <div className="bg-teal-500 text-white text-[10px] font-semibold text-center py-0.5 rounded-t-[10px]">
            Keturunan
          </div>
        )}

        <div className={`px-3 py-2.5 ${!hasHeaderBadge ? 'rounded-t-[10px]' : ''}`}>
          <div className="flex items-start gap-2">
            <div
              className={`
                flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                ${person.gender === 'male' ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300'}
                ${isDeceased ? 'grayscale' : ''}
              `}
            >
              {person.gender === 'male' ? <MaleIcon /> : <FemaleIcon />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-suite-ink leading-tight truncate" title={person.fullName}>
                {person.nickname ?? person.fullName.split(' ').slice(-2).join(' ')}
              </p>
              <p className="text-[10px] text-suite-muted truncate" title={person.fullName}>
                {person.fullName}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-1">
            {person.generationLabel && SHOWN_LABELS.has(person.generationLabel) && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-suite-soft text-suite-muted truncate max-w-[70%]">
                {person.generationLabel}
              </span>
            )}
            <span className="text-[9px] text-suite-faint ml-auto">
              {isDeceased ? `† ${formatBirthYear(person.birthDate)}` : formatBirthYear(person.birthDate)}
            </span>
          </div>

          {isDeceased && (
            <div className="mt-1.5 text-[9px] text-center text-suite-muted bg-suite-soft rounded py-0.5">
              Almarhum{person.gender === 'female' ? 'ah' : ''}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-suite-faint !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-primary-400 !border-0"
      />
    </>
  );
}

export default memo(PersonNode);
