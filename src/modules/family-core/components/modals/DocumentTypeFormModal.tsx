import { useState, type FormEvent } from 'react';
import {
  FieldInput,
  FieldLabel,
  ToggleRow,
} from '@/modules/family-core/components/CoreFormFields';
import {
  CoreFormFooter,
  CoreModalShell,
  CoreSecondaryButton,
  CoreSuccessPanel,
} from '@/modules/family-core/components/CoreModalShell';
import { useFamilyCoreDocumentTypes } from '@/modules/family-core/context/FamilyCoreDocumentTypesContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import {
  DOCUMENT_TYPE_ICON_OPTIONS,
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_TONES,
  resolveDocumentType,
} from '@/modules/family-core/lib/documentTypeMeta';
import type {
  DocumentTypeExtraField,
  DocumentTypeIconKey,
  DocumentTypeToneKey,
} from '@/modules/family-core/types';

const FORM_ID = 'core-document-type-form';

export function DocumentTypeFormModal() {
  const { documentTypeModal, closeDocumentTypeModal, openDocumentTypeModal } =
    useFamilyCoreUi();
  const { getTypeById, addType, updateType } = useFamilyCoreDocumentTypes();

  if (!documentTypeModal) return null;

  const existing = documentTypeModal.typeId
    ? getTypeById(documentTypeModal.typeId)
    : undefined;

  return (
    <DocumentTypeFormModalInner
      key={documentTypeModal.typeId ?? 'new'}
      existing={existing}
      addType={addType}
      updateType={updateType}
      onClose={closeDocumentTypeModal}
      onAgain={() => openDocumentTypeModal()}
    />
  );
}

