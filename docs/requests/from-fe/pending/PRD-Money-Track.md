# PRD — Money Track
**Versi:** 0.1 (Draft)
**Tanggal:** 26 Juli 2026
**Author:** Irfan
**Status:** Draft untuk direview sebelum masuk mockup

---

## 1. Latar Belakang & Masalah

Saat ini pencatatan keuangan rumah tangga (suami + istri) belum punya sistem terpusat. Masalah yang ingin diselesaikan:

- Sulit melihat gambaran pemasukan/pengeluaran gabungan vs individu.
- Uang tersebar di banyak rekening/e-wallet dan "kantong" (tabungan, investasi, transaksi harian) tanpa pencatatan konsisten.
- Transfer antar pasangan dan antar kantong sering tidak tercatat rapi, sehingga saldo tercatat vs saldo riil sering tidak imbang (perlu balancing manual).
- Penarikan tunai (cash withdrawal) sering lupa dicatat — tanggal & jumlahnya menguap.
- Belum ada pencatatan utang piutang dan wishlist yang terhubung ke tabungan riil.

## 2. Tujuan (Goals)

1. Satu aplikasi untuk mencatat & memantau keuangan 2 orang (suami & istri) sekaligus mendukung mode single user (belum berpasangan).
2. Transparansi: siapa nyumbang berapa, siapa pegang kantong apa, tanpa kehilangan privasi individu (kantong personal tetap personal, ada kantong bersama untuk urusan rumah tangga).
3. Minim friksi input — bisa dicatat cepat dari HP, direview/dianalisis dari desktop.
4. Data lokal adalah *source of truth*; spreadsheet sebagai cerminan/laporan yang enak dibagi/dibaca.
5. Reuse pola koneksi ke `family-roots` (couple linking) tanpa membuat money-track bergantung penuh padanya.

## 3. Non-Goals (Fase Ini)

- Tidak membuat sistem approval/persetujuan transaksi antar pasangan.
- Tidak membangun integrasi langsung ke API bank (open banking) — semua input manual dulu.
- Two-way sync ke spreadsheet **tidak** dikerjakan di fase awal — hanya dicatat sebagai kebutuhan masa depan (lihat §10).
- Tidak multi-currency (asumsi semua IDR).

## 4. User & Mode Pemakaian

| Mode | Deskripsi |
|---|---|
| **Single user** | Belum ada pasangan ter-link. Semua fitur jalan normal, hanya tanpa kantong bersama & transfer antar pasangan. |
| **Couple (linked)** | 2 person ter-link (manual atau via `family-roots` bila sudah ada). Fitur kantong bersama, transfer antar pasangan, dan laporan gabungan aktif. |

Linking ke `family-roots` bersifat **loose coupling** — money-track punya tabel referensi sendiri (`couple_link`) yang menyimpan `local_person_id` + `family_roots_person_id` (nullable). Kalau `family-roots` tidak aktif/tidak ada datanya, money-track tetap jalan mandiri dengan person yang didefinisikan manual.

---

## 5. Ringkasan Fitur

| # | Fitur | Prioritas |
|---|---|---|
| 1 | Dashboard pemasukan, pengeluaran, selisih (personal & gabungan) | Must |
| 2 | Card per person (suami/istri) + kantong per person | Must |
| 3 | Kantong bersama (joint pocket) | Must |
| 4 | Pencatatan transaksi (income & expense) | Must |
| 5 | Kategori expense & kategori income | Must |
| 6 | Transfer antar pasangan | Must |
| 7 | Transfer/pindah antar kantong | Must |
| 8 | Pencatatan penarikan tunai (cash withdrawal) | Must |
| 9 | Ringkasan tabungan (total, per person, per kantong) | Must |
| 10 | Wishlist | Should |
| 11 | Catatan utang piutang + reminder | Should |
| 12 | Multi-account (rekening bank/e-wallet) per person | Must |
| 13 | Input data awal (opening balance) | Must |
| 14 | Balancing / rekonsiliasi saldo | Must |
| 15 | Budget/limit per kategori (opsional, loose) | Could |
| 16 | Goal/target di kantong tabungan & investasi (opsional) | Could |
| 17 | Attachment bukti transaksi | Should |
| 18 | Audit log | Should |
| 19 | Reminder (utang jatuh tempo, budget lewat batas) | Should |
| 20 | Sync ke spreadsheet (one-way export) | Should |
| 21 | Sync dua arah spreadsheet ↔ DB (future) | Won't (fase ini) |

