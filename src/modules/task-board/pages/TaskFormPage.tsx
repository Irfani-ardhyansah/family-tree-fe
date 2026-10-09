import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Save, Trash2 } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { RichTextEditor } from '../components/RichTextEditor';
import {
  getActiveWorkplaces,
  useWorkplaces,
} from '../lib/workplaceStore';
import type {
  TaskFormData,
  TaskLink,
  TaskType,
  TaskStatus,
  TaskDescription,
} from '../types';
import { taskBoardPaths } from '@/shared/routes';
import {
  Card,
  FieldInput,
  FieldLabel,
  FieldSelect,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
} from '@/shared/ui';

const TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'Bugfixing', label: 'Bugfixing' },
  { value: 'Feature', label: 'Feature' },
  { value: 'Refactor', label: 'Refactor' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To-Do', label: 'To-Do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Merged', label: 'Merged' },
];

const LINK_TYPE_OPTIONS: { value: TaskLink['type']; label: string }[] = [
  { value: 'discord', label: 'Discord' },
  { value: 'notion', label: 'Notion' },
  { value: 'mr', label: 'Merge Request' },
];

const ADD_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-control border border-suite-border bg-suite-surface px-3 py-1.5 text-[12.5px] font-bold text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink';

const DELETE_BUTTON_CLASS =
  'shrink-0 rounded-control p-2.5 text-suite-faint transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300';