function DocumentTypeFormModalInner({
  existing,
  addType,
  updateType,
  onClose,
  onAgain,
}: {
  existing: ReturnType<
    ReturnType<typeof useFamilyCoreDocumentTypes>['getTypeById']
  >;
  addType: ReturnType<typeof useFamilyCoreDocumentTypes>['addType'];
  updateType: ReturnType<typeof useFamilyCoreDocumentTypes>['updateType'];
  onClose: () => void;
  onAgain: () => void;
}) {
  const isEdit = Boolean(existing);
  const [label, setLabel] = useState(existing?.label ?? '');
  const [iconKey, setIconKey] = useState<DocumentTypeIconKey>(
    existing?.iconKey ?? 'fileText',
  );
  const [toneKey, setToneKey] = useState<DocumentTypeToneKey>(
    existing?.toneKey ?? 'sky',
  );
  const [defaultLifetime, setDefaultLifetime] = useState(
    existing?.defaultLifetime ?? false,
  );
  const [allowCustomTitle, setAllowCustomTitle] = useState(
    existing?.allowCustomTitle ?? false,
  );
  const [extras, setExtras] = useState<DocumentTypeExtraField[]>(
    existing?.extras ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const preview = resolveDocumentType({
    id: existing?.id ?? 'preview',
    slug: existing?.slug ?? 'preview',
    label: label || 'Preview',
    iconKey,
    toneKey,
    extras,
    defaultLifetime,
    isSystem: existing?.isSystem ?? false,
    sortOrder: existing?.sortOrder ?? 0,
    allowCustomTitle,
  });
  const PreviewIcon = preview.Icon;

  const updateExtra = (
    index: number,
    patch: Partial<DocumentTypeExtraField>,
  ) => {
    setExtras((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Nama jenis wajib diisi.');
      return;
    }
    for (const field of extras) {
      if (!field.key.trim() || !field.label.trim()) {
        setError('Setiap field tambahan wajib punya key dan label.');
        return;
      }
    }

    const cleanExtras = extras.map((f) => ({
      key: f.key.trim(),
      label: f.label.trim(),
      placeholder: f.placeholder?.trim() || undefined,
    }));

    try {
      if (isEdit && existing) {
        await updateType(existing.id, {
          label: label.trim(),
          iconKey,
          toneKey,
          defaultLifetime,
          allowCustomTitle,
          extras: cleanExtras,
        });
      } else {
        await addType({
          label: label.trim(),
          iconKey,
          toneKey,
          defaultLifetime,
          allowCustomTitle,
          extras: cleanExtras,
        });
      }
      setError(null);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan jenis dokumen.',
      );
    }
  };

  if (success) {
    return (
      <CoreModalShell title="Tersimpan" onClose={onClose}>
        <CoreSuccessPanel
          title={isEdit ? 'Jenis dokumen diperbarui' : 'Jenis dokumen ditambah'}
          description="Master data tersimpan (API atau mock sesuai sumber data)."
          onAgain={isEdit ? undefined : onAgain}
          onDone={onClose}
        />
      </CoreModalShell>
    );
  }

  return (
    <CoreModalShell
      title={isEdit ? 'Edit jenis dokumen' : 'Tambah jenis dokumen'}
      subtitle={
        existing?.isSystem
          ? `Bawaan seeder · slug: ${existing.slug}`
          : 'Master data Family Core'
      }
      onClose={onClose}
      wide
      footer={
        <CoreFormFooter
          formId={FORM_ID}
          onCancel={onClose}
          submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan jenis'}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-3">
          <span
            className={[
              'flex h-11 w-11 items-center justify-center rounded-[12px]',
              preview.toneBg,
              preview.toneText,
            ].join(' ')}
          >
            <PreviewIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-brand-800">
              {label.trim() || 'Preview jenis'}
            </p>
            <p className="text-[11.5px] text-brand-400">
              {extras.length} field tambahan
              {defaultLifetime ? ' · default seumur hidup' : ''}
            </p>
          </div>
        </div>

        <div>
          <FieldLabel>Nama jenis</FieldLabel>
          <FieldInput
            value={label}
            onChange={setLabel}
            placeholder="Contoh: Surat nikah"
          />
        </div>

        <div>
          <FieldLabel>Ikon</FieldLabel>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {DOCUMENT_TYPE_ICON_OPTIONS.map((opt) => {
              const Icon = DOCUMENT_TYPE_ICONS[opt.value];
              const active = iconKey === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIconKey(opt.value)}
                  className={[
                    'flex flex-col items-center gap-1 rounded-[10px] border-2 px-1 py-2 text-[10px] font-bold',
                    active
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-gray-200 bg-white text-brand-500',
                  ].join(' ')}
                >
                  <Icon size={15} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Warna</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DOCUMENT_TYPE_TONES) as DocumentTypeToneKey[]).map(
              (key) => {
                const tone = DOCUMENT_TYPE_TONES[key];
                const active = toneKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setToneKey(key)}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold',
                      active
                        ? 'border-sky-500 bg-sky-50 text-sky-800'
                        : 'border-gray-200 bg-white text-brand-500',
                    ].join(' ')}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${tone.toneBg} ring-1 ring-black/5`}
                    />
                    {tone.label}
                  </button>
                );
              },
            )}
          </div>
        </div>

        <ToggleRow
          label="Default seumur hidup"
          description="Form dokumen baru otomatis tanpa tanggal kadaluarsa."
          checked={defaultLifetime}
          onChange={setDefaultLifetime}
        />

        <ToggleRow
          label="Judul custom"
          description="Izinkan isi label sendiri saat tambah dokumen (seperti Lainnya)."
          checked={allowCustomTitle}
          onChange={setAllowCustomTitle}
        />

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <FieldLabel>Field tambahan</FieldLabel>
            <button
              type="button"
              onClick={() =>
                setExtras((prev) => [
                  ...prev,
                  {
                    key: `field_${prev.length + 1}`,
                    label: '',
                    placeholder: '',
                  },
                ])
              }
              className="text-[12px] font-bold text-sky-700 hover:underline"
            >
              + Tambah field
            </button>
          </div>
          {extras.length === 0 ? (
            <p className="rounded-[12px] bg-gray-50 px-3 py-3 text-[12.5px] text-brand-400">
              Tidak ada field tambahan (hanya nomor dokumen utama).
            </p>
          ) : (
            <div className="space-y-3">
              {extras.map((field, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-[12px] border border-gray-200 p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Key</FieldLabel>
                      <FieldInput
                        value={field.key}
                        onChange={(v) =>
                          updateExtra(index, {
                            key: v.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                          })
                        }
                        placeholder="faskes"
                      />
                    </div>
                    <div>
                      <FieldLabel>Label</FieldLabel>
                      <FieldInput
                        value={field.label}
                        onChange={(v) => updateExtra(index, { label: v })}
                        placeholder="Faskes"
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <FieldLabel>Placeholder</FieldLabel>
                      <FieldInput
                        value={field.placeholder ?? ''}
                        onChange={(v) =>
                          updateExtra(index, { placeholder: v })
                        }
                        placeholder="Opsional"
                      />
                    </div>
                    <div className="w-24 shrink-0">
                      <CoreSecondaryButton
                        onClick={() =>
                          setExtras((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Hapus
                      </CoreSecondaryButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </form>
    </CoreModalShell>
  );
}