---

## 6. Detail Fitur & User Stories

### 6.1 Dashboard Ringkasan
- Sebagai user, saya bisa melihat total pemasukan, pengeluaran, dan selisih (net) dalam periode tertentu (bulan berjalan, custom range).
- Bisa difilter: gabungan (couple), atau per person (suami saja / istri saja).
- Breakdown pengeluaran per kategori (chart/list).

### 6.2 Person, Account & Kantong (Pocket)
Struktur berlapis:

```
Person (Suami / Istri)
  └─ Account (rekening/e-wallet: BCA, Jago, Mandiri, GoPay, Cash, ...)
       └─ Pocket (kantong logis: Transaksi, Tabungan, Investasi, custom)
```

Catatan penting:
- **Account** = tempat uang riil berada (bank/e-wallet/cash). Setiap account milik satu person.
- **Pocket** = kategori logis di level aplikasi, dipetakan ke satu Account. Semua bank diperlakukan sama di app — baik yang secara native support kantong (misal Jago) maupun yang tidak (misal BCA, uangnya tetap dipecah jadi kantong logis di app meski di banknya cuma satu saldo utuh).
- Kantong default per person: **Investasi, Tabungan, Transaksi** — bisa tambah kantong custom.
- **Kantong Bersama (Joint Pocket)**: kantong yang tidak dimiliki satu person, tapi keduanya bisa kontribusi & tarik dana (mis. dana darurat keluarga, tabungan anak). Muncul hanya jika mode Couple aktif.
- **Cash Holding**: representasi uang tunai fisik, diperlakukan sebagai Account tersendiri (per person, tipe `cash`), diisi lewat fitur Penarikan Tunai (§6.7).

### 6.3 Pencatatan Transaksi
- Input transaksi: tanggal, jumlah, tipe (income/expense), kategori, kantong asal, catatan, opsional attachment (foto struk/bukti).
- Kategori income & expense terpisah (lihat §6.4).
- Attachment disimpan sebagai file (gambar) terhubung ke transaksi, opsional.
- Setiap transaksi tercatat siapa yang input (`created_by`) untuk kebutuhan log & balancing.

### 6.4 Kategori
- **Kategori Expense**: mis. makan, transport, tagihan, hiburan, dll — custom per user/couple.
- **Kategori Income**: mis. gaji, bonus, freelance, hasil investasi, dll.
- Kategori bisa dibuat/diedit bebas, tidak hardcode.

### 6.5 Transfer Antar Pasangan
- Suami ↔ Istri, langsung tercatat sebagai pasangan transaksi (keluar di satu sisi, masuk di sisi lain) — bukan dua transaksi manual terpisah supaya konsisten.
- Tanpa approval — begitu diinput, langsung mempengaruhi saldo kedua pihak.
- Tercatat di audit log siapa yang input transfer.

### 6.6 Transfer Antar Kantong
- Pindah dana antar kantong milik person yang sama, atau dari kantong personal ke kantong bersama (dan sebaliknya).
- Tidak mengubah total saldo person, hanya redistribusi antar kantong.

### 6.7 Penarikan Tunai (Cash Withdrawal)
- Fitur khusus: catat penarikan dari Account bank → Cash Holding.
- Field: tanggal, jumlah, dari account mana, kantong asal (opsional bila ditarik dari kantong tertentu), catatan.
- Tujuannya spesifik menjawab masalah "lupa tanggal/jumlah tarik tunai" — begitu ditarik, otomatis:
  - Saldo Account bank berkurang.
  - Saldo Cash Holding bertambah.
- Cash Holding ini lah yang jadi sumber dana untuk transaksi expense bertipe cash selanjutnya.

