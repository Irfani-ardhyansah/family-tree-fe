import { apiFetch, apiFormFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type { Task, TaskFormData, TaskHistoryEntry, TaskListQuery, TaskTodo, TaskTodoInput, TaskTodoPatch } from '../types';

/**
 * Path relatif — di-prefix `BASE` (`VITE_API_BASE_URL`) di shared/lib/apiClient,
 * jadi otomatis ikut base URL backend yang sama dengan modul lain
 * (money-track, family-core, admin) → `http://localhost:3000/api/v1` saat dev.
 */
const TASKS_PATH = '/tasks';

/** BE boleh balas array langsung atau terbungkus `{ items }`. */
function toTaskList(data: Task[] | { items: Task[] }): Task[] {
  return Array.isArray(data) ? data : data?.items ?? [];
}

/**
 * Batas API memakai snake_case untuk `migration_files` dan `parent_task_id`
 * (BE mengabaikan nama camelCase tanpa error). Form internal FE tetap camelCase,
 * jadi semua penulisan lewat `create()`/`update()` harus melewati mapping ini.
 */
function toApiPayload(data: Partial<TaskFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.type !== undefined) payload.type = data.type;
  if (data.title !== undefined) payload.title = data.title;
  if (data.branchName !== undefined) payload.branchName = data.branchName;
  if (data.status !== undefined) payload.status = data.status;
  if (data.links !== undefined) payload.links = data.links;
  if (data.descriptions !== undefined) payload.descriptions = data.descriptions;
  if (data.deployNotes !== undefined) payload.deployNotes = data.deployNotes;
  if (data.migrationFiles !== undefined) payload.migration_files = data.migrationFiles;
  if (data.parentTaskId !== undefined) payload.parent_task_id = data.parentTaskId;
  if (data.workplaceId !== undefined) payload.workplace_id = data.workplaceId;
  if (data.notes !== undefined) payload.notes = data.notes;

  return payload;
}

export const taskBoardApi = {
  async list(query?: TaskListQuery): Promise<Task[]> {
    const search = buildQuery({
      type: query?.type,
      status: query?.status,
      search: query?.search,
    });

    const data = await apiFetch<Task[] | { items: Task[] }>(
      `${TASKS_PATH}${search}`,
    );
    return toTaskList(data);
  },

  /**
   * Simpan urutan manual task sekaligus (bulk).
   * Endpoint `PUT /tasks/reorder` direncanakan di
   * `docs/requests/from-fe/pending/TASK-BOARD-ORDERING-API.md`; sebelum BE
   * rilis panggilan ini gagal dan pemanggil memakai cadangan lokal.
   */
  async reorder(ids: number[]): Promise<Task[]> {
    const data = await apiFetch<Task[] | { items: Task[] }>(
      `${TASKS_PATH}/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify({ order: ids }),
      },
    );
    return toTaskList(data);
  },

  /** Throws ApiClientError (404 dari BE = "Task tidak ditemukan."). */
  async get(id: string): Promise<Task> {
    return apiFetch<Task>(`${TASKS_PATH}/${id}`);
  },

  async create(data: TaskFormData): Promise<Task> {
    return apiFetch<Task>(TASKS_PATH, {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    });
  },

  /** Throws ApiClientError (mis. 422 dari validasi BE) supaya pemanggil bisa menampilkannya. */
  async update(id: string, data: Partial<TaskFormData>): Promise<Task> {
    return apiFetch<Task>(`${TASKS_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    });
  },

  async delete(id: string): Promise<boolean> {
    try {
      await apiFetch<{ deleted?: boolean }>(`${TASKS_PATH}/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  },

  /** Riwayat aksi (status, deskripsi, revisi), terbaru lebih dulu (BE yang mengurutkan). */
  async history(id: string): Promise<TaskHistoryEntry[]> {
    const items = await apiFetch<TaskHistoryEntry[]>(`${TASKS_PATH}/${id}/history`);
    return items.map((item) => ({
      ...item,
      // BE lama belum mengirim field ini — samakan ke null supaya render aman.
      action: item.action ?? 'status_changed',
      related_task_id: item.related_task_id ?? null,
      related_task_title: item.related_task_title ?? null,
    }));
  },

  /** Daftar revisi (task anak) dari sebuah task. */
  async revisions(id: string): Promise<Task[]> {
    return apiFetch<Task[]>(`${TASKS_PATH}/${id}/revisions`);
  },

  /* ------------------------------ Todos ------------------------------ */

  async listTodos(id: string): Promise<TaskTodo[]> {
    return apiFetch<TaskTodo[]>(`${TASKS_PATH}/${id}/todos`);
  },

  async createTodo(id: string, data: TaskTodoInput): Promise<TaskTodo> {
    return apiFetch<TaskTodo>(`${TASKS_PATH}/${id}/todos`, {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      }),
    });
  },

  async updateTodo(
    id: string,
    todoId: number,
    data: TaskTodoPatch,
  ): Promise<TaskTodo> {
    return apiFetch<TaskTodo>(`${TASKS_PATH}/${id}/todos/${todoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteTodo(id: string, todoId: number): Promise<boolean> {
    try {
      await apiFetch<{ deleted?: boolean }>(
        `${TASKS_PATH}/${id}/todos/${todoId}`,
        { method: 'DELETE' },
      );
      return true;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      return false;
    }
  },

  /**
   * Simpan urutan penjelasan task. Endpoint `PUT /tasks/:id/descriptions/reorder`
   * direncanakan di `docs/requests/from-fe/pending/TASK-BOARD-ITEM-ORDERING-API.md`;
   * sebelum live, pemanggil memakai cadangan lokal.
   */
  async reorderDescriptions(id: string, ids: number[]): Promise<Task> {
    return apiFetch<Task>(`${TASKS_PATH}/${id}/descriptions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ order: ids }),
    });
  },

  /**
   * Simpan urutan todo task. Endpoint `PUT /tasks/:id/todos/reorder`
   * direncanakan di catatan API yang sama; sebelum live pakai cadangan lokal.
   */
  async reorderTodos(id: string, ids: number[]): Promise<TaskTodo[]> {
    return apiFetch<TaskTodo[]>(`${TASKS_PATH}/${id}/todos/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ order: ids }),
    });
  },

  async uploadImage(taskId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    // apiFormFetch tidak set Content-Type — browser yang isi boundary multipart.
    const result = await apiFormFetch<{ url: string }>(
      `${TASKS_PATH}/${taskId}/images`,
      formData,
    );
    return result.url;
  },
};
