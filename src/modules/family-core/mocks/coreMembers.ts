import type { CoreMember, CoreMemberRole } from '@/modules/family-core/types';

/** Keluarga inti (tanpa mertua). Selaras seed: anak Zahra & Zaka (bukan Raka). */
const CORE_MEMBERS_BASE: CoreMember[] = [
  {
    id: 'm-father',
    name: 'Bapak',
    role: 'father',
    initials: 'B',
    avatarTone: 'bg-slate-600',
  },
  {
    id: 'm-mother',
    name: 'Ibu',
    role: 'mother',
    initials: 'I',
    avatarTone: 'bg-rose-500',
  },
  {
    id: 'm-irfani',
    name: 'Irfani',
    role: 'child',
    initials: 'Ir',
    avatarTone: 'bg-sky-600',
  },
  {
    id: 'm-ayu',
    name: 'Ayu',
    role: 'spouse',
    initials: 'Ay',
    avatarTone: 'bg-violet-500',
  },
  {
    id: 'm-zahra',
    name: 'Zahra',
    role: 'child',
    initials: 'Zh',
    avatarTone: 'bg-teal-600',
  },
  {
    id: 'm-zaka',
    name: 'Zaka',
    role: 'child',
    initials: 'Zk',
    avatarTone: 'bg-cyan-600',
  },
];

/**
 * Orang tua pasangan (mertua).
 * Ditampilkan hanya jika sudah ada anggota role `spouse`.
 */
const CORE_MEMBERS_IN_LAWS: CoreMember[] = [
  {
    id: 'm-fil',
    name: 'Pak Hadi',
    role: 'father_in_law',
    initials: 'Ha',
    avatarTone: 'bg-stone-600',
  },
  {
    id: 'm-mil',
    name: 'Bu Siti',
    role: 'mother_in_law',
    initials: 'Si',
    avatarTone: 'bg-pink-500',
  },
];

export const CORE_MEMBER_ROLE_LABEL: Record<CoreMemberRole, string> = {
  father: 'Bapak',
  mother: 'Ibu',
  child: 'Anak',
  spouse: 'Pasangan',
  father_in_law: 'Mertua (Bapak)',
  mother_in_law: 'Mertua (Ibu)',
};

/** True jika keluarga inti sudah punya pasangan. */
export function hasCoreSpouse(members: CoreMember[] = CORE_MEMBERS_BASE): boolean {
  return members.some((m) => m.role === 'spouse');
}

/**
 * Daftar anggota yang ditampilkan di Family Core.
 * Jika sudah ada pasangan → sertakan mertua.
 */
export function getCoreMembers(): CoreMember[] {
  if (!hasCoreSpouse(CORE_MEMBERS_BASE)) return [...CORE_MEMBERS_BASE];
  return [...CORE_MEMBERS_BASE, ...CORE_MEMBERS_IN_LAWS];
}

/** Snapshot dummy (dengan mertua karena ada spouse). */
export const CORE_MEMBERS: CoreMember[] = getCoreMembers();
