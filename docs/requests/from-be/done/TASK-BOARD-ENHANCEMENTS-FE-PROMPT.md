# Prompt FE — Enhancement Task Board (status "Merged", deskripsi, revisi, riwayat)

Salin blok di bawah ke chat AI / ticket FE.

Status BE: **live di server dev**, catatan deploy ke STB masih `pending` (`family-tree-api/deploy/releases/pending/2026-09-29-task-board-enhancements.md`). Kontrak resmi: `family-tree-api/docs/reference/TASK-BOARD-API.md`. Jangan mengarang path lain — `GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`, `GET /tasks/:id/history`, `GET /tasks/:id/revisions`, `POST /tasks/:id/images`.

Hasil audit FE (2026-09-29): modul `src/modules/task-board` sudah **setengah jalan** — status `Done` sudah dibuang, form deskripsi list + input migration files + modal status (dengan notes) + modal riwayat sudah ada, tapi **belum tersambung ke API**: halaman detail masih memakai dummy history/revisi, notes status dibuang, dan payload form mengirim `migrationFiles`/`parentTaskId` (camelCase) sementara BE hanya membaca `migration_files`/`parent_task_id` (snake_case) sehingga dua field itu **diabaikan tanpa error**. Rincian per file ada di bawah.

---

## Prompt

```
Kamu menyelesaikan integrasi enhancement Task Board di family-tree-fe (FamilyRoots).

Konteks BE sudah live:
- Status task sekarang hanya 'To-Do' | 'In Progress' | 'Merged'. 'Done' dihapus. Kalau FE masih mengirim 'Done', BE balas 422.
- GET /api/v1/tasks/:id sekarang mengembalikan descriptions (array { id, title, content }), migration_files (string[]),
  parent_task_id, parent_task (objek task atau null), revisions (array task anak), dan history
  (array { id, status, notes, changed_at }, terbaru dulu).
- Endpoint baru: GET /api/v1/tasks/:id/history dan GET /api/v1/tasks/:id/revisions.
- PUT /api/v1/tasks/:id menerima notes (alias statusNotes) yang disimpan di entri history saat status berubah.
- POST /api/v1/tasks: status opsional (default 'To-Do'), descriptions wajib minimal satu entri.

Larangan:
- Jangan mengarang endpoint, field, atau query baru. Pakai hanya yang ada di daftar di atas.
- Jangan pakai dummy/hardcode data history, revisi, atau migration files. Kalau BE belum mengirim, tampilkan kosong.
- Jangan menampilkan sukses palsu kalau request gagal; biarkan error dari apiFetch naik seperti modul lain.
- Bahasa UI: Indonesia. Nama field API: English.

Yang sudah ada di FE (jangan dirombak, cukup disambungkan):
- types.ts: TaskStatus tanpa 'Done', Task.descriptions, Task.migration_files, Task.parent_task_id, Task.parent_task, Task.revisions.
- components/TaskStatusUpdateModal.tsx: pilih status + input notes -> onConfirm(status, notes).
- components/TaskHistoryModal.tsx: modal riwayat (masih pakai tipe lokal TaskHistoryItem dengan field changedAt).
- pages/TaskFormPage.tsx: deskripsi list (tambah/hapus/edit), input migration files, deteksi revisi dari location.state.parentTaskId.
- pages/TaskDetailPage.tsx: kartu migration files, kartu revisi, tombol riwayat, tombol "buat revisi" (kirim state.parentTaskId), modal ubah status.
- components/TaskStatusBadge.tsx dan pages/TaskListPage.tsx: konfigurasi status tanpa 'Done'.
```

## Prompt — lanjutan (pekerjaan per file)

