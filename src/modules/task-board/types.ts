export type TaskType = 'Bugfixing' | 'Feature' | 'Refactor';

export type TaskStatus = 'To-Do' | 'In Progress' | 'Merged';

export type LinkType = 'discord' | 'notion' | 'mr';

export interface TaskLink {
  id?: number;
  type: LinkType;
  url: string;
}

export interface TaskImage {
  id?: number;
  url: string;
}

export interface TaskDescription {
  id?: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export type TaskHistoryAction =
  | 'created'
  | 'status_changed'
  | 'description_added'
  | 'description_updated'
  | 'description_removed'
  | 'revision_created';

/**
 * Satu entri riwayat aktivitas task (dari BE, field `changed_at`).
 * `notes`: catatan user untuk `created`/`status_changed`; judul deskripsi
 * untuk `description_*`; judul task anak untuk `revision_created`.
 * `related_task_id` hanya terisi di `revision_created` (link ke detail child;
 * `null` kalau anak sudah dihapus).
 */
export interface TaskHistoryEntry {
  id: number;
  action: TaskHistoryAction;
  status: string;
  notes: string | null;
  related_task_id: number | null;
  related_task_title: string | null;
  changed_at: string;
}

export interface Task {
  id: number;
  person_id: number;
  type: TaskType;
  title: string;
  branch_name: string;
  status: TaskStatus;
  descriptions: TaskDescription[];
  /** Field lama dari BE (isi deskripsi pertama). Baca saja, jangan dikirim lagi. */
  description: string | null;
  deploy_notes: string | null;
  migration_files: string[];
  links: TaskLink[];
  images: TaskImage[];
  parent_task_id: number | null;
  parent_task?: Task | null;
  revisions?: Task[];
  /** Hanya ada di GET /tasks/:id dan GET /tasks/:id/history. */
  history?: TaskHistoryEntry[];
  /** Checklist todo; ada di GET /tasks/:id. */
  todos?: TaskTodo[];
  created_at: string;
  updated_at: string;
}

/** Checklist (todo) di dalam task. 1 task → banyak todo. */
export interface TaskTodo {
  id: number;
  task_id: number;
  title: string;
  /** HTML dari editor (boleh kosong). */
  description: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskTodoInput {
  title: string;
  description?: string;
}

export interface TaskTodoPatch {
  title?: string;
  description?: string;
  is_done?: boolean;
}

export interface TaskFormData {
  type: TaskType;
  title: string;
  branchName: string;
  status: TaskStatus;
  links?: TaskLink[];
  descriptions?: TaskDescription[];
  deployNotes?: string;
  migrationFiles?: string[];
  parentTaskId?: number | null;
  /** Catatan perubahan status; hanya dikirim saat ubah status (bukan field form). */
  notes?: string;
}

export interface TaskListQuery {
  type?: TaskType;
  status?: TaskStatus;
  search?: string;
}
