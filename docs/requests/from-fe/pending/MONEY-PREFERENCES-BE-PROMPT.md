# Prompt BE — User Preferences API (Money Track)

> Dokumen request **FE → BE**. Lempar prompt ini ke AI BE di repo `family-tree-api`.
>
> Related: [`MONEY-TRACK-API.md`](./MONEY-TRACK-API.md) (kontrak besar Money Track).

---

## 1. Konteks

Halaman FE **Pengaturan** (`/money/settings`) menyimpan preferensi user, dan
form **Catat Transaksi** memakainya untuk auto-pilih kantong/kategori + preset
nominal.

Saat ini FE sudah menulis preferensi lewat helper lokal (localStorage) sebagai
cache, **tapi butuh persistensi di server** supaya konsisten lintas device dan
lintas browser. FE sudah memanggil endpoint di bawah dan fallback ke cache bila
endpoint belum ada — jadi aman untuk menunggu.

Contoh perilaku:

- User menetapkan **kantong default pengeluaran** → tiap buka form Catat,
  kantong itu otomatis terpilih (masih bisa diganti manual).
- **Override per-person** dipakai saat scope = person (mode couple), kalau
  tidak ada override → pakai default `shared`.

---

## 2. Endpoint

Auth + header `X-Module-Unlock` sama seperti route `/money/*` lain.

### `GET /money/preferences`

Balikan preferensi workspace user yang login. Jika belum pernah disimpan,
balikan objek default (jangan 404).

### `PUT /money/preferences`

Body = objek preferensi utuh (replace), lalu balikan objek tersimpan.

### Response / body shape

```json
{
  "defaultTxType": "expense",
  "quickAmounts": [10000, 20000, 50000, 100000, 200000],
  "shared": {
    "expensePocketId": 101,
    "incomePocketId": 102,
    "expenseCategoryId": 3,
    "incomeCategoryId": 10
  },
  "persons": {
    "1": {
      "expensePocketId": 101,
      "incomePocketId": 102,
      "expenseCategoryId": 3,
      "incomeCategoryId": 10
    }
  }
}
```

| Field | Tipe | Ket |
|-------|------|-----|
| `defaultTxType` | `"expense"` \| `"income"` | Tipe yang aktif saat form dibuka |
| `quickAmounts` | `number[]` | Preset nominal numpad, digit rupiah, maks 6 |
| `shared` | object | Default scope "Gabungan" |
| `shared.expensePocketId` | `number \| null` | Kantong default pengeluaran |
| `shared.incomePocketId` | `number \| null` | Kantong default pemasukan |
| `shared.expenseCategoryId` | `number \| null` | Kategori default pengeluaran |
| `shared.incomeCategoryId` | `number \| null` | Kategori default pemasukan |
| `persons` | `Record<personId, object>` | Override per-person; shape sama dengan `shared` |

Catatan:

- `null` = tidak ada default (FE fallback ke opsi pertama).
- FE mengirim ID sebagai **number** (lihat contoh). FE menerima number maupun string.
- Validasi ringan: pastikan `expensePocketId`/`incomePocketId` milik workspace &
  tidak archived; `*CategoryId` benar tipe-nya. Kalau tidak valid, simpan `null`
  (jangan error 500).
- `persons` key = `personId` Money Track (bukan userId).

---

## 3. Penyimpanan

Saran: 1 baris per workspace/user.

```sql
CREATE TABLE mt_preferences (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  workspace_id  BIGINT NOT NULL,        -- sesuaikan nama kolom workspace yg dipakai modul lain
  user_id       BIGINT NULL,            -- NULL = default workspace
  default_tx_type   VARCHAR(10) NOT NULL DEFAULT 'expense',
  quick_amounts     JSON NOT NULL,
  shared            JSON NOT NULL,
  persons           JSON NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_workspace_user (workspace_id, user_id)
);
```

Kalau Money Track workspace-nya milik satu user (bukan couple-shared), cukup
1 baris per `user_id`.

---

## 4. Acceptance

- `GET` mengembalikan default bila belum ada data (HTTP 200, bukan 404).
- `PUT` menyimpan replace penuh dan mengembalikan objek yang sama.
- ID yang tidak valid / bukan milik workspace → dinormalkan ke `null`, bukan error.
- `quickAmounts` di-dedupe, hanya angka > 0, dibatasi 6 item.
- Endpoint sejalan dengan pola auth `/money/*` (refresh token, module unlock).
