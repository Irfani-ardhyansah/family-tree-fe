import { Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Plus, Trash2 } from 'react-feather';
import {
  CoreCard,
  CorePageHeader,
} from '@/modules/family-core/components/PageChrome';
import { useFamilyCoreDocumentTypes } from '@/modules/family-core/context/FamilyCoreDocumentTypesContext';
import { useFamilyCoreDocuments } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { resolveDocumentType } from '@/modules/family-core/lib/documentTypeMeta';
import { corePaths } from '@/shared/routes';

export function DocumentTypesPage() {
  const { types, deleteType } = useFamilyCoreDocumentTypes();
  const { documents } = useFamilyCoreDocuments();
  const { openDocumentTypeModal } = useFamilyCoreUi();

  const usageCount = (slug: string) =>
    documents.filter((d) => d.type === slug).length;

  const handleDelete = (id: string, slug: string, label: string) => {
    const used = usageCount(slug);
    if (used > 0) {
      window.alert(
        `Jenis "${label}" masih dipakai ${used} dokumen. Pindahkan/hapus dokumennya dulu.`,
      );
      return;
    }
    if (!window.confirm(`Hapus jenis dokumen "${label}"?`)) return;
    const result = deleteType(id);
    if (!result.ok) window.alert(result.message);
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          to={corePaths.documents}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-500 hover:text-sky-700"
        >
          <ArrowLeft size={15} />
          Kembali ke dokumen
        </Link>
      </div>

      <CorePageHeader
        title="Jenis dokumen"
        description="Master data — CRUD. Default bawaan akan di-seed BE."
        actions={
          <button
            type="button"
            onClick={() => openDocumentTypeModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-sky-700"
          >
            <Plus size={16} />
            Tambah
          </button>
        }
      />

      <CoreCard className="overflow-hidden divide-y divide-gray-100">
        {types.map((type) => {
          const resolved = resolveDocumentType(type);
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
                  {type.isSystem ? (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                      Seeder
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-500">
                      Custom
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px] text-brand-400">
                  slug: {type.slug}
                  {' · '}
                  {type.extras.length} field tambahan
                  {type.defaultLifetime ? ' · seumur hidup' : ''}
                  {' · '}
                  {used} dokumen
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDocumentTypeModal({ typeId: type.id })}
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
                    ? 'Jenis bawaan seeder tidak bisa dihapus'
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
