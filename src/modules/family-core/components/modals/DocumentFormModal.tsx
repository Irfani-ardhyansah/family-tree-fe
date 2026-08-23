import { useEffect, useState, type FormEvent } from 'react';
import {
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  ToggleRow,
} from '@/modules/family-core/components/CoreFormFields';
import {
  CoreFormFooter,
  CoreModalShell,
  CoreSuccessPanel,
} from '@/modules/family-core/components/CoreModalShell';
import { useFamilyCoreDocumentTypes } from '@/modules/family-core/context/FamilyCoreDocumentTypesContext';
import { useFamilyCoreDocuments } from '@/modules/family-core/context/FamilyCoreDocumentsContext';
import { useFamilyCoreUi } from '@/modules/family-core/context/FamilyCoreUiContext';
import { resolveDocumentType } from '@/modules/family-core/lib/documentTypeMeta';
import { CORE_MEMBER_ROLE_LABEL } from '@/modules/family-core/mocks/coreMembers';
import { useDataSource } from '@/shared/context/DataSourceContext';
import type {
  CoreDocumentDraft,
  DocumentTypeSlug,
  ReminderDays,
} from '@/modules/family-core/types';

const FORM_ID = 'core-document-form';

const REMINDER_OPTIONS = [
  { value: '7', label: '7 hari sebelumnya' },
  { value: '14', label: '14 hari sebelumnya' },
  { value: '30', label: '30 hari sebelumnya' },
  { value: '60', label: '60 hari sebelumnya' },
  { value: '90', label: '90 hari sebelumnya' },
];

type FormState = {
  memberId: string;
  type: DocumentTypeSlug;
  title: string;
  number: string;
  issuedAt: string;
  expiresAt: string;
  lifetime: boolean;
  notes: string;
  reminderEnabled: boolean;
  reminderDays: ReminderDays;
  extras: Record<string, string>;
};

export function DocumentFormModal() {
  const { documentModal, closeDocumentModal, openDocumentModal } =
    useFamilyCoreUi();
  const { members, getDocument, addDocument, updateDocument, ensureDocumentDetail } =
    useFamilyCoreDocuments();
  const { types, getTypeBySlug } = useFamilyCoreDocumentTypes();
  const { isApi } = useDataSource();

  if (!documentModal) return null;

  const existing = documentModal.documentId
    ? getDocument(documentModal.documentId)
    : undefined;

  return (
    <DocumentFormModalInner
      key={
        documentModal.documentId ??
        `new-${documentModal.defaultMemberId ?? 'x'}`
      }
      documentId={documentModal.documentId}
      defaultMemberId={documentModal.defaultMemberId ?? members[0]?.id ?? ''}
      existing={existing}
      members={members}
      types={types}
      getTypeBySlug={getTypeBySlug}
      addDocument={addDocument}
      updateDocument={updateDocument}
      ensureDocumentDetail={ensureDocumentDetail}
      isApi={isApi}
      onClose={closeDocumentModal}
      onAgain={() =>
        openDocumentModal({
          defaultMemberId: documentModal.defaultMemberId,
        })
      }
    />
  );
}

