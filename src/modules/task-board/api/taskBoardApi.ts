import { apiFetch, apiFormFetch } from '@/shared/lib/apiClient';
import { buildQuery } from '@/shared/lib/apiQuery';
import type { Task, TaskFormData, TaskListQuery } from '../types';

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

  async get(id: string): Promise<Task | null> {
    try {
      return await apiFetch<Task>(`${TASKS_PATH}/${id}`);
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  },

  async create(data: TaskFormData): Promise<Task> {
    return apiFetch<Task>(TASKS_PATH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<TaskFormData>): Promise<Task | null> {
    try {
      return await apiFetch<Task>(`${TASKS_PATH}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      return null;
    }
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
