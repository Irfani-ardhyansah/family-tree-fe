import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Edit2, MapPin, Trash2, User } from 'react-feather';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreCalendar } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { useFamilyCoreCalendarEventTypes } from '@/modules/family-core/context/FamilyCoreCalendarEventTypesContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { formatDayLabel } from '@/modules/family-core/lib/calendarDate';
import { resolveCalendarEventType } from '@/modules/family-core/lib/calendarEventMeta';
import { CORE_MEMBERS } from '@/modules/family-core/mocks/coreMembers';
import { corePaths } from '@/shared/routes';

export function CalendarEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { getEvent, deleteEvent } = useFamilyCoreCalendar();
  const { getTypeBySlug } = useFamilyCoreCalendarEventTypes();
  const { openCalendarModal } = useFamilyCoreUi();
  const event = eventId ? getEvent(eventId) : undefined;
  if (!event) return <Navigate to={corePaths.calendar} replace />;

  const meta = resolveCalendarEventType(getTypeBySlug(event.type));
  const Icon = meta.Icon;
  const member = event.memberId
    ? CORE_MEMBERS.find((m) => m.id === event.memberId)
    : null;

  const handleDelete = () => {
    if (
      !window.confirm(
        `Hapus jadwal "${event.title}"? (dummy — hanya sesi ini)`,
      )
    ) {
      return;
    }
    deleteEvent(event.id);
    navigate(corePaths.calendar);
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          to={corePaths.calendar}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-500 hover:text-sky-700"
        >
          <ArrowLeft size={15} />
          Kembali ke kalender
        </Link>
      </div>

      <CorePageHeader
        title={event.title}
        description={meta.label}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCalendarModal({ eventId: event.id })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-brand-700 hover:border-sky-300 hover:text-sky-700"
            >
              <Edit2 size={15} />
              Edit
            </button>
            <span
              className={[
                'flex h-11 w-11 items-center justify-center rounded-[12px]',
                meta.toneBg,
                meta.toneText,
              ].join(' ')}
            >
              <Icon size={20} />
            </span>
          </div>
        }
      />

      <CoreCard className="overflow-hidden divide-y divide-gray-100">
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
            Tanggal
          </p>
          <p className="mt-0.5 text-[14px] font-semibold text-brand-800">
            {formatDayLabel(event.date)}
            {event.endDate && event.endDate !== event.date
              ? ` → ${formatDayLabel(event.endDate)}`
              : ''}
          </p>
        </div>
        <div className="flex items-start gap-3 px-4 py-3">
          <Clock size={16} className="mt-0.5 text-brand-400" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
              Waktu
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-brand-800">
              {event.allDay ? 'Seharian' : event.time ?? '—'}
            </p>
          </div>
        </div>
        {member ? (
          <div className="flex items-start gap-3 px-4 py-3">
            <User size={16} className="mt-0.5 text-brand-400" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
                Anggota
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-brand-800">
                {member.name}
              </p>
            </div>
          </div>
        ) : null}
        {event.location ? (
          <div className="flex items-start gap-3 px-4 py-3">
            <MapPin size={16} className="mt-0.5 text-brand-400" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
                Lokasi
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-brand-800">
                {event.location}
              </p>
            </div>
          </div>
        ) : null}
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
            Reminder
          </p>
          <p className="mt-0.5 text-[14px] font-semibold text-brand-800">
            {event.reminderEnabled ? 'Aktif' : 'Nonaktif'}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-400">
            Catatan
          </p>
          <p className="mt-0.5 text-[14px] font-semibold text-brand-800">
            {event.notes?.trim() ? event.notes : '—'}
          </p>
        </div>
      </CoreCard>

      {meta.linksToHealth && event.memberId ? (
        <Link
          to={corePaths.healthMember(event.memberId)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13.5px] font-bold text-rose-700 hover:bg-rose-100"
        >
          Buka Health Tracker — {member?.name ?? 'anggota'}
        </Link>
      ) : null}

      <button
        type="button"
        onClick={handleDelete}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-white px-4 py-3 text-[13.5px] font-bold text-rose-700 hover:bg-rose-50"
      >
        <Trash2 size={16} />
        Hapus jadwal
      </button>

      <p className="mt-4 text-center text-[11.5px] text-brand-400">
        Data dummy — belum tersimpan ke server
      </p>
    </div>
  );
}
