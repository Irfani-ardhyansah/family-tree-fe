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
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-suite-faint">
        {title}
        {typeof count === 'number' ? (
          <span className="ml-1.5 text-suite-faint/80">({count})</span>
        ) : null}
      </h2>
      {onEditBasics ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/50"
          onClick={onEditBasics}
        >
          <Edit2 size={12} />
          Edit
        </button>
      ) : null}
      {onAdd ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/50"
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
    <p className="rounded-[12px] border border-suite-border bg-suite-soft px-3 py-3 text-[13px] text-suite-faint">
      {text}
    </p>
  );
}

function allergyTone(kind: AllergyKind) {
  if (kind === 'obat') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
  }
  if (kind === 'makanan') {
    return 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200';
  }
  return 'bg-suite-soft text-suite-muted';
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
        <p className="mb-2 text-[12px] font-semibold text-suite-muted">Tinggi (cm)</p>
        <div className="flex items-end gap-2">
          {points.map((p) => (
            <div key={`h-${p.id}`} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300">
                {p.heightCm}
              </span>
              <div
                className="w-full max-w-[36px] rounded-t-md bg-sky-400/80 dark:bg-sky-500/70"
                style={{ height: `${Math.max(12, (p.heightCm / maxH) * 88)}px` }}
              />
              <span className="text-[9px] text-suite-faint">
                {formatDate(p.date).replace(/ \d{4}$/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[12px] font-semibold text-suite-muted">Berat (kg)</p>
        <div className="flex items-end gap-2">
          {points.map((p) => (
            <div key={`w-${p.id}`} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                {p.weightKg}
              </span>
              <div
                className="w-full max-w-[36px] rounded-t-md bg-teal-400/80 dark:bg-teal-500/70"
                style={{ height: `${Math.max(12, (p.weightKg / maxW) * 72)}px` }}
              />
              <span className="text-[9px] text-suite-faint">
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
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-suite-muted hover:text-sky-700 dark:hover:text-sky-300"
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
            <div className="rounded-[12px] bg-rose-50 px-3 py-3 text-center dark:bg-rose-950/40">
              <Heart size={14} className="mx-auto text-rose-500 dark:text-rose-400" />
              <p className="mt-1 text-[11px] font-bold text-suite-faint">Gol. darah</p>
              <p className="text-[16px] font-bold text-suite-ink">
                {profile.basics.bloodType ?? '—'}
              </p>
            </div>
            <div className="rounded-[12px] bg-sky-50 px-3 py-3 text-center dark:bg-sky-950/40">
              <Activity size={14} className="mx-auto text-sky-600 dark:text-sky-400" />
              <p className="mt-1 text-[11px] font-bold text-suite-faint">Tinggi</p>
              <p className="text-[16px] font-bold text-suite-ink">
                {profile.basics.heightCm != null ? `${profile.basics.heightCm}` : '—'}
                <span className="text-[11px] font-semibold text-suite-faint"> cm</span>
              </p>
            </div>
            <div className="rounded-[12px] bg-teal-50 px-3 py-3 text-center dark:bg-teal-950/40">
              <Thermometer size={14} className="mx-auto text-teal-600 dark:text-teal-400" />
              <p className="mt-1 text-[11px] font-bold text-suite-faint">Berat</p>
              <p className="text-[16px] font-bold text-suite-ink">
                {profile.basics.weightKg != null ? `${profile.basics.weightKg}` : '—'}
                <span className="text-[11px] font-semibold text-suite-faint"> kg</span>
              </p>
            </div>
          </div>
          {profile.basics.notes ? (
            <p className="mt-3 text-[13px] text-suite-muted">{profile.basics.notes}</p>
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.allergies.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => open('allergy', item.id)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-rose-50/40 dark:hover:bg-rose-950/30"
                >
                  <AlertTriangle
                    size={16}
                    className={
                      item.severity === 'berat'
                        ? 'mt-0.5 text-rose-600 dark:text-rose-400'
                        : 'mt-0.5 text-amber-600 dark:text-amber-400'
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-suite-ink">
                        {item.name}
                      </p>
                      <AllergyBadge item={item} />
                      <span className="text-[11px] font-bold uppercase text-suite-faint">
                        {item.severity}
                      </span>
                    </div>
                    {item.notes ? (
                      <p className="mt-0.5 text-[12.5px] text-suite-muted">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>
                  <Edit2 size={14} className="mt-1 shrink-0 text-suite-faint" />
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.medications.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => open('medication', med.id)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-sky-50/50 dark:hover:bg-sky-950/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-suite-ink">
                      {med.name}
                    </p>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                      {med.dose}
                    </span>
                    {med.reminderEnabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                        <Clock size={10} />
                        Reminder
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-suite-muted">
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.appointments.map((appt) => (
                <div key={appt.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => open('appointment', appt.id)}
                      className="text-left text-[14px] font-semibold text-suite-ink hover:text-sky-700 dark:hover:text-sky-300"
                    >
                      {appt.title}
                    </button>
                    {appt.calendarEventId ? (
                      <Link
                        to={corePaths.calendarEvent(appt.calendarEventId)}
                        className="text-[11.5px] font-bold text-sky-700 hover:underline dark:text-sky-300"
                      >
                        Lihat di kalender
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-suite-muted">
                    {appt.doctor} · {appt.place}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-amber-700 dark:text-amber-300">
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.conditions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open('condition', c.id)}
                  className="w-full px-4 py-3 text-left hover:bg-suite-soft"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-suite-ink">
                      {c.name}
                    </p>
                    <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-bold text-suite-muted">
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-suite-muted">
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.surgeries.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => open('surgery', s.id)}
                  className="w-full px-4 py-3 text-left hover:bg-suite-soft"
                >
                  <p className="text-[14px] font-semibold text-suite-ink">
                    {s.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-suite-muted">
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.vaccines.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => open('vaccine', v.id)}
                  className="w-full px-4 py-3 text-left hover:bg-suite-soft"
                >
                  <p className="text-[14px] font-semibold text-suite-ink">
                    {v.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-suite-muted">
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {profile.notes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => open('note', n.id)}
                  className="flex w-full gap-3 px-4 py-3 text-left hover:bg-suite-soft"
                >
                  <FileText size={16} className="mt-0.5 shrink-0 text-suite-faint" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-suite-ink">
                        {n.title}
                      </p>
                      <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-bold text-suite-muted">
                        {n.kind}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-suite-faint">
                      {formatDate(n.date)}
                    </p>
                    <p className="mt-1 text-[13px] text-suite-muted">{n.summary}</p>
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
            <CoreCard className="overflow-hidden divide-y divide-suite-border">
              {(profile.xrays ?? []).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => open('xray', x.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-suite-soft"
                >
                  {x.imageUrl ? (
                    <img
                      src={x.imageUrl}
                      alt={x.title}
                      className="h-14 w-11 shrink-0 rounded-lg object-cover ring-1 ring-suite-border"
                    />
                  ) : (
                    <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-300 dark:bg-slate-800">
                      <Image size={16} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-suite-ink">
                        {x.title}
                      </p>
                      <span className="rounded-full bg-suite-soft px-2 py-0.5 text-[11px] font-bold text-suite-muted">
                        {XRAY_BODY_LABEL[x.bodyPart]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-suite-muted">
                      {formatDate(x.date)}
                      {x.facility ? ` · ${x.facility}` : ''}
                    </p>
                    {x.notes ? (
                      <p className="mt-0.5 truncate text-[12px] text-suite-faint">
                        {x.notes}
                      </p>
                    ) : null}
                  </div>
                  <Edit2 size={14} className="shrink-0 text-suite-faint" />
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
            <p className="mb-3 text-[12.5px] text-suite-faint">
              Tinggi & berat berkala — terutama untuk anak.
            </p>
            <GrowthChart points={profile.growth} />
          </CoreCard>
        ) : null}
      </div>
    </div>
  );
}
