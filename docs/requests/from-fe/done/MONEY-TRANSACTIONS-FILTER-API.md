# Money Transactions — Filter & list enrichment (FE → BE)

## Status

| Layer | Status |
|-------|--------|
| BE | ✅ shipped — enrichment DTO + `q`/`uncategorized` + `GET /money/activity` |
| FE | ✅ wired — filter server-side via `/money/activity` (dummy tetap client-side) |

FE sudah menampilkan filter: **tipe, kategori, kantong, rentang tanggal, pencarian teks**.  
Untuk data besar / pagination akurat, butuh dukungan BE di bawah.

---

## Masalah sekarang

1. **DTO transaksi tidak punya `categoryName`** — FE harus join `/money/categories` sendiri. Rawan mismatch & ekstra round-trip.
2. **Tidak ada search teks (`q`)** — filter judul/catatan hanya bisa di client setelah load.
3. **List `/money/transactions` hanya income/expense/opening/adjustment** — transfer & cash withdrawal ada endpoint terpisah, jadi tab “Transfer / Tarik tunai” di FE tidak terisi dari API feed yang sama.
4. **Pagination `pageSize` default kecil** — FE load 50 lalu filter lokal; hasil filter bisa kosong padahal data ada di halaman lain.
5. **Tidak ada flag `uncategorized`** — FE ingin filter `categoryId` null (opening/adjustment / tanpa kategori).

---

## Request perubahan

### 1. Enrich `MoneyTransactionDto` (list + detail)

Tambah field opsional (non-breaking):

```json
{
  "id": 55,
  "pocketId": 101,
  "pocketName": "Transaksi",
  "accountName": "BCA",
  "categoryId": 3,
  "categoryName": "Makan",
  "categoryIcon": "🍜",
  "type": "expense",
  "amount": 85000,
  "date": "2026-07-26",
  "note": "Makan siang",
  "createdByPersonId": 1,
  "personId": 1,
  "personName": "Irfan"
}
```

| Field | Keterangan |
|-------|------------|
| `categoryName` / `categoryIcon` | null jika `categoryId` null |
| `pocketName` / `accountName` | untuk tampilan list tanpa N+1 |
| `personId` / `personName` | owner pocket (atau joint → `personId: null`) |

### 2. Query baru di `GET /money/transactions`

Sudah ada: `from`, `to`, `personId`, `pocketId`, `type`, `categoryId`, `page`, `pageSize`.

Tambah:

| Param | Tipe | Keterangan |
|-------|------|------------|
| `q` | string | cari di `note` (case-insensitive, partial) |
| `uncategorized` | `true`/`false` | jika `true`, hanya `category_id IS NULL` (abaikan `categoryId`) |

Contoh:

```
GET /money/transactions?type=expense&categoryId=3&from=2026-07-01&to=2026-07-31&q=makan&page=1&pageSize=50
GET /money/transactions?uncategorized=true
```

### 3. (Opsional tapi berguna) Unified activity feed

Agar filter tipe `transfer` / `cash_withdrawal` di halaman Transaksi FE konsisten:

**Opsi A (disarankan):** `GET /money/activity`  
menggabungkan transactions + transfers + cash withdrawals, dengan shape:

```json
{
  "items": [
    {
      "id": "txn:55",
      "kind": "expense",
      "title": "Makan siang",
      "categoryName": "Makan",
      "categoryId": 3,
      "personId": 1,
      "personName": "Irfan",
      "pocketLabel": "Transaksi · BCA",
      "pocketId": 101,
      "amount": 85000,
      "date": "2026-07-26",
      "signed": "neg"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 120
}
```

Query mirror filter transaksi + `kind` (`income|expense|transfer|cash_withdrawal|all`).

**Opsi B:** tetap endpoint terpisah; FE fetch 3 list lalu merge (lebih berat, pagination jelek).

---

## Prioritas

| # | Item | Priority |
|---|------|----------|
| 1 | `categoryName` (+ pocket/person labels) di DTO | P0 |
| 2 | `q` + `uncategorized` query | P0 |
| 3 | Unified `/money/activity` (atau setara) | P1 |

---

## Acceptance

- [ ] List transaksi return `categoryName` tanpa FE join manual
- [ ] Filter `categoryId` + `from`/`to` + `q` dihormati server-side + `total` akurat
- [ ] `uncategorized=true` hanya baris tanpa kategori
- [ ] (P1) FE bisa filter Transfer / Tarik tunai dari satu feed berpaginasi

---

## Catatan FE sementara

Hingga BE ready, halaman Transaksi:
- filter **client-side** atas bundle yang sudah di-load
- resolve nama kategori dari `/money/categories`
- transfer/cash di mode API mungkin kosong / tidak lengkap di list