export function TaskFormPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const location = useLocation();
  const isEdit = !!taskId;
  const parentTaskId = location.state?.parentTaskId;
  const isRevision = !!parentTaskId;
  const workplaceIdFromState: number | undefined =
    typeof location.state?.workplaceId === 'number'
      ? location.state.workplaceId
      : undefined;
  const workplaces = useWorkplaces();
  const workplaceOptions = workplaces
    .filter((workplace) => !workplace.archived_at)
    .map((workplace) => ({
      value: String(workplace.id),
      label: workplace.name,
    }));
  const defaultWorkplaceId =
    workplaceIdFromState ?? getActiveWorkplaces()[0]?.id ?? null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    type: 'Feature',
    title: '',
    branchName: '',
    status: 'To-Do',
    links: [],
    descriptions: [{ title: 'Penjelasan', content: '' }],
    deployNotes: '',
    migrationFiles: [],
    parentTaskId: parentTaskId || null,
    workplaceId: defaultWorkplaceId,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const revisionParentId: number | null =
    (typeof parentTaskId === 'number' ? parentTaskId : null) ??
    formData.parentTaskId ??
    null;

  /**
   * Tujuan tombol kembali/batal:
   * - edit task → kembali ke detail task itu,
   * - bikin revisi → kembali ke detail task induk,
   * - task baru biasa → kembali ke daftar.
   */
  const backTarget =
    isEdit && taskId
      ? taskBoardPaths.detail(taskId)
      : revisionParentId != null
        ? taskBoardPaths.detail(revisionParentId)
        : workplaceIdFromState != null
          ? taskBoardPaths.workplace(workplaceIdFromState)
          : taskBoardPaths.home;

  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const task = await taskBoardApi.get(taskId);
      setFormData({
        type: task.type,
        title: task.title,
        branchName: task.branch_name,
        status: task.status,
        links: task.links,
        descriptions:
          task.descriptions && task.descriptions.length > 0
            ? task.descriptions
            : [{ title: 'Penjelasan', content: task.description || '' }],
        deployNotes: task.deploy_notes || '',
        migrationFiles: task.migration_files || [],
        parentTaskId: task.parent_task_id || null,
        workplaceId: task.workplace_id ?? defaultWorkplaceId,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Gagal memuat task.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      loadTask();
    }
  }, [taskId, isEdit]);

  const handleImagePaste = async (file: File): Promise<string> => {
    const tempId = taskId || 'temp';
    return await taskBoardApi.uploadImage(tempId, file);
  };

  const addLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links ?? []), { type: 'discord', url: '' }],
    }));
  };

  const removeLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: (prev.links ?? []).filter((_, i) => i !== index),
    }));
  };

  const updateLink = (index: number, field: keyof TaskLink, value: string) => {
    setFormData((prev) => {
      const links = [...(prev.links || [])];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, links };
    });
  };

  const addDescription = () => {
    setFormData((prev) => ({
      ...prev,
      descriptions: [
        ...(prev.descriptions || []),
        { title: '', content: '' },
      ],
    }));
  };

  const removeDescription = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      descriptions: (prev.descriptions || []).filter((_, i) => i !== index),
    }));
  };

  const updateDescription = (
    index: number,
    field: keyof TaskDescription,
    value: string,
  ) => {
    setFormData((prev) => {
      const descriptions = [...(prev.descriptions || [])];
      descriptions[index] = { ...descriptions[index], [field]: value };
      return { ...prev, descriptions };
    });
  };

  const addMigrationFile = () => {
    setFormData((prev) => ({
      ...prev,
      migrationFiles: [...(prev.migrationFiles || []), ''],
    }));
  };

  const removeMigrationFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      migrationFiles: (prev.migrationFiles || []).filter((_, i) => i !== index),
    }));
  };

  const updateMigrationFile = (index: number, value: string) => {
    setFormData((prev) => {
      const migrationFiles = [...(prev.migrationFiles || [])];
      migrationFiles[index] = value;
      return { ...prev, migrationFiles };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Halaman edit = informasi dasar saja. Penjelasan/links/migrasi/catatan
    // deploy di-CRUD langsung dari halaman detail.
    if (isEdit && taskId) {
      setSaving(true);
      try {
        await taskBoardApi.update(taskId, {
          type: formData.type,
          title: formData.title,
          branchName: formData.branchName,
          status: formData.status,
          workplaceId: formData.workplaceId ?? null,
        });
        navigate(taskBoardPaths.detail(taskId));
      } catch (error) {
        setErrorMessage(
          error instanceof Error && error.message
            ? error.message
            : 'Gagal menyimpan task.',
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    const descriptions = (formData.descriptions ?? [])
      .map((d) => ({ ...d, title: d.title.trim(), content: d.content.trim() }))
      .filter((d) => d.title !== '' || d.content !== '');
    const links = (formData.links ?? []).filter((l) => l.url.trim() !== '');
    const migrationFiles = (formData.migrationFiles ?? [])
      .map((f) => f.trim())
      .filter((f) => f !== '');

    if (descriptions.length === 0) {
      setErrorMessage('Minimal satu penjelasan wajib diisi.');
      return;
    }
    if (descriptions.some((d) => !d.title || !d.content)) {
      setErrorMessage('Setiap penjelasan butuh judul dan isi yang tidak kosong.');
      return;
    }

    setSaving(true);

    try {
      const apiData = {
        type: formData.type,
        title: formData.title,
        branchName: formData.branchName,
        status: formData.status,
        links,
        descriptions,
        deployNotes: formData.deployNotes,
        migrationFiles,
        parentTaskId: formData.parentTaskId,
        workplaceId: formData.workplaceId ?? null,
      };

      await taskBoardApi.create(apiData);
      navigate(
        formData.workplaceId != null
          ? taskBoardPaths.workplace(formData.workplaceId)
          : taskBoardPaths.home,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Gagal menyimpan task.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState label="Memuat task…" />;
  }

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate(backTarget)}
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-suite-muted transition-colors hover:bg-suite-soft hover:text-suite-ink"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-bold tracking-tight text-suite-ink">
              {isRevision ? 'Revisi Task' : isEdit ? 'Edit Task' : 'Task Baru'}
            </h1>
            {revisionParentId != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                <RefreshCw size={11} />
                Revisi #{revisionParentId}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[13.5px] text-suite-muted">
            {isEdit
              ? 'Perbarui informasi dasar task. Penjelasan, links, file migrasi, dan catatan deploy diatur dari halaman detail.'
              : 'Catat task pengembangan baru beserta penjelasan dan catatan deploy.'}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-card border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] font-semibold text-rose-700 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="shrink-0 text-rose-500 hover:text-rose-700"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-5">
          <h2 className="mb-4 text-[13.5px] font-bold text-suite-ink">
            Informasi Dasar
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Judul Task</FieldLabel>
              <FieldInput
                accent="task"
                value={formData.title}
                onChange={(v) => setFormData((p) => ({ ...p, title: v }))}
                placeholder="mis. Fix login redirect loop"
              />
            </div>

            <div>
              <FieldLabel>Nama Branch</FieldLabel>
              <FieldInput
                accent="task"
                value={formData.branchName}
                onChange={(v) => setFormData((p) => ({ ...p, branchName: v }))}
                placeholder="mis. fix/login-redirect"
                className="font-money-mono"
              />
            </div>

            <div>
              <FieldLabel>Tipe</FieldLabel>
              <FieldSelect
                accent="task"
                value={formData.type}
                onChange={(v) => setFormData((p) => ({ ...p, type: v }))}
                options={TYPE_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <FieldSelect
                accent="task"
                value={formData.status}
                onChange={(v) => setFormData((p) => ({ ...p, status: v }))}
                options={STATUS_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel>Tempat Kerja</FieldLabel>
              <FieldSelect
                accent="task"
                value={String(
                  formData.workplaceId ?? getActiveWorkplaces()[0]?.id ?? '',
                )}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, workplaceId: Number(v) }))
                }
                options={workplaceOptions}
              />
            </div>

            {!isEdit ? (
              <div className="sm:col-span-2">
                <FieldLabel>File Migrasi (opsional)</FieldLabel>
              {(formData.migrationFiles || []).length === 0 ? (
                <p className="mb-2 text-[12.5px] text-suite-faint">
                  Belum ada file migrasi.
                </p>
              ) : (
                <div className="mb-2 space-y-2">
                  {(formData.migrationFiles || []).map((file, index) => (
                    <div key={index} className="flex gap-2">
                      <FieldInput
                        accent="task"
                        value={file}
                        onChange={(v) => updateMigrationFile(index, v)}
                        placeholder="mis. 20260925_create_users_table.ts"
                        className="font-money-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeMigrationFile(index)}
                        className={DELETE_BUTTON_CLASS}
                        aria-label="Hapus file migrasi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={addMigrationFile} className={ADD_BUTTON_CLASS}>
                <Plus size={14} />
                Tambah File Migrasi
              </button>
            </div>
            ) : null}
          </div>
        </Card>

        {!isEdit ? (
          <>
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-[13.5px] font-bold text-suite-ink">Links</h2>
            <button type="button" onClick={addLink} className={ADD_BUTTON_CLASS}>
              <Plus size={14} />
              Tambah Link
            </button>
          </div>

          {(formData.links || []).length === 0 ? (
            <p className="text-[12.5px] text-suite-faint">
              Belum ada link. Tambah link Discord, Notion, atau Merge Request.
            </p>
          ) : (
            <div className="space-y-3">
              {(formData.links || []).map((link, index) => (
                <div key={index} className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <div className="w-full sm:w-44">
                    <FieldSelect
                      accent="task"
                      value={link.type}
                      onChange={(v) => updateLink(index, 'type', v)}
                      options={LINK_TYPE_OPTIONS}
                    />
                  </div>
                  <FieldInput
                    accent="task"
                    type="url"
                    value={link.url}
                    onChange={(v) => updateLink(index, 'url', v)}
                    placeholder="https://…"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className={DELETE_BUTTON_CLASS}
                    aria-label="Hapus link"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-bold text-suite-ink">
              Penjelasan Task
            </h2>
            <button
              type="button"
              onClick={addDescription}
              className={ADD_BUTTON_CLASS}
            >
              <Plus size={14} />
              Tambah
            </button>
          </div>

          {(formData.descriptions || []).length === 0 ? (
            <p className="text-[12.5px] text-suite-faint">
              Belum ada penjelasan. Tambah penjelasan untuk task ini.
            </p>
          ) : (
            <div className="space-y-4">
              {(formData.descriptions || []).map((desc, index) => (
                <div
                  key={index}
                  className="rounded-card border border-suite-border bg-suite-soft/50 p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <FieldInput
                      accent="task"
                      value={desc.title}
                      onChange={(v) => updateDescription(index, 'title', v)}
                      placeholder="Judul penjelasan"
                    />
                    <button
                      type="button"
                      onClick={() => removeDescription(index)}
                      className={DELETE_BUTTON_CLASS}
                      aria-label="Hapus penjelasan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <RichTextEditor
                    content={desc.content}
                    onChange={(content) =>
                      updateDescription(index, 'content', content)
                    }
                    placeholder="Isi penjelasan…"
                    onImagePaste={handleImagePaste}
                    taskId={taskId}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[13.5px] font-bold text-suite-ink">
            Catatan Deploy
          </h2>
          <RichTextEditor
            content={formData.deployNotes || ''}
            onChange={(content) =>
              setFormData((p) => ({ ...p, deployNotes: content }))
            }
            placeholder="Catatan endpoint, perubahan config, langkah deploy…"
            onImagePaste={handleImagePaste}
            taskId={taskId}
          />
        </Card>
          </>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <div className="sm:w-32">
            <SecondaryButton
              onClick={() => navigate(backTarget)}
              disabled={saving}
            >
              Batal
            </SecondaryButton>
          </div>
          <div className="sm:w-44">
            <PrimaryButton
              accent="task"
              type="submit"
              disabled={saving || !formData.title.trim()}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Save size={16} />
                {saving ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Buat Task'}
              </span>
            </PrimaryButton>
          </div>
        </div>
      </form>
    </div>
  );
}