### 6.8 Ringkasan Tabungan
- Total tabungan (semua kantong bertipe "Tabungan" + "Investasi", bisa dipisah).
- Filter: Total (gabungan), Suami saja, Istri saja.
- Breakdown per kantong.

### 6.9 Wishlist
- Daftar keinginan (nama item, estimasi harga, prioritas, gambar opsional).
- Opsional: link ke satu Pocket bertipe Tabungan/Investasi sebagai "goal" — progress wishlist otomatis mengikuti saldo kantong terkait, tidak perlu update manual dua kali.
- Wishlist tanpa kantong terkait tetap bisa berdiri sendiri (tracking manual).

### 6.10 Utang Piutang
- Catat: nama counterparty, arah (piutang/saya yang dipinjami, atau utang/saya yang pinjam), jumlah, tanggal, jatuh tempo, status (lunas/belum), catatan.
- Reminder otomatis mendekati jatuh tempo.
- Riwayat pembayaran cicilan (jika dibayar bertahap) — opsional tapi disiapkan skemanya dari awal biar gak perlu migrasi besar nanti.

### 6.11 Multi-Account
- Satu person bisa punya banyak Account (BCA, Jago, Mandiri, GoPay, OVO, Cash, dst).
- Setiap Account punya saldo sendiri, dan bisa dipecah ke beberapa Pocket (lihat §6.2).
- Account bertipe `cash` otomatis tersedia per person untuk menampung hasil penarikan tunai.

### 6.12 Input Data Awal (Opening Balance)
- Saat setup awal, user input saldo riil saat ini per Account & per Pocket (sesuai kondisi rekening/kantong yang sebenarnya).
- Tersimpan sebagai transaksi khusus tipe `opening_balance`, tanggal ditentukan user (tanggal mulai pencatatan).
- Bisa dilakukan lagi kapan saja bila menambah Account/Pocket baru di tengah jalan.

### 6.13 Balancing / Rekonsiliasi
- Fitur untuk mencocokkan saldo tercatat di app vs saldo riil di rekening/kantong.
- User input saldo riil terkini per Account/Pocket → sistem hitung selisih.
- Jika ada selisih, user bisa:
  - Cari & perbaiki transaksi yang belum/salah input, **atau**
  - Buat transaksi penyesuaian (`adjustment`) dengan catatan wajib diisi (supaya kelihatan di log ini penyesuaian, bukan transaksi asli).
- Semua adjustment tercatat di audit log agar bisa ditelusuri belakangan.

### 6.14 Budget/Limit per Kategori (Opsional)
- User *boleh* set limit bulanan per kategori expense, tapi tidak wajib (loose — kalau tidak diset, kategori itu tidak dipantau limitnya).
- Kalau pengeluaran kategori itu mendekati/lewat limit di bulan berjalan → muncul reminder.

### 6.15 Goal/Target di Kantong Tabungan & Investasi (Opsional)
- Per Pocket bertipe Tabungan/Investasi, user *boleh* set target amount + target tanggal.
- Progress bar otomatis dari saldo kantong berjalan vs target.

### 6.16 Attachment
- Upload foto/bukti (struk, bukti transfer) opsional di setiap transaksi & penarikan tunai.
- Disimpan sebagai file terpisah, direferensikan dari transaksi (mirip pola storage di `family-roots` yang sudah pakai Nextcloud — bisa dipertimbangkan reuse storage yang sama).

### 6.17 Audit Log
- Semua create/update/delete pada transaksi, transfer, adjustment tercatat: siapa, kapan, apa yang berubah (before/after).
- Dipakai untuk transparansi antar pasangan dan investigasi saat balancing.

### 6.18 Reminder
- Utang piutang jatuh tempo.
- Budget kategori mendekati/lewat limit (jika diaktifkan).
- (Opsional lanjutan) reminder rutin "sudah input transaksi hari ini belum?" — bisa dipikirkan di fase berikutnya.

### 6.19 Sync ke Spreadsheet (One-Way, Fase Ini)
- Local DB (Laravel/MySQL) sebagai *source of truth*.
- Export/push berkala (manual trigger atau scheduled) ke Google Sheets — read-only mirror untuk kebutuhan lihat cepat/share, bukan untuk diedit balik.
- Struktur sheet mengikuti struktur data utama: Transaksi, Saldo per Kantong, Ringkasan Bulanan.