function DocumentFormModalInner({
  documentId,
  defaultMemberId,
  existing,
  members,
  types,
  getTypeBySlug,
  addDocument,
  updateDocument,
  ensureDocumentDetail,
  isApi,
  onClose,
  onAgain,
}: {
  documentId?: string;
  defaultMemberId: string;
  existing: ReturnType<
    ReturnType<typeof useFamilyCoreDocuments>['getDocument']
  >;
  members: ReturnType<typeof useFamilyCoreDocuments>['members'];
  types: ReturnType<typeof useFamilyCoreDocumentTypes>['types'];
  getTypeBySlug: ReturnType<
    typeof useFamilyCoreDocumentTypes
  >['getTypeBySlug'];
  addDocument: ReturnType<typeof useFamilyCoreDocuments>['addDocument'];
  updateDocument: ReturnType<typeof useFamilyCoreDocuments>['updateDocument'];
  ensureDocumentDetail: ReturnType<
    typeof useFamilyCoreDocuments
  >['ensureDocumentDetail'];
  isApi: boolean;
  onClose: () => void;
  onAgain: () => void;
}) {
  const { isMock } = useDataSource();
  const isEdit = Boolean(documentId && existing);
  const defaultSlug = existing?.type ?? types[0]?.slug ?? 'ktp';
  const meta0 = resolveDocumentType(getTypeBySlug(defaultSlug));

  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          memberId: existing.memberId,
          type: existing.type,
          title: getTypeBySlug(existing.type)?.allowCustomTitle
            ? existing.title
            : '',
          number: existing.number,
          issuedAt: existing.issuedAt ?? '',
          expiresAt: existing.expiresAt ?? '',
          lifetime: existing.lifetime,
          notes: existing.notes,
          reminderEnabled: existing.reminderEnabled,
          reminderDays: existing.reminderDays,
          extras: { ...existing.extras },
        }
      : {
          memberId: defaultMemberId,
          type: defaultSlug,
          title: '',
          number: '',
          issuedAt: '',
          expiresAt: '',
          lifetime: meta0.defaultLifetime,
          notes: '',
          reminderEnabled: !meta0.defaultLifetime,
          reminderDays: 30,
          extras: {},
        },
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isApi || !documentId) return;
    void ensureDocumentDetail(documentId).then((detail) => {
      if (!detail) return;
      setForm((prev) => ({
        ...prev,
        memberId: detail.memberId,
        type: detail.type,
        title: getTypeBySlug(detail.type)?.allowCustomTitle ? detail.title : '',
        number: detail.number,
        issuedAt: detail.issuedAt ?? '',
        expiresAt: detail.expiresAt ?? '',
        lifetime: detail.lifetime,
        notes: detail.notes,
        reminderEnabled: detail.reminderEnabled,
        reminderDays: detail.reminderDays,
        extras: { ...detail.extras },
      }));
    });
  }, [documentId, ensureDocumentDetail, getTypeBySlug, isApi]);

  const typeMeta = resolveDocumentType(getTypeBySlug(form.type));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (slug: DocumentTypeSlug) => {
    const meta = resolveDocumentType(getTypeBySlug(slug));
    setForm((prev) => ({
      ...prev,
      type: slug,
      title: meta.allowCustomTitle ? prev.title : '',
      lifetime: meta.defaultLifetime,
      reminderEnabled: meta.defaultLifetime ? false : true,
      extras: {},
      expiresAt: meta.defaultLifetime ? '' : prev.expiresAt,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.memberId) {
      setError('Pilih anggota terlebih dahulu.');
      return;
    }
    if (!form.number.trim()) {
      setError('Nomor dokumen wajib diisi.');
      return;
    }
    if (typeMeta.allowCustomTitle && !form.title.trim()) {
      setError('Isi label dokumen untuk jenis ini.');
      return;
    }
    if (!form.lifetime && !form.expiresAt) {
      setError('Isi tanggal kadaluarsa, atau aktifkan Seumur hidup.');
      return;
    }

    const draft: CoreDocumentDraft = {
      memberId: form.memberId,
      type: form.type,
      title: typeMeta.allowCustomTitle
        ? form.title.trim() || typeMeta.label
        : typeMeta.label,
      number: form.number.trim(),
      issuedAt: form.issuedAt || null,
      expiresAt: form.lifetime ? null : form.expiresAt || null,
      lifetime: form.lifetime,
      notes: form.notes.trim(),
      reminderEnabled: form.lifetime ? false : form.reminderEnabled,
      reminderDays: form.reminderDays,
      extras: { ...form.extras },
      scanUrl: null,
    };

    try {
      if (isEdit && existing) {
        await updateDocument(existing.id, {
          ...draft,
          scanUrl: existing.scanUrl,
        });
      } else {
        await addDocument(draft);
      }
      setError(null);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan dokumen.',
      );
    }
  };

  if (success) {
    return (
      <CoreModalShell title="Tersimpan" onClose={onClose}>
        <CoreSuccessPanel
          title={isEdit ? 'Dokumen diperbarui' : 'Dokumen ditambahkan'}
          description={
            isMock
              ? 'Data mock — hanya di sesi ini.'
              : 'Tersimpan ke server Family Core.'
          }
          onAgain={isEdit ? undefined : onAgain}
          onDone={onClose}
        />
      </CoreModalShell>
    );
  }

  return (
    <CoreModalShell
      title={isEdit ? 'Edit dokumen' : 'Tambah dokumen'}
      subtitle="Dokumen penting"
      onClose={onClose}
      wide
      footer={
        <CoreFormFooter
          formId={FORM_ID}
          onCancel={onClose}
          submitLabel={isEdit ? 'Simpan perubahan' : 'Simpan dokumen'}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel>Untuk anggota</FieldLabel>
          <FieldSelect
            value={form.memberId}
            onChange={(v) => setField('memberId', v)}
            options={members.map((m) => ({
              value: m.id,
              label: `${m.name} · ${CORE_MEMBER_ROLE_LABEL[m.role]}`,
            }))}
          />
        </div>

        <div>
          <FieldLabel>Jenis dokumen</FieldLabel>
          {types.length === 0 ? (
            <p className="rounded-[12px] bg-rose-50 px-3 py-3 text-[12.5px] font-semibold text-rose-700">
              Belum ada jenis dokumen. Tambah dulu di menu Jenis dokumen.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {types.map((t) => {
                const resolved = resolveDocumentType(t);
                const active = form.type === t.slug;
                const Icon = resolved.Icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeChange(t.slug)}
                    className={[
                      'flex flex-col items-center gap-1 rounded-[12px] border-2 px-1.5 py-2 text-[10.5px] font-bold transition-colors',
                      active
                        ? `${resolved.toneBg} ${resolved.toneText} border-current`
                        : 'border-gray-200 bg-white text-brand-500 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <Icon size={15} />
                    <span className="line-clamp-2 text-center leading-tight">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {typeMeta.allowCustomTitle ? (
          <div>
            <FieldLabel>Label dokumen</FieldLabel>
            <FieldInput
              value={form.title}
              onChange={(v) => setField('title', v)}
              placeholder="Contoh: Surat nikah"
            />
          </div>
        ) : null}

        <div>
          <FieldLabel>Nomor dokumen</FieldLabel>
          <FieldInput
            value={form.number}
            onChange={(v) => setField('number', v)}
            placeholder="Nomor utama dokumen"
          />
        </div>

        {typeMeta.extras.map((field) => (
          <div key={field.key}>
            <FieldLabel>{field.label}</FieldLabel>
            <FieldInput
              value={form.extras[field.key] ?? ''}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  extras: { ...prev.extras, [field.key]: v },
                }))
              }
              placeholder={field.placeholder}
            />
          </div>
        ))}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Tanggal terbit</FieldLabel>
            <FieldInput
              type="date"
              value={form.issuedAt}
              onChange={(v) => setField('issuedAt', v)}
            />
          </div>
          <div>
            <FieldLabel>Tanggal kadaluarsa</FieldLabel>
            <input
              type="date"
              value={form.expiresAt}
              disabled={form.lifetime}
              onChange={(e) => setField('expiresAt', e.target.value)}
              className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13.5px] font-semibold text-brand-800 outline-none focus:border-sky-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <ToggleRow
          label="Seumur hidup"
          description="Tanpa tanggal kadaluarsa (mis. KTP, KK)."
          checked={form.lifetime}
          onChange={(v) => {
            setForm((prev) => ({
              ...prev,
              lifetime: v,
              expiresAt: v ? '' : prev.expiresAt,
              reminderEnabled: v ? false : prev.reminderEnabled,
            }));
          }}
        />

        <ToggleRow
          label="Reminder"
          description="Ingatkan sebelum dokumen kadaluarsa."
          checked={!form.lifetime && form.reminderEnabled}
          onChange={(v) => {
            if (!form.lifetime) setField('reminderEnabled', v);
          }}
        />

        {!form.lifetime && form.reminderEnabled ? (
          <div>
            <FieldLabel>Jarak reminder</FieldLabel>
            <FieldSelect
              value={String(form.reminderDays)}
              onChange={(v) =>
                setField('reminderDays', Number(v) as ReminderDays)
              }
              options={REMINDER_OPTIONS}
            />
          </div>
        ) : null}

        <div>
          <FieldLabel>Catatan</FieldLabel>
          <FieldTextarea
            value={form.notes}
            onChange={(v) => setField('notes', v)}
            placeholder="Opsional"
          />
        </div>

        <div className="rounded-[12px] border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center">
          <p className="text-[13px] font-semibold text-brand-600">
            Upload scan dokumen
          </p>
          <p className="mt-1 text-[12px] text-brand-400">
            Dummy — media upload menyusul.
          </p>
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
