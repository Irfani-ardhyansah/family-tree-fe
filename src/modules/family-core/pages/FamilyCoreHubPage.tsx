import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Calendar, FileText } from 'react-feather';
import { CoreHubSkeleton } from '@/modules/family-core/components/CoreSkeleton';
import { CoreCard } from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreCalendar } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { useFamilyCoreDocuments } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { useFamilyCoreHealth } from '@/modules/family-core/context/FamilyCoreHealthContext';
import { getDocumentStatus } from '@/modules/family-core/lib/documentStatus';
import { toDateKey } from '@/modules/family-core/lib/calendarDate';
import { corePaths } from '@/shared/routes';

export function FamilyCoreHubPage() {
  const { documents, members, loading } = useFamilyCoreDocuments();
  const { profiles } = useFamilyCoreHealth();
  const { events } = useFamilyCoreCalendar();

  const urgent = documents.filter((d) => {
    const s = getDocumentStatus(d);
    return s === 'expired' || s === 'expiring';
  }).length;

  const allergyCount = profiles.reduce((n, p) => n + p.allergies.length, 0);
  const apptCount = profiles.reduce((n, p) => n + p.appointments.length, 0);

  const today = toDateKey(new Date());
  const upcomingEvents = events.filter(
    (e) => e.date >= today || (e.endDate && e.endDate >= today),
  ).length;

  if (loading) {
    return <CoreHubSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-800">
          Family Core
        </h1>
        <p className="mt-0.5 text-[13.5px] text-brand-500">
          Dokumen, kesehatan, dan kalender keluarga inti.
        </p>
      </div>

      <div className="space-y-3">
        <Link to={corePaths.documents} className="block">
          <CoreCard className="p-5 transition-colors hover:border-sky-300 hover:bg-sky-50/40">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-sky-100 text-sky-700">
                <FileText size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold text-brand-800">
                    Dokumen penting
                  </h2>
                  <ArrowRight size={16} className="text-sky-600" />
                </div>
                <p className="mt-1 text-[13px] text-brand-500">
                  Simpan nomor dokumen, pantau kadaluarsa, dan arsip scan.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-brand-600">
                    {documents.length} dokumen
                  </span>
                  {urgent > 0 ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                      {urgent} perlu perhatian
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      Semua aman
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CoreCard>
        </Link>

        <Link to={corePaths.health} className="block">
          <CoreCard className="p-5 transition-colors hover:border-rose-300 hover:bg-rose-50/40">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-rose-100 text-rose-700">
                <Activity size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold text-brand-800">
                    Health tracker
                  </h2>
                  <ArrowRight size={16} className="text-rose-600" />
                </div>
                <p className="mt-1 text-[13px] text-brand-500">
                  Alergi, obat rutin, vaksin, jadwal dokter, growth tracker.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-brand-600">
                    {members.length} anggota
                  </span>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                    {allergyCount} alergi
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                    {apptCount} jadwal dokter
                  </span>
                </div>
              </div>
            </div>
          </CoreCard>
        </Link>

        <Link to={corePaths.calendar} className="block">
          <CoreCard className="p-5 transition-colors hover:border-violet-300 hover:bg-violet-50/40">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-violet-100 text-violet-700">
                <Calendar size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-bold text-brand-800">
                    Family calendar
                  </h2>
                  <ArrowRight size={16} className="text-violet-600" />
                </div>
                <p className="mt-1 text-[13px] text-brand-500">
                  Sekolah, kerja, ultah, dokter, tagihan, anniversary.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-brand-600">
                    {events.length} event
                  </span>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                    {upcomingEvents} mendatang
                  </span>
                </div>
              </div>
            </div>
          </CoreCard>
        </Link>
      </div>
    </div>
  );
}
