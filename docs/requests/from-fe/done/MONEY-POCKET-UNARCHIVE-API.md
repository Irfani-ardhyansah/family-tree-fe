# Money Pocket — Unarchive + includeArchived (FE → BE)

## Status

| Layer | Status |
|-------|--------|
| BE | ✅ shipped — `includeArchived` di list + `POST /money/pockets/:id/unarchive` |
| FE | ✅ wired — fetch `?includeArchived=true`, section “Pocket di-archive” + Pulihkan |

---

## Masalah

`GET /money/pockets` default **exclude** archived (`archived_at IS NULL`). Repository sudah punya flag `includeArchived`, tapi service belum meneruskan query → FE tidak pernah melihat pocket archived, jadi section restore kosong.

---

## Perubahan BE

1. `GET /money/pockets?includeArchived=true` — sertakan pocket archived
2. `POST /money/pockets/:id/unarchive` — set `archivedAt` → `null` (idempotent)

---

## FE behavior

- Bundle load: `fetchMoneyPockets` selalu pakai `includeArchived=true`
- Aktif vs archived di-split di client
- Halaman Kantong: section **Pocket di-archive** + tombol **Pulihkan**
