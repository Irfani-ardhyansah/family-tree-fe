import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, RefreshCw } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { RichTextEditor } from '../components/RichTextEditor';
import type { TaskFormData, TaskLink, TaskType, TaskStatus, TaskDescription } from '../types';
import { taskBoardPaths } from '@/shared/routes';

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

export function TaskFormPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const location = useLocation();
  const isEdit = !!taskId;
  const parentTaskId = location.state?.parentTaskId;
  const isRevision = !!parentTaskId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    type: 'Feature',
    title: '',
    branchName: '',
    status: 'To-Do',
    links: [],
    descriptions: [{ title: 'Deskripsi', content: '' }],
    deployNotes: '',
    // File migration diisi manual oleh user (jangan ada nilai dummy).
    migrationFiles: [],
    parentTaskId: parentTaskId || null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** ID induk: dari state navigasi (task baru) atau dari data task (edit). */
  const revisionParentId: number | null =
    (typeof parentTaskId === 'number' ? parentTaskId : null) ??
    formData.parentTaskId ??
    null;

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
        descriptions: task.descriptions && task.descriptions.length > 0
          ? task.descriptions
          : [{ title: 'Deskripsi', content: task.description || '' }],
        deployNotes: task.deploy_notes || '',
        migrationFiles: task.migration_files || [],
        parentTaskId: task.parent_task_id || null,
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
    // For new tasks, we don't have an ID yet, so we'll return a mock URL
    // In production, you'd need to handle this differently
    const tempId = taskId || 'temp';
    return await taskBoardApi.uploadImage(tempId, file);
  };

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...(formData.links ?? []), { type: 'discord', url: '' }],
    });
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      links: (formData.links ?? []).filter((_, i) => i !== index),
    });
  };

  const updateLink = (index: number, field: keyof TaskLink, value: string) => {
    const newLinks = [...(formData.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, links: newLinks });
  };

  const addDescription = () => {
    setFormData({
      ...formData,
      descriptions: [...(formData.descriptions || []), { title: '', content: '' }],
    });
  };

  const removeDescription = (index: number) => {
    const newDescriptions = (formData.descriptions || []).filter((_, i) => i !== index);
    setFormData({ ...formData, descriptions: newDescriptions });
  };

  const updateDescription = (index: number, field: keyof TaskDescription, value: string) => {
    const newDescriptions = [...(formData.descriptions || [])];
    newDescriptions[index] = { ...newDescriptions[index], [field]: value };
    setFormData({ ...formData, descriptions: newDescriptions });
  };

  const addMigrationFile = () => {
    setFormData({
      ...formData,
      migrationFiles: [...(formData.migrationFiles || []), ''],
    });
  };

  const removeMigrationFile = (index: number) => {
    const newFiles = (formData.migrationFiles || []).filter((_, i) => i !== index);
    setFormData({ ...formData, migrationFiles: newFiles });
  };

  const updateMigrationFile = (index: number, value: string) => {
    const newFiles = [...(formData.migrationFiles || [])];
    newFiles[index] = value;
    setFormData({ ...formData, migrationFiles: newFiles });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Buang baris yang masih kosong supaya tidak dikirim ke BE (422).
    const descriptions = (formData.descriptions ?? [])
      .map((d) => ({ ...d, title: d.title.trim(), content: d.content.trim() }))
      .filter((d) => d.title !== '' || d.content !== '');
    const links = (formData.links ?? []).filter((l) => l.url.trim() !== '');
    const migrationFiles = (formData.migrationFiles ?? []).map((f) => f.trim()).filter((f) => f !== '');

    if (descriptions.length === 0) {
      setErrorMessage('Minimal satu deskripsi wajib diisi.');
      return;
    }
    if (descriptions.some((d) => !d.title || !d.content)) {
      setErrorMessage('Setiap deskripsi butuh judul dan isi yang tidak kosong.');
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
      };

      if (isEdit && taskId) {
        await taskBoardApi.update(taskId, apiData);
      } else {
        await taskBoardApi.create(apiData);
      }
      navigate(taskBoardPaths.home);
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-suite-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(taskBoardPaths.home)}
          className="rounded-xl p-2 text-suite-muted hover:bg-suite-soft"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
              {isRevision ? 'Revisi Task' : isEdit ? 'Edit Task' : 'Task Baru'}
            </h1>
            {revisionParentId != null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <RefreshCw size={12} />
                Revisi
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-suite-muted">
            {revisionParentId != null
              ? `Revisi dari task #${revisionParentId}`
              : isEdit
                ? 'Update task details'
                : 'Create a new development task'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-suite-border bg-suite-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-suite-ink">
            Informasi Dasar
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-suite-faint">
                Judul Task
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g., Fix login redirect loop"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-suite-faint">
                Nama Branch
              </label>
              <input
                type="text"
                required
                value={formData.branchName}
                onChange={(e) =>
                  setFormData({ ...formData, branchName: e.target.value })
                }
                className="w-full rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g., fix/login-redirect"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-suite-faint">
                Tipe
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as TaskType })
                }
                className="w-full rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-suite-faint">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as TaskStatus,
                  })
                }
                className="w-full rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-suite-faint">
                File Migrasi <span className="font-normal text-suite-muted">(opsional)</span>
              </label>
              <div className="space-y-2">
                {(formData.migrationFiles || []).length === 0 ? (
                  <p className="text-sm text-suite-muted">
                    Belum ada file migrasi. Tambah file migrasi jika diperlukan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(formData.migrationFiles || []).map((file, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={file}
                          onChange={(e) => updateMigrationFile(index, e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          placeholder="e.g., 20240925_create_users_table.ts"
                        />
                        <button
                          type="button"
                          onClick={() => removeMigrationFile(index)}
                          className="shrink-0 rounded-lg p-2.5 text-suite-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={addMigrationFile}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950/80"
                >
                  <Plus size={14} />
                  Tambah File Migrasi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="rounded-xl border border-suite-border bg-suite-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-suite-ink">Links</h2>
            <button
              type="button"
              onClick={addLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950/80"
            >
              <Plus size={14} />
              Tambah Link
            </button>
          </div>

          {(formData.links || []).length === 0 ? (
            <p className="text-sm text-suite-muted">
              Belum ada link. Tambah link Discord, Notion, atau MR.
            </p>
          ) : (
            <div className="space-y-3">
              {(formData.links || []).map((link, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={link.type}
                    onChange={(e) =>
                      updateLink(index, 'type', e.target.value)
                    }
                    className="shrink-0 rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {LINK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) =>
                      updateLink(index, 'url', e.target.value)
                    }
                    className="min-w-0 flex-1 rounded-lg border border-suite-border bg-suite-bg py-2.5 px-3 text-sm text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="shrink-0 rounded-lg p-2.5 text-suite-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Descriptions */}
        <div className="rounded-xl border border-suite-border bg-suite-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-suite-ink">Deskripsi</h2>
            <button
              type="button"
              onClick={addDescription}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950/80"
            >
              <Plus size={14} />
              Tambah Deskripsi
            </button>
          </div>

          {(formData.descriptions || []).length === 0 ? (
            <p className="text-sm text-suite-muted">
              Belum ada deskripsi. Tambah deskripsi untuk task ini.
            </p>
          ) : (
            <div className="space-y-4">
              {(formData.descriptions || []).map((desc, index) => (
                <div key={index} className="rounded-lg border border-suite-border bg-suite-soft p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={desc.title}
                      onChange={(e) => updateDescription(index, 'title', e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-suite-border bg-suite-bg py-2 px-3 text-sm font-semibold text-suite-ink placeholder:text-suite-faint focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="Judul deskripsi"
                    />
                    <button
                      type="button"
                      onClick={() => removeDescription(index)}
                      className="shrink-0 rounded-lg p-2 text-suite-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <RichTextEditor
                    content={desc.content}
                    onChange={(content) => updateDescription(index, 'content', content)}
                    placeholder="Isi deskripsi..."
                    onImagePaste={handleImagePaste}
                    taskId={taskId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deploy Notes */}
        <div className="rounded-xl border border-suite-border bg-suite-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-suite-ink">
            Catatan Deploy
          </h2>
          <RichTextEditor
            content={formData.deployNotes || ''}
            onChange={(content) =>
              setFormData({ ...formData, deployNotes: content })
            }
            placeholder="Catatan endpoint, perubahan config, dll..."
            onImagePaste={handleImagePaste}
            taskId={taskId}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(taskBoardPaths.home)}
            className="rounded-xl border border-suite-border bg-suite-surface px-5 py-2.5 text-sm font-semibold text-suite-ink hover:bg-suite-soft"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
