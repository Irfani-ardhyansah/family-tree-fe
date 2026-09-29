# Hasil implementasi FE — riwayat aktivitas Task Board

Salinan prompt dari BE (`family-tree-api/docs/requests/to-fe/pending/TASK-BOARD-ACTIVITY-HISTORY-FE-PROMPT.md`) beserta catatan implementasi dan hasil validasi E2E di bawah.

Status FE: **sudah diimplementasi (2026-09-29)** — timeline history membedakan 6 jenis aksi, entri `revision_created` di induk menautkan ke detail child. Prompt asli BE dipertahankan apa adanya setelah bagian ini.

---

## Catatan implementasi (2026-09-29)

Diubah di `family-tree-fe`:

- `src/modules/task-board/types.ts` — tambah `TaskHistoryAction` + field `action`, `related_task_id`, `related_task_title` di `TaskHistoryEntry`.
- `src/modules/task-board/api/taskBoardApi.ts` — `history()` menormalkan field baru (`action` default `status_changed`) supaya aman kalau BE lama yang menjawab.
- `src/modules/task-board/components/TaskHistoryModal.tsx` — timeline per aksi (label + ikon): `created` ➕, `status_changed` 🔁, `description_added` 📝, `description_updated` ✏️, `description_removed` 🗑️, `revision_created` 🌿; badge `Label · status`; teks utama per aksi; `notes` judul deskripsi tidak lagi disalahartikan sebagai catatan status. Entri `revision_created` di induk merender link `Lihat detail revisi →` ke `taskBoardPaths.detail(related_task_id)`; kalau child sudah dihapus (`related_task_id: null`) tampil teks "Task revisi sudah dihapus". `data-testid="history-text-{id}"` / `history-link-{id}` untuk verifikasi E2E.

Tidak diubah: `TaskDetailPage.tsx` (sudah memanggil endpoint + modal history), routes (`/task-board/:taskId` sudah jadi target link), API lain.

## Hasil validasi E2E (2026-09-29)

Browser sungguhan (Chrome headless via puppeteer-core) melawan FE dev (`vite`, port 5199) + BE lokal fresh-build + MySQL lokal; data uji dibuat via API lalu dihapus lagi (DB bersih, 0 sisa):

1. Login kode `MR170845` → buka `/task-board/{induk}` → tombol "Riwayat" membuka modal.
2. Teks `Revisi dibuat: "FE verify revisi"` tampil untuk entri `revision_created` di history induk.
3. Teks `Deskripsi ditambahkan: "Acceptance"` tampil untuk entri `description_added`.
4. Link `Lihat detail revisi →` ber-href `/task-board/{child}`; diklik → pindah ke halaman detail child (heading = judul child).
5. Tidak ada `pageerror` di console browser.
6. `npx tsc -b` FE lolos; `npm test` BE 201/201 lolos.

---

## Prompt asli dari BE

