import { CORE_MEMBER_ROLE_LABEL } from '@/modules/family-core/mocks/coreMembers';
import type { CoreMember } from '@/modules/family-core/types';

type MemberFilter = 'all' | string;

type MemberAvatarSelectorProps = {
  members: CoreMember[];
  value: MemberFilter;
  onChange: (value: MemberFilter) => void;
  counts?: Record<string, number>;
  totalCount?: number;
  /** Default: "dok" — set null to hide count line and show role only */
  countLabel?: string | null;
};

export function MemberAvatarSelector({
  members,
  value,
  onChange,
  counts,
  totalCount,
  countLabel = 'dok',
}: MemberAvatarSelectorProps) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={[
          'flex min-w-[80px] flex-col items-center gap-1.5 rounded-[14px] border-2 bg-white px-2.5 py-2.5 transition-colors',
          value === 'all'
            ? 'border-sky-500 shadow-sm'
            : 'border-transparent hover:border-gray-200',
        ].join(' ')}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
          All
        </span>
        <span className="text-[12px] font-semibold text-brand-700">Semua</span>
        {typeof totalCount === 'number' && countLabel ? (
          <span className="text-[10px] font-medium text-brand-400">
            {totalCount} {countLabel}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-brand-400">Keluarga</span>
        )}
      </button>

      {members.map((member) => {
        const active = value === member.id;
        const count = counts?.[member.id] ?? 0;
        const roleLabel = CORE_MEMBER_ROLE_LABEL[member.role];
        const isInLaw =
          member.role === 'father_in_law' || member.role === 'mother_in_law';
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onChange(member.id)}
            className={[
              'flex min-w-[80px] flex-col items-center gap-1.5 rounded-[14px] border-2 bg-white px-2.5 py-2.5 transition-colors',
              active
                ? 'border-sky-500 shadow-sm'
                : 'border-transparent hover:border-gray-200',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white',
                member.avatarTone,
              ].join(' ')}
            >
              {member.initials}
            </span>
            <span className="max-w-[76px] truncate text-[12px] font-semibold text-brand-700">
              {member.name}
            </span>
            <span
              className={[
                'max-w-[76px] truncate text-[10px] font-medium',
                isInLaw ? 'text-amber-700' : 'text-brand-400',
              ].join(' ')}
            >
              {countLabel != null && counts
                ? `${roleLabel} · ${count}`
                : roleLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
