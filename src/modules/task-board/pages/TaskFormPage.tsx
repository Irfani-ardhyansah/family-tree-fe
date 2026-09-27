import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'react-feather';
import { taskBoardApi } from '../api/taskBoardApi';
import { RichTextEditor } from '../components/RichTextEditor';
import type { TaskFormData, TaskLink, TaskType, TaskStatus } from '../types';
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
  { value: 'Done', label: 'Done' },
];

const LINK_TYPE_OPTIONS: { value: TaskLink['type']; label: string }[] = [
  { value: 'discord', label: 'Discord' },
  { value: 'notion', label: 'Notion' },
  { value: 'mr', label: 'Merge Request' },
];

export function TaskFormPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const isEdit = !!taskId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    type: 'Feature',
    title: '',
    branchName: '',
    status: 'To-Do',
    links: [],
    description: '',
    deployNotes: '',
  });

  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const task = await taskBoardApi.get(taskId);
      if (task) {
        setFormData({
          type: task.type,
          title: task.title,
          branchName: task.branch_name,
          status: task.status,
          links: task.links,
          description: task.description || '',
          deployNotes: task.deploy_notes || '',
        });
      }
    } catch (error) {
      console.error('Failed to load task:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const apiData = {
        type: formData.type,
        title: formData.title,
        branchName: formData.branchName,
        status: formData.status,
        links: formData.links,
        description: formData.description,
        deployNotes: formData.deployNotes,
      };

      if (isEdit && taskId) {
        await taskBoardApi.update(taskId, apiData);
      } else {
        await taskBoardApi.create(apiData);
      }
      navigate(taskBoardPaths.home);
    } catch (error) {
      console.error('Failed to save task:', error);
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-suite-ink">
            {isEdit ? 'Edit Task' : 'Task Baru'}
          </h1>
          <p className="mt-1 text-sm text-suite-muted">
            {isEdit ? 'Update task details' : 'Create a new development task'}
          </p>
        </div>
      </div>

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

        {/* Description */}
        <div className="rounded-xl border border-suite-border bg-suite-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-suite-ink">
            Deskripsi
          </h2>
          <RichTextEditor
            content={formData.description || ''}
            onChange={(content) =>
              setFormData({ ...formData, description: content })
            }
            placeholder="Deskripsikan task ini... (paste gambar untuk upload)"
            onImagePaste={handleImagePaste}
            taskId={taskId}
          />
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