```
1. types.ts
   - Tambah `export interface TaskHistoryEntry { id: number; status: string; notes: string | null; changed_at: string }`.
   - Tambah `history?: TaskHistoryEntry[]` di `Task` (BE mengirimnya di GET /tasks/:id, tidak di list).
   - TaskFormData tetap camelCase (internal FE), tidak perlu diubah.

2. api/taskBoardApi.ts
   - Tambah satu fungsi mapping payload supaya batas API tetap snake_case:

     function toApiPayload(data: Partial<TaskFormData>) {
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
       if (data.notes !== undefined) payload.notes = data.notes;
       return payload;
     }

   - Pakai toApiPayload di create() dan update(). WAJIB: migration_files dan parent_task_id snake_case,
     kalau tidak BE mengabaikannya tanpa error.
   - update() menerima Partial<TaskFormData> & { notes?: string } supaya notes bisa dikirim dari modal ubah status.
   - Tambah history(id: string): Promise<TaskHistoryEntry[]> -> GET /tasks/${id}/history.
   - Tambah revisions(id: string): Promise<Task[]> -> GET /tasks/${id}/revisions.

3. pages/TaskDetailPage.tsx
   - Hapus dummyHistory, dummyParentTask, dummyRevisions, dan simulasi taskId === '1' / taskId === '2'.
   - Hapus fallback data.migration_file dan hardcode ['20240925_create_users_table.ts', '20240926_add_roles_table.ts'].
     Pakai data.migration_files ?? [] saja.
   - Pakai langsung data.parent_task, data.revisions, data.history dari GET /tasks/:id.
     Modal riwayat diisi task.history ?? [] (urutan terbaru dulu sudah dari BE, jangan di-sort ulang).
   - handleStatusChange(newStatus, notes) harus mengirim notes:
     taskBoardApi.update(taskId, { status: newStatus, notes }) lalu set state dari respons.
   - Tombol "buat revisi" hanya tampil saat task.status === 'Merged' (BE menolak 422 kalau induk belum Merged),
     dan tetap kirim state={{ parentTaskId: task.id }}.
   - Kalau task punya parent_task, tampilkan tautan ke detail induk (id + judul).

4. components/TaskHistoryModal.tsx
   - Pakai TaskHistoryEntry dari ../types (field changed_at), hapus tipe lokal TaskHistoryItem.
   - Hapus case 'Done' di getStatusIcon (status itu sudah tidak ada).
   - Catatan kosong ditampilkan sebagai tanpa catatan, bukan string "undefined".

5. pages/TaskFormPage.tsx
   - Default revisi: migrationFiles: [] (jangan isi file dummy '20240925_create_users_table.ts').
   - Saat edit, kirim descriptions lengkap: entri dengan id = update, tanpa id = tambah,
     entri yang dibuang dari list = dihapus BE. Jangan kirim array kosong ([] -> 422).
   - Task biasa: kirim parentTaskId: null supaya relasi revisi ikut dibersihkan saat edit.
   - Status default create tetap 'To-Do' (boleh tidak dikirim, BE default 'To-Do').

6. Opsional tapi berguna
   - Badge jumlah revisi + jumlah migration files di kartu TaskListPage (datanya sudah ada di list).
   - Chip "Revisi dari #<id>" di TaskListPage kalau parent_task_id tidak null.

Setelah selesai: jalankan typecheck/lint FE, lalu uji manual dengan daftar di bagian "Checklist uji manual" dokumen ini.
```

---

## Hasil audit FE (2026-09-29)

