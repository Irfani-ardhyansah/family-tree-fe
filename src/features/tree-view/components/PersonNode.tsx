import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { User } from 'react-feather';
import type { PersonNodeData } from '@/utils/treeLayout';

function formatBirthYear(birthDate: string): string {
  return birthDate.slice(0, 4);
}

function PersonNode({ data }: { data: PersonNodeData }) {
  const { person, isFocus, isHighlighted, isSelected, isDimmed } = data;
  const isDeceased = person.status === 'deceased';
  const showBadge = isFocus;

  const borderClass = isFocus
    ? 'border-primary-500 ring-2 ring-primary-200'
    : isSelected
      ? 'border-secondary-500 ring-2 ring-secondary-100'
      : isHighlighted
        ? 'border-yellow-400 ring-2 ring-yellow-100'
        : 'border-gray-200';

  const opacityClass = isDimmed ? 'opacity-35' : 'opacity-100';

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
        className="!w-2 !h-2 !bg-gray-400 !border-0"
      />

      <div
        className={`
          w-44 rounded-xl border-2 bg-white shadow-md transition-all duration-200
          hover:shadow-lg hover:-translate-y-0.5
          ${borderClass} ${opacityClass}
          ${isDeceased ? 'bg-gray-50' : ''}
        `}
      >
        {showBadge && (
          <div className="bg-primary-500 text-white text-[10px] font-semibold text-center py-0.5 rounded-t-[10px]">
            {person.isSelf ? 'Kamu' : 'Fokus'}
          </div>
        )}

        <div className={`px-3 py-2.5 ${showBadge ? '' : 'rounded-t-[10px]'}`}>
          <div className="flex items-start gap-2">
            <div
              className={`
                flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                ${person.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}
                ${isDeceased ? 'grayscale' : ''}
              `}
            >
              <User size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-700 leading-tight truncate" title={person.fullName}>
                {person.nickname ?? person.fullName.split(' ').slice(-2).join(' ')}
              </p>
              <p className="text-[10px] text-gray-500 truncate" title={person.fullName}>
                {person.fullName}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-1">
            {person.generationLabel && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 truncate max-w-[70%]">
                {person.generationLabel}
              </span>
            )}
            <span className="text-[9px] text-gray-400 ml-auto">
              {isDeceased ? `† ${formatBirthYear(person.birthDate)}` : formatBirthYear(person.birthDate)}
            </span>
          </div>

          {isDeceased && (
            <div className="mt-1.5 text-[9px] text-center text-gray-500 bg-gray-100 rounded py-0.5">
              Almarhum{person.gender === 'female' ? 'ah' : ''}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-gray-400 !border-0"
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