---

## 7. Model Data (Ringkasan Entity)

```
Person
 ├─ id, name, role (suami/istri), family_roots_person_id (nullable)

CoupleLink
 ├─ person_a_id, person_b_id, linked_at

Account
 ├─ id, person_id, name, type (bank/ewallet/cash), bank_name (nullable)

Pocket
 ├─ id, account_id, owner_type (person/joint), category (transaksi/tabungan/investasi/custom)
 ├─ name, goal_amount (nullable), goal_date (nullable)

Category
 ├─ id, name, type (income/expense), scope (person/couple)

Transaction
 ├─ id, pocket_id, category_id, type (income/expense/opening_balance/adjustment)
 ├─ amount, date, note, attachment_id (nullable), created_by (person_id)

Transfer
 ├─ id, type (interpersonal/interpocket)
 ├─ from_pocket_id, to_pocket_id, amount, date, note, created_by

CashWithdrawal
 ├─ id, from_account_id, from_pocket_id (nullable), to_cash_account_id
 ├─ amount, date, note, created_by

Wishlist
 ├─ id, person_id, name, estimated_price, priority, linked_pocket_id (nullable)

DebtReceivable
 ├─ id, person_id, counterparty_name, direction (utang/piutang)
 ├─ amount, date, due_date, status, note

Budget
 ├─ id, category_id, month, limit_amount

Attachment
 ├─ id, file_path, uploaded_by, related_type, related_id

AuditLog
 ├─ id, actor_person_id, action, entity_type, entity_id, before, after, created_at
```

---

## 8. Platform & Input

- **Mobile (HP)**: fokus untuk input cepat — catat transaksi, penarikan tunai, transfer. UI ringkas, minim tap.
- **Desktop**: fokus untuk review — dashboard, laporan, balancing, kelola kategori/budget/goal, lihat audit log.
- Satu backend (Laravel API), frontend kemungkinan React (konsisten dengan pola `family-roots`), responsive untuk kedua form factor — bukan dua aplikasi terpisah.

## 9. Integrasi dengan Family-Roots

- Loose coupling via tabel `CoupleLink` yang menyimpan referensi opsional ke `family_roots_person_id`.
- Kalau couple sudah ter-link di `family-roots`, money-track bisa auto-suggest linking saat setup. Kalau belum ada `family-roots` sama sekali, user tetap bisa daftarkan pasangan manual di money-track sendiri.
- Tidak ada dependency keras — money-track tidak butuh `family-roots` untuk berjalan.

## 10. Pertimbangan Masa Depan (Out of Scope Sekarang)

- **Two-way sync spreadsheet ↔ DB**: butuh strategi conflict resolution (versioning/timestamp per row) — dikerjakan setelah semua fitur inti stabil.
- Approval flow untuk transfer antar pasangan.
- Notifikasi push (bukan sekadar reminder in-app).
- Multi-currency.
- Integrasi API bank langsung (open banking).

## 11. Keputusan (resolved 28 Jul 2026)

| Topik | Keputusan |
|-------|-----------|
| Scope v1 | Fitur **#1–#19**. Out of scope: #20 spreadsheet one-way, #21 two-way sync |
| Account ↔ Pocket | **1 Account → banyak Pocket** (bukan 1 pocket multi-bank) |
| Privacy | Single = pribadi. Couple = **sharing penuh, tanpa privacy** antar pasangan |
| Default kategori/kantong | Seed bawaan, **bisa diubah/ditambah** sejak setup |
| Cicilan utang | Entity **`DebtPayment`** dari awal |
| Attachment | Reuse pola media upload existing (purpose baru money-track) |
| Reminder v1 | **In-app** (badge + list), bukan email/WA |
| Auth ↔ Person | Login user → 1 Person; di couple mode keduanya full read/write |

---

**Next step:** kontrak API (`MONEY-TRACK-API.md`) + layout FE untuk verifikasi UI.
