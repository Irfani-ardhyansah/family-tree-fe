import { Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Plus, Trash2 } from 'react-feather';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreCalendar } from '@/modules/family-core/context/FamilyCoreCalendarContext';
import { useFamilyCoreCalendarEventTypes } from '@/modules/family-core/context/FamilyCoreCalendarEventTypesContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { resolveCalendarEventType } from '@/modules/family-core/lib/calendarEventMeta';
import { corePaths } from '@/shared/routes';

export function CalendarEventTypesPage() {
  const { types, deleteType } = useFamilyCoreCalendarEventTypes();
  const { events } = useFamilyCoreCalendar();
  const { openCalendarEventTypeModal } = useFamilyCoreUi();

  const usageCount = (slug: string) =>
    events.filter((e) => e.type === slug).length;

  const handleDelete = (id: string, slug: string, label: string) => {
    const used = usageCount(slug);
    if (used > 0) {
      window.alert(
        `Tipe "${label}" masih dipakai ${used} jadwal. Pindahkan/hapus jadwalnya dulu.`,
      );
      return;
    }
    if (!window.confirm(`Hapus tipe kalender "${label}"?`)) return;
    const result = deleteType(id);
    if (!result.ok) window.alert(result.message);
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
        title="Tipe kalender"
        description="Master data — CRUD. Default bawaan akan di-seed BE."
        actions={
          <button
            type="button"
            onClick={() => openCalendarEventTypeModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-sky-700"
          >
            <Plus size={16} />
            Tambah
          </button>
        }
      />

      <CoreCard className="overflow-hidden divide-y divide-gray-100">
        {types.map((type) => {
          const resolved = resolveCalendarEventType(type);
          const Icon = resolved.Icon;
          const used = usageCount(type.slug);
          return (
            <div
              key={type.id}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <span
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]',
                  resolved.toneBg,
                  resolved.toneText,
                ].join(' ')}
              >
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-brand-800">
                    {type.label}
                  </p>
                  <span className={`h-2 w-2 rounded-full ${resolved.dot}`} />
                  {type.isSystem ? (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                      Seeder
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-500">
                      Custom
                    </span>
                  )}
                  {type.linksToHealth ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                      Health
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-brand-400">
                  slug: {type.slug}
                  {' · '}
                  {used} jadwal
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCalendarEventTypeModal({ typeId: type.id })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-400 hover:bg-sky-50 hover:text-sky-700"
                aria-label={`Edit ${type.label}`}
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(type.id, type.slug, type.label)}
                disabled={type.isSystem}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                title={
                  type.isSystem
                    ? 'Tipe bawaan seeder tidak bisa dihapus'
                    : 'Hapus'
                }
                aria-label={`Hapus ${type.label}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </CoreCard>
    </div>
  );
}
