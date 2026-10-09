export type TaskType = 'Bugfixing' | 'Feature' | 'Refactor';

export type EmploymentType =
  | 'Fulltime'
  | 'Freelance'
  | 'Part-time'
  | 'Contract'
  | 'Personal';

/**
 * Tempat kerja / kantor yang menaungi task.
 * Kontrak API-nya direncanakan di
 * `docs/requests/from-fe/pending/TASK-BOARD-WORKPLACES-API.md`.
 */
export interface Workplace {
  id: number;
  name: string;
  employment_type: EmploymentType;
  role: string | null;
  location: string | null;
  /** Kunci warna aksen (bukan hex) supaya class Tailwind tetap statis. */
  accent: string;
  started_at: string | null;
  ended_at: string | null;
  /** Tempat kerja bawaan untuk task lama yang belum punya kantor. */
  is_default: boolean;
  /** Terisi = diarsipkan (disembunyikan dari daftar aktif). */
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload form tempat kerja (camelCase FE, dikonversi saat kirim API). */
export interface WorkplaceFormData {
  name: string;
  employmentType: EmploymentType;
  role: string;
  location: string;
  accent: string;
  /** YYYY-MM-DD (dari input date). */
  startedAt: string;
  /** YYYY-MM-DD; kosong = masih berjalan. */
  endedAt: string;
}

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
  /** Posisi urutan manual; belum dikirim BE (lihat catatan API). */
  sort_order?: number;
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
  /**
   * Tempat kerja pemilik task. Belum dikirim BE sebelum endpoint workplace
   * rilis; FE memetakan task tanpa nilai ini ke tempat kerja default.
   */
  workplace_id?: number | null;
  /** Hanya ada di GET /tasks/:id dan GET /tasks/:id/history. */
  history?: TaskHistoryEntry[];
  /** Checklist todo; ada di GET /tasks/:id. */
  todos?: TaskTodo[];
  /**
   * Posisi urutan manual (0 = paling atas), di-scope per pemilik.
   * Dikirim BE setelah endpoint `PUT /tasks/reorder` rilis — sebelum itu
   * FE memakai cadangan localStorage. Lihat
   * `docs/requests/from-fe/pending/TASK-BOARD-ORDERING-API.md`.
   */
  sort_order?: number;
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
  /** Posisi urutan manual; belum dikirim BE (lihat catatan API). */
  sort_order?: number;
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
  /** Tempat kerja task; dikirim sebagai `workplace_id` saat BE siap. */
  workplaceId?: number | null;
  /** Catatan perubahan status; hanya dikirim saat ubah status (bukan field form). */
  notes?: string;
}

export interface TaskListQuery {
  type?: TaskType;
  status?: TaskStatus;
  search?: string;
}
