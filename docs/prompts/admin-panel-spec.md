# Admin Panel — Family Ecosystem App

Dokumen ini berisi spesifikasi awal fitur admin panel untuk keperluan pembuatan UI (FE). Fokus dokumen: struktur halaman, komponen, dan field yang dibutuhkan di tiap fitur. Detail API/schema menyusul.

---

## 1. RBAC Modul (by Umur)

**Tujuan:** Mengatur modul apa saja yang bisa diakses berdasarkan rentang umur anggota keluarga.

**Halaman:** `Admin > RBAC Modul`

**Komponen UI:**
- Tabel daftar modul (Family-roots, Money-track, dst) dengan kolom:
  - Nama modul
  - Rentang umur minimum (input number)
  - Rentang umur maksimum (input number, optional/nullable = tanpa batas atas)
  - Status aktif rule (toggle)
- Tombol "Tambah Rule Umur" per modul (satu modul bisa punya lebih dari satu rule/rentang, misal beda rule untuk 0-12 dan 13-17)
- Modal/form tambah-edit rule: pilih modul, umur min, umur max, keterangan (opsional)

**Catatan untuk FE:**
- Siapkan state untuk kondisi "tanpa batas atas" (misal umur max dikosongkan = infinity)
- Validasi FE: umur min tidak boleh lebih besar dari umur max

---

## 2. Status Modul (On/Off)

**Tujuan:** Admin bisa menyalakan/mematikan modul tertentu secara global.

**Halaman:** `Admin > Status Modul`

**Komponen UI:**
- List/grid card per modul, masing-masing menampilkan:
  - Nama modul + icon
  - Toggle switch (on/off)
  - Deskripsi singkat modul
  - Badge status terakhir diubah (misal "diubah 2 jam lalu oleh Admin X")
- Konfirmasi modal saat toggle off ("Modul ini akan tidak bisa diakses oleh semua user, lanjutkan?")

**Catatan untuk FE:**
- Perubahan status modul ini akan memicu user lain otomatis logout/re-fetch permission saat refresh token — tidak perlu di-handle di FE admin panel ini, tapi siapkan optimistic UI + loading state saat toggle karena ada proses di belakang layar (versioning).

---

## 3. Audit Log

**Tujuan:** Mencatat aktivitas admin/user penting untuk transparansi & keamanan data keluarga.

**Halaman:** `Admin > Audit Log`

**Komponen UI:**
- Tabel log dengan kolom:
  - Waktu (timestamp)
  - User yang melakukan aksi
  - Modul terkait
  - Jenis aksi (create/update/delete/login/toggle module/dll — bisa pakai badge warna beda per jenis)
  - Detail singkat (before → after, kalau ada)
- Filter: by user, by modul, by rentang tanggal, by jenis aksi
- Search bar (cari berdasarkan keyword)
- Pagination / infinite scroll (log bisa banyak)
- Tombol "Lihat Detail" per baris → modal/side panel menampilkan detail lengkap (raw before/after data)

---

## 4. Session Management

**Tujuan:** Admin bisa melihat sesi aktif tiap user dan memaksa logout user tertentu.

**Halaman:** `Admin > Session Management`

**Komponen UI:**
- Tabel sesi aktif dengan kolom:
  - Nama user
  - Device / browser info
  - IP address (opsional, kalau tersedia)
  - Waktu login
  - Waktu aktivitas terakhir
  - Tombol aksi "Force Logout"
- Konfirmasi modal saat force logout
- Filter by user

---

## 5. Notifikasi / Broadcast

**Tujuan:** Admin bisa kirim pengumuman ke semua anggota keluarga.

**Halaman:** `Admin > Broadcast`

**Komponen UI:**
- Form kirim notifikasi baru:
  - Judul
  - Isi pesan (textarea/rich text sederhana)
  - Target: semua user / pilih user tertentu (multi-select)
  - Jadwal kirim: langsung / terjadwal (date-time picker, opsional untuk versi awal)
  - Tombol "Kirim"
- Tabel riwayat broadcast yang pernah dikirim (judul, target, waktu kirim, status terkirim)

---

## 6. App Config / Settings

**Tujuan:** Pengaturan umum aplikasi.

**Halaman:** `Admin > Pengaturan`

**Komponen UI:**
- Form dengan field:
  - Nama keluarga / nama aplikasi
  - Timezone (dropdown)
  - Currency default (dropdown, untuk Money-track)
  - Logo/branding (upload image, opsional)
- Tombol "Simpan Perubahan"

---

## 7. Data Export / Backup

**Tujuan:** Admin bisa trigger backup/export data manual.

**Halaman:** `Admin > Backup & Export`

**Komponen UI:**
- Pilihan modul yang mau di-backup (checkbox list per modul)
- Tombol "Trigger Backup Sekarang"
- Tabel riwayat backup: waktu, modul, status (sukses/gagal), tombol download (kalau hasil backup bisa diunduh)

---

## Struktur Navigasi (Sidebar Admin)

```
Admin Panel
├── Dashboard (ringkasan: jumlah user, status modul, log terbaru)
├── RBAC Modul
├── Status Modul
├── Audit Log
├── Session Management
├── Broadcast
├── Pengaturan
└── Backup & Export
```

---

## Catatan Umum untuk FE

- Semua halaman butuh state loading, empty state, dan error state standar.
- Untuk halaman dengan toggle yang berdampak sistemik (Status Modul), pastikan ada konfirmasi + feedback jelas (toast/snackbar) setelah aksi berhasil/gagal.
- Desain sebaiknya mobile-responsive minimal untuk Dashboard & Broadcast (kemungkinan admin cek dari HP).
- Ini masih versi awal — CRUD Persons dan Maintenance Mode sengaja belum dimasukkan, menyusul di iterasi berikutnya.
