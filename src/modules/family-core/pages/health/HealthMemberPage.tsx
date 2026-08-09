import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Edit2,
  FileText,
  Heart,
  Image,
  Plus,
  Thermometer,
} from 'react-feather';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreHealth } from '@/modules/family-core/context/FamilyCoreHealthContext';
import {
  useFamilyCoreUi,
  type HealthModalSection,
} from '@/modules/family-core/context/FamilyCoreUiContext';
import {
  CORE_MEMBER_ROLE_LABEL,
  CORE_MEMBERS,
} from '@/modules/family-core/mocks/coreMembers';
import type {
  AllergyKind,
  GrowthPoint,
  HealthAllergy,
  HealthXrayBodyPart,
} from '@/modules/family-core/types';
import { corePaths } from '@/shared/routes';

const XRAY_BODY_LABEL: Record<HealthXrayBodyPart, string> = {
  dada: 'Dada',
  kepala: 'Kepala',
  gigi: 'Gigi',
  tulang: 'Tulang',
  perut: 'Perut',
  lainnya: 'Lainnya',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  const key = value.includes('T') ? value.slice(0, 10) : value;
  return new Date(`${key}T12:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SectionHeader({
  title,
  count,
  onAdd,
  onEditBasics,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  onEditBasics?: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-brand-400">
        {title}
        {typeof count === 'number' ? (
          <span className="ml-1.5 text-brand-300">({count})</span>
        ) : null}
      </h2>
      {onEditBasics ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-sky-700 hover:bg-sky-50"
          onClick={onEditBasics}
        >
          <Edit2 size={12} />
          Edit
        </button>
      ) : null}
      {onAdd ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-sky-700 hover:bg-sky-50"
          onClick={onAdd}
        >
          <Plus size={12} />
          Tambah
        </button>
      ) : null}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-[12px] bg-gray-50 px-3 py-3 text-[13px] text-brand-400">
      {text}
    </p>
  );
}

function allergyTone(kind: AllergyKind) {
  if (kind === 'obat') return 'bg-rose-50 text-rose-700';
  if (kind === 'makanan') return 'bg-amber-50 text-amber-800';
  return 'bg-gray-100 text-brand-600';
}

function AllergyBadge({ item }: { item: HealthAllergy }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold',
        allergyTone(item.kind),
      ].join(' ')}
    >
      {item.kind}
    </span>
  );
}

function GrowthChart({ points }: { points: GrowthPoint[] }) {
  if (points.length === 0) return <EmptyLine text="Belum ada data pertumbuhan." />;
  const maxH = Math.max(...points.map((p) => p.heightCm));
  const maxW = Math.max(...points.map((p) => p.weightKg));

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[12px] font-semibold text-brand-500">Tinggi (cm)</p>
        <div className="flex items-end gap-2">
          {points.map((p) => (
            <div key={`h-${p.id}`} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-sky-700">{p.heightCm}</span>
              <div
                className="w-full max-w-[36px] rounded-t-md bg-sky-400/80"
                style={{ height: `${Math.max(12, (p.heightCm / maxH) * 88)}px` }}
              />
              <span className="text-[9px] text-brand-400">
                {formatDate(p.date).replace(/ \d{4}$/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-semibold text-brand-500">Berat (kg)</p>
        <div className="flex items-end gap-2">
          {points.map((p) => (
            <div key={`w-${p.id}`} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-teal-700">{p.weightKg}</span>
              <div
                className="w-full max-w-[36px] rounded-t-md bg-teal-400/80"
                style={{ height: `${Math.max(12, (p.weightKg / maxW) * 72)}px` }}
              />
              <span className="text-[9px] text-brand-400">
                {formatDate(p.date).replace(/ \d{4}$/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HealthMemberPage() {
  const { memberId } = useParams();
  const { getProfile } = useFamilyCoreHealth();
  const { openHealthModal } = useFamilyCoreUi();
  const member = CORE_MEMBERS.find((m) => m.id === memberId);
  if (!member) return <Navigate to={corePaths.health} replace />;

  const profile = getProfile(member.id);
  const showGrowth = member.role === 'child' || profile.growth.length > 0;

  const open = (section: HealthModalSection, editId?: string) => {
    openHealthModal({ section, memberId: member.id, editId });
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          to={corePaths.health}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-500 hover:text-sky-700"
        >
          <ArrowLeft size={15} />
          Semua anggota
        </Link>
      </div>

      <CorePageHeader
        title={member.name}
        description={`${CORE_MEMBER_ROLE_LABEL[member.role]} · profil kesehatan (dummy)`}
        actions={
          <span
            className={[
              'flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white',
              member.avatarTone,
            ].join(' ')}
          >
            {member.initials}
          </span>
        }
      />

      <div className="space-y-5">
        <CoreCard className="p-4 sm:p-5">
          <SectionHeader
            title="Data dasar"
            onEditBasics={() => open('basics')}
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[12px] bg-rose-50 px-3 py-3 text-center">
              <Heart size={14} className="mx-auto text-rose-500" />
              <p className="mt-1 text-[11px] font-bold text-brand-400">Gol. darah</p>
              <p className="text-[16px] font-bold text-brand-800">
                {profile.basics.bloodType ?? '—'}
              </p>
            </div>
            <div className="rounded-[12px] bg-sky-50 px-3 py-3 text-center">
              <Activity size={14} className="mx-auto text-sky-600" />
              <p className="mt-1 text-[11px] font-bold text-brand-400">Tinggi</p>
              <p className="text-[16px] font-bold text-brand-800">
                {profile.basics.heightCm != null ? `${profile.basics.heightCm}` : '—'}
                <span className="text-[11px] font-semibold text-brand-400"> cm</span>
              </p>
            </div>
            <div className="rounded-[12px] bg-teal-50 px-3 py-3 text-center">
              <Thermometer size={14} className="mx-auto text-teal-600" />
              <p className="mt-1 text-[11px] font-bold text-brand-400">Berat</p>
              <p className="text-[16px] font-bold text-brand-800">
                {profile.basics.weightKg != null ? `${profile.basics.weightKg}` : '—'}
                <span className="text-[11px] font-semibold text-brand-400"> kg</span>
              </p>
            </div>
          </div>
          {profile.basics.notes ? (
            <p className="mt-3 text-[13px] text-brand-500">{profile.basics.notes}</p>
          ) : null}
        </CoreCard>

        <div>
          <SectionHeader
            title="Alergi"
            count={profile.allergies.length}
            onAdd={() => open('allergy')}
          />
          {profile.allergies.length === 0 ? (
            <EmptyLine text="Tidak ada alergi tercatat." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.allergies.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => open('allergy', item.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-rose-50/40"
                >
                  <AlertTriangle
                    size={16}
                    className={
                      item.severity === 'berat'
                        ? 'mt-0.5 text-rose-600'
                        : 'mt-0.5 text-amber-600'
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-brand-800">
                        {item.name}
                      </p>
                      <AllergyBadge item={item} />
                      <span className="text-[11px] font-bold uppercase text-brand-400">
                        {item.severity}
                      </span>
                    </div>
                    {item.notes ? (
                      <p className="mt-0.5 text-[12.5px] text-brand-500">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>
                  <Edit2 size={14} className="mt-1 shrink-0 text-brand-300" />
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Obat rutin"
            count={profile.medications.length}
            onAdd={() => open('medication')}
          />
          {profile.medications.length === 0 ? (
            <EmptyLine text="Belum ada obat rutin." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.medications.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => open('medication', med.id)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-sky-50/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-brand-800">
                      {med.name}
                    </p>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                      {med.dose}
                    </span>
                    {med.reminderEnabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        <Clock size={10} />
                        Reminder
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-brand-500">
                    {med.schedule}
                  </p>
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Jadwal kontrol / dokter"
            count={profile.appointments.length}
            onAdd={() => open('appointment')}
          />
          {profile.appointments.length === 0 ? (
            <EmptyLine text="Tidak ada jadwal kontrol." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.appointments.map((appt) => (
                <div key={appt.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => open('appointment', appt.id)}
                      className="text-left text-[14px] font-semibold text-brand-800 hover:text-sky-700"
                    >
                      {appt.title}
                    </button>
                    {appt.calendarEventId ? (
                      <Link
                        to={corePaths.calendarEvent(appt.calendarEventId)}
                        className="text-[11.5px] font-bold text-sky-700 hover:underline"
                      >
                        Lihat di kalender
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-brand-500">
                    {appt.doctor} · {appt.place}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-amber-700">
                    {formatDateTime(appt.at)}
                    {appt.reminderEnabled ? ' · Reminder on' : ''}
                  </p>
                </div>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Riwayat penyakit"
            count={profile.conditions.length}
            onAdd={() => open('condition')}
          />
          {profile.conditions.length === 0 ? (
            <EmptyLine text="Tidak ada diagnosis tercatat." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.conditions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open('condition', c.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-brand-800">
                      {c.name}
                    </p>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-brand-500">
                    Diagnosis {formatDate(c.diagnosedAt)}
                    {c.notes ? ` · ${c.notes}` : ''}
                  </p>
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Riwayat operasi"
            count={profile.surgeries.length}
            onAdd={() => open('surgery')}
          />
          {profile.surgeries.length === 0 ? (
            <EmptyLine text="Tidak ada riwayat operasi." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.surgeries.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => open('surgery', s.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                >
                  <p className="text-[14px] font-semibold text-brand-800">
                    {s.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-brand-500">
                    {formatDate(s.date)} · {s.hospital || '—'}
                  </p>
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Vaksin"
            count={profile.vaccines.length}
            onAdd={() => open('vaccine')}
          />
          {profile.vaccines.length === 0 ? (
            <EmptyLine text="Belum ada riwayat vaksin." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.vaccines.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => open('vaccine', v.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                >
                  <p className="text-[14px] font-semibold text-brand-800">
                    {v.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-brand-500">
                    {formatDate(v.date)} · {v.doseLabel}
                  </p>
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Catatan dokter / lab"
            count={profile.notes.length}
            onAdd={() => open('note')}
          />
          {profile.notes.length === 0 ? (
            <EmptyLine text="Belum ada catatan." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {profile.notes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => open('note', n.id)}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <FileText size={16} className="mt-0.5 shrink-0 text-brand-400" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-brand-800">
                        {n.title}
                      </p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-brand-500">
                        {n.kind}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-brand-400">
                      {formatDate(n.date)}
                    </p>
                    <p className="mt-1 text-[13px] text-brand-600">{n.summary}</p>
                  </div>
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        <div>
          <SectionHeader
            title="Foto rontgen"
            count={(profile.xrays ?? []).length}
            onAdd={() => open('xray')}
          />
          {(profile.xrays ?? []).length === 0 ? (
            <EmptyLine text="Belum ada foto rontgen." />
          ) : (
            <CoreCard className="overflow-hidden divide-y divide-gray-100">
              {(profile.xrays ?? []).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => open('xray', x.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  {x.imageUrl ? (
                    <img
                      src={x.imageUrl}
                      alt={x.title}
                      className="h-14 w-11 shrink-0 rounded-lg object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-300">
                      <Image size={16} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-brand-800">
                        {x.title}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {XRAY_BODY_LABEL[x.bodyPart]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-brand-500">
                      {formatDate(x.date)}
                      {x.facility ? ` · ${x.facility}` : ''}
                    </p>
                    {x.notes ? (
                      <p className="mt-0.5 truncate text-[12px] text-brand-400">
                        {x.notes}
                      </p>
                    ) : null}
                  </div>
                  <Edit2 size={14} className="shrink-0 text-brand-300" />
                </button>
              ))}
            </CoreCard>
          )}
        </div>

        {showGrowth ? (
          <CoreCard className="p-4 sm:p-5">
            <SectionHeader
              title="Growth tracker"
              count={profile.growth.length}
              onAdd={() => open('growth')}
            />
            <p className="mb-3 text-[12.5px] text-brand-400">
              Tinggi & berat berkala — terutama untuk anak.
            </p>
            <GrowthChart points={profile.growth} />
          </CoreCard>
        ) : null}
      </div>
    </div>
  );
}
