# Notifications Inbox API

## Status

| Layer | Status |
|-------|--------|
| BE | ✅ shipped — `/api/v1/notifications*` |
| FE | ✅ wired — modal notifikasi (bell) + badge |

Smoke: admin kirim broadcast → login penerima → klik lonceng.

---

## Endpoints

Base: `/api/v1/notifications`  
Auth: Bearer (+ `X-Session-Id` bila ada).  
Akses: hanya notifikasi milik user login. `type` selalu `"broadcast"` (dari `broadcast_id`).

### 1. List notifikasi

`GET /api/v1/notifications`

**Query:**

| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| `page` | number | 1 | |
| `pageSize` | number | 20 | max 50 |
| `unreadOnly` | `true`/`false` | false | filter belum dibaca |

**Response `data`:**

```json
{
  "items": [
    {
      "id": 1,
      "title": "Gathering Sabtu",
      "body": "<p>Halo keluarga</p>",
      "type": "broadcast",
      "broadcastId": 12,
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-07-27T10:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 3,
  "unreadCount": 2
}
```

Pagination di dalam `data` (bukan top-level `meta`).

### 2. Unread count (badge)

`GET /api/v1/notifications/unread-count`

```json
{ "unreadCount": 2 }
```

### 3. Tandai satu dibaca

`PATCH /api/v1/notifications/:id/read`

**Response `data`:** item notifikasi terbaru (`isRead: true`, `readAt` terisi).

### 4. Tandai semua dibaca

`POST /api/v1/notifications/read-all`

```json
{ "updated": 2 }
```

---

## FE mapping

| FE | Endpoint |
|----|----------|
| `fetchNotifications` | `GET /notifications` |
| `fetchUnreadNotificationCount` | `GET /notifications/unread-count` |
| `markNotificationRead` | `PATCH /notifications/:id/read` |
| `markAllNotificationsRead` | `POST /notifications/read-all` |

UI: modal via `NotificationBell` (Launcher + Navbar). Route `/inbox` redirect ke `/?notifications=1`.
