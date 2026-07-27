# Owner-only Update/Delete — Events & Memoriam Tributes

Status: **implemented (BE + FE)**

## Keputusan produk

| Resource | Create | Update / Delete | Siapa boleh |
|----------|--------|-----------------|-------------|
| **Event** | semua member login | `PATCH` + `DELETE` | hanya `createdById === selfPersonId` |
| **Tribute** | author = self | `PATCH` + `DELETE` | hanya `authorId === selfPersonId` |

- Memorial page sendiri tidak di-CRUD. Yang di-CRUD adalah **tribute**.
- BE enforce ownership; FE pakai flag `canManage`.

---

## Events

### Response fields

```ts
{
  id: number
  // ...field existing...
  createdById: number
  canManage: boolean   // selfPersonId === createdById
}
```

`POST /events` set `createdById` dari JWT (bukan body client).

### AuthZ

| Method | Path | AuthZ |
|--------|------|--------|
| PATCH | `/api/v1/events/:id?focusPersonId=` | hanya creator |
| DELETE | `/api/v1/events/:id?focusPersonId=` | hanya creator |

### Sample — POST /events → 201

```json
{
  "data": {
    "selfPersonId": 83,
    "event": {
      "id": 20,
      "title": "Smoke Owner Event",
      "createdById": 83,
      "canManage": true,
      "isRestricted": false,
      "canAccess": true
    }
  }
}
```

### Sample — PATCH event milik orang lain → 403

```json
{
  "error": {
    "code": "EVENT_MANAGE_FORBIDDEN",
    "message": "Hanya pembuat acara yang boleh mengubah atau menghapus."
  }
}
```

### Error codes

| Code | HTTP | Kapan |
|------|------|--------|
| `EVENT_NOT_FOUND` | 404 | id tidak ada / tidak visible |
| `EVENT_MANAGE_FORBIDDEN` | 403 | login tapi bukan creator |
| `EVENT_ACCESS_FORBIDDEN` | 403 | detail restricted (bukan owner gate) |
| `EVENT_VALIDATION_FAILED` | 400 | validasi body |

---

## Memoriam tributes

### Endpoints

| Method | Path |
|--------|------|
| POST | `/api/v1/memoriam/:deceasedId/tributes?focusPersonId=` |
| PATCH | `/api/v1/memoriam/:deceasedId/tributes/:tributeId?focusPersonId=` |
| DELETE | `/api/v1/memoriam/:deceasedId/tributes/:tributeId?focusPersonId=` |

### Response fields

```ts
{
  id: number
  deceasedId: number
  authorId: number
  authorName?: string
  content: string
  photoUrls: string[]
  createdAt: string
  updatedAt: string
  canManage: boolean
}
```

### Keputusan implementasi

| Pertanyaan | Jawaban |
|------------|---------|
| PATCH tribute media? | **Replace-all** dari daftar final FE (`mediaIds` + `photoUrls`) |
| POST tribute response? | Single `{ tribute }` (bukan full list) |

### Sample — POST tribute → 201

```json
{
  "data": {
    "selfPersonId": 83,
    "tribute": {
      "id": 9,
      "deceasedId": 17,
      "authorId": 83,
      "authorName": "...",
      "content": "<p>Smoke tribute</p>",
      "photoUrls": [],
      "createdAt": "2026-07-25T...",
      "updatedAt": "2026-07-25T...",
      "canManage": true
    }
  }
}
```

### Sample — DELETE tribute

```json
{ "data": { "deleted": true } }
```

### Error codes

| Code | HTTP | Kapan |
|------|------|--------|
| `MEMORIAL_ACCESS_FORBIDDEN` | 403 | tidak punya akses memorial |
| `TRIBUTE_NOT_FOUND` | 404 | tributeId tidak ada / mismatch deceasedId |
| `TRIBUTE_MANAGE_FORBIDDEN` | 403 | bukan author |
| `TRIBUTE_VALIDATION_FAILED` | 400 | content kosong / >8 foto / HTML invalid |
| `MEMORIAL_NOT_DECEASED` | 400 | existing |

---

## FE notes

- Events list: tombol Edit/Hapus hanya jika `canManage === true` (mock: selalu true).
- Tribute card: Edit/Hapus hanya jika `canManage === true` (mock: `authorId === me.id`).
- `createMemorialTribute` / `updateMemorialTribute` parse `{ tribute }`.
- `createEvent` / `updateEventById` parse `{ event }`.
- PATCH tribute kirim `replaceMedia: true` → selalu kirim `mediaIds` + `photoUrls` final.