| Bagian | Status |
|---|---|
| `types.ts` — status tanpa `Done`, `descriptions`, `migration_files`, `parent_task_id`, `parent_task`, `revisions` | ✅ sudah |
| `components/TaskStatusUpdateModal.tsx` — pilih status + input notes | ✅ sudah |
| `components/TaskHistoryModal.tsx` — modal riwayat | ⚠️ ada, tapi tipe lokal (`changedAt`) dan masih ada `case 'Done'` |
| `pages/TaskFormPage.tsx` — form deskripsi list, migration files, deteksi revisi | ⚠️ ada, tapi payload kirim `migrationFiles`/`parentTaskId` (camelCase) dan revisi baru diisi file dummy |
| `pages/TaskDetailPage.tsx` — UI migration files, revisi, riwayat, ubah status | ⚠️ UI ada, data masih dummy (`dummyHistory`, `dummyParentTask`, `dummyRevisions`, fallback `data.migration_file`) |
| `pages/TaskDetailPage.tsx` — `handleStatusChange` kirim `notes` | ❌ notes dibuang (`update(taskId, { status: newStatus })`) |
| `api/taskBoardApi.ts` — payload snake_case | ❌ belum (`migrationFiles`, `parentTaskId`) → diabaikan BE |
| `api/taskBoardApi.ts` — `history()` / `revisions()` | ❌ belum ada |
| `types.ts` — `TaskHistoryEntry` + `Task.history` | ❌ belum ada |
| `components/TaskStatusBadge.tsx`, `pages/TaskListPage.tsx` — status tanpa `Done` | ✅ sudah |

Catatan: perubahan ini masih ada di working tree FE (belum di-commit) saat audit dilakukan.

## Kontrak penting (ringkas, dari BE)

| Hal | Aturan |
|---|---|
| Status | `To-Do`, `In Progress`, `Merged`. Kirim `Done` → `422` "sudah tidak dipakai" |
| `descriptions` | Array `{ id?, title, content }`. Wajib minimal 1 saat create. Saat update: `id` = update, tanpa `id` = tambah, hilang dari list = dihapus, `[]` → `422` |
| `description` | Field lama. BE masih mengirimnya (isi deskripsi pertama) tapi jangan dipakai untuk menulis lagi |
| `migration_files` | Nama file saja (tanpa `/`), ekstensi `.ts` / `.js` / `.sql`, maksimal 50, duplikat dibuang BE |
| `parent_task_id` | Revisi hanya boleh dibuat dari task induk berstatus `Merged`, milik user yang sama. Induk belum Merged → `422`. `null` = lepas relasi |
| `history` | Urut terbaru dulu, `changed_at` dalam ISO. Hanya ada di `GET /tasks/:id` dan `GET /tasks/:id/history` |
| `notes` | Dikirim di POST/PUT, tersimpan di entri history saat status berubah. Alias: `statusNotes` |
| Create tanpa status | Default `To-Do` |
| Hapus task induk | Revisi tidak terhapus, `parent_task_id`-nya jadi `null` |
| Scope | Semua endpoint per pemilik task; list `GET /tasks` tidak memuat `history`/`revisions` |

Contoh respons `GET /api/v1/tasks/:id` (potongan):

```json
{
  "data": {
    "id": 12,
    "status": "In Progress",
    "descriptions": [{ "id": 3, "title": "Konteks", "content": "<p>…</p>" }],
    "migration_files": ["20260929100000_alter_task_board_enhancements.ts"],
    "parent_task_id": null,
    "parent_task": null,
    "revisions": [],
    "history": [
      { "id": 9, "status": "In Progress", "notes": "MR sudah dibuka", "changed_at": "2026-09-29T12:30:00.000Z" }
    ]
  }
}
```

## Checklist uji manual (setelah wiring selesai)

1. Create task tanpa `status` → tersimpan `To-Do`, detail menampilkan 1 entri riwayat.
2. Create task dengan 2 deskripsi → keduanya muncul terpisah, urut sesuai input.
3. Edit task: ubah judul deskripsi pertama, hapus yang kedua, tambah satu baru → hasil di detail sesuai.
4. Ubah status lewat modal + isi catatan → riwayat bertambah, catatan tampil di modal riwayat.
5. Isi migration files `20260929100000_alter_task_board_enhancements.ts` → muncul di kartu "File Migrasi" setelah reload (bukti payload snake_case jalan).
6. Set status ke `Merged`, lalu tombol "buat revisi" → form terisi info revisi, `migration_files` kosong, simpan → detail revisi menampilkan tautan ke induk.
7. Buka task induk → kartu "Revisi" menampilkan anak yang baru dibuat.
8. Task biasa (tanpa revisi): kartu revisi dan `parent_task` tidak muncul, bukan dummy.
9. Kirim migration file berisi `/` (mis. `src/db/x.ts`) → muncul pesan error 422 dari BE, bukan sukses palsu.
10. Coba buat revisi dari task yang masih `To-Do` → pesan error 422 "Revisi hanya boleh dibuat dari task berstatus Merged".


