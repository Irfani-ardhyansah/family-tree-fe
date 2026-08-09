import { Link } from 'react-router-dom';
import { Activity, AlertCircle, ChevronRight, Heart } from 'react-feather';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreHealth } from '@/modules/family-core/context/FamilyCoreHealthContext';
import {
  CORE_MEMBER_ROLE_LABEL,
  CORE_MEMBERS,
} from '@/modules/family-core/mocks/coreMembers';
import { corePaths } from '@/shared/routes';

export function HealthPage() {
  const { getProfile, profiles } = useFamilyCoreHealth();

  const upcomingCount = profiles.reduce(
    (n, p) => n + p.appointments.length,
    0,
  );
  const medReminderCount = profiles.reduce(
    (n, p) => n + p.medications.filter((m) => m.reminderEnabled).length,
    0,
  );

  return (
    <div>
      <CorePageHeader
        title="Health tracker"
        description="Riwayat kesehatan per anggota keluarga inti."
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <CoreCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
            Jadwal dokter
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-800">
            {upcomingCount}
          </p>
          <p className="text-[12px] text-brand-400">tercatat (dummy)</p>
        </CoreCard>
        <CoreCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
            Reminder obat
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-800">
            {medReminderCount}
          </p>
          <p className="text-[12px] text-brand-400">aktif</p>
        </CoreCard>
      </div>

      <CoreCard className="overflow-hidden divide-y divide-gray-100">
        {CORE_MEMBERS.map((member) => {
          const profile = getProfile(member.id);
          const allergyCount = profile.allergies.length;
          const medCount = profile.medications.length;
          const nextAppt = profile.appointments[0];

          return (
            <Link
              key={member.id}
              to={corePaths.healthMember(member.id)}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-rose-50/50"
            >
              <span
                className={[
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                  member.avatarTone,
                ].join(' ')}
              >
                {member.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-brand-800">
                    {member.name}
                  </p>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[10.5px] font-bold',
                      member.role === 'father_in_law' ||
                      member.role === 'mother_in_law'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-gray-100 text-brand-500',
                    ].join(' ')}
                  >
                    {CORE_MEMBER_ROLE_LABEL[member.role]}
                  </span>
                  {profile.basics.bloodType ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                      <Heart size={10} />
                      {profile.basics.bloodType}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-brand-500">
                  {[
                    profile.basics.heightCm
                      ? `${profile.basics.heightCm} cm`
                      : null,
                    profile.basics.weightKg
                      ? `${profile.basics.weightKg} kg`
                      : null,
                    allergyCount ? `${allergyCount} alergi` : null,
                    medCount ? `${medCount} obat` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Belum ada data dasar'}
                </p>
                {nextAppt ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-amber-700">
                    <Activity size={11} />
                    {nextAppt.title}
                  </p>
                ) : allergyCount > 0 ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-brand-400">
                    <AlertCircle size={11} />
                    Catat alergi untuk keadaan darurat
                  </p>
                ) : null}
              </div>
              <ChevronRight size={16} className="shrink-0 text-brand-300" />
            </Link>
          );
        })}
      </CoreCard>
    </div>
  );
}