## Status implementasi FE — selesai (2026-09-29)

Semua poin di **Prompt** dan **Prompt — lanjutan** sudah dikerjakan. Ringkasan perubahan:

| File | Yang dikerjakan |
|---|---|
| `types.ts` | Tambah `TaskHistoryEntry` (`changed_at`), `Task.history?`, `Task.description` (legacy, baca saja), `TaskFormData.notes?` |
| `api/taskBoardApi.ts` | Tambah `toApiPayload()` (camelCase FE → snake_case BE: `migration_files`, `parent_task_id`, `notes`), `history()`, `revisions()`; `get()`/`update()` kini melempar error supaya pesan 422 BE tampil, bukan sukses palsu |
| `pages/TaskDetailPage.tsx` | Hapus `dummyHistory`/`dummyParentTask`/`dummyRevisions`/simulasi `taskId==='1'|'2'`/fallback `migration_file`; pakai `data.parent_task`, `data.revisions`, `data.history`; tombol Riwayat memuat `GET /tasks/:id/history`; `handleStatusChange` mengirim `notes`; banner error bisa ditutup |
| `pages/TaskFormPage.tsx` | Default `migrationFiles: []` (file dummy dihapus), buang baris kosong sebelum submit, banner error 422 dari BE, chip revisi juga muncul saat edit task yang punya induk |
| `components/TaskHistoryModal.tsx` | Pakai `TaskHistoryEntry` dari `../types` (bukan tipe lokal `changedAt`), hapus `case 'Done'`, tambah prop `loading`, catatan kosong = "Tanpa catatan" |
| `pages/TaskListPage.tsx` | Chip `Revisi dari #<id>` + badge jumlah file migrasi |

Validasi yang dijalankan:

- `npx tsc -b` → bersih (exit 0).
- `npm run build` → sukses; tidak ada lagi string dummy `20240925_create_users_table` di bundle selain placeholder input (misal `20240925_...` di `placeholder`), `dummyHistory`/`dummyRevisions` hilang.
- `npx eslint 'src/modules/task-board/**'` → tidak ada error baru dari perubahan ini; sisa 1 error pre-existing di `routes.tsx` (`react-refresh/only-export-components`, file tidak diubah) + 3 warning `react-hooks/exhaustive-deps` pola lama.
- **E2E sungguhan**: chunk hasil build `dist/assets/taskBoardApi-*.js` dijalankan di Node terhadap BE hidup (`localhost:3000`): create task dengan `migrationFiles` (tersimpan sebagai `migration_files` ✔), update status + `notes` → masuk history ✔, `GET /tasks/:id/history` ✔, buat revisi dari task `Merged` + `GET /tasks/:id/revisions` ✔, `status: "Done"` ditolak 422 dengan pesan BE ✔, `migration_files` berupa path ditolak 422 ✔, `GET /tasks` mengembalikan `descriptions`/`migration_files`/`parent_task_id` ✔. Data uji dihapus kembali.

Sisa sisa (belum dikerjakan, opsional):

- Badge jumlah **revisi** di kartu list — data `revisions` tidak dikirim oleh `GET /tasks` (hanya di detail), jadi tidak bisa ditampilkan tanpa request tambahan per task.
- Pagination `GET /tasks/:id/history` (belum ada di BE).

